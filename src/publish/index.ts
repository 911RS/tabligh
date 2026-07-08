import { rm, readdir, stat } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { env } from '../config.js';
import { log } from '../util/log.js';
import type { ReelJob } from '../types.js';
import { extractThumbnail } from '../video/thumbnail.js';
import { uploadFile, deleteObject, listStaleObjects } from './minio.js';
import { publishToTiktok, type PostMode } from './buffer.js';
import { appendEntry } from './ledger.js';
import type { PhotoCredit } from '../render/background.js';

/** Default caption: surah + ayah range + reciter + photo credit + hashtags. */
export function buildCaption(reel: ReelJob, credit?: PhotoCredit): string {
  const range =
    reel.ayahFrom === reel.ayahTo ? `Ayah ${reel.ayahFrom}` : `Ayah ${reel.ayahFrom}-${reel.ayahTo}`;
  const tag = reel.surahEnglishName.replace(/[^A-Za-z]/g, '');
  const lines = [
    `📖 Surah ${reel.surahEnglishName} — ${range}`,
    `🎙️ Recited by ${reel.reciterName}`,
  ];
  if (credit) lines.push(`📷 Background: photo by ${credit.author} on ${credit.source} (${credit.url})`);
  lines.push('');
  lines.push(`#Quran #Islam #Recitation #Quranic #${tag} #QuranRecitation #Muslim #Deen #fyp`);
  return lines.join('\n');
}

export interface PublishOpts {
  mode?: PostMode; // default addToQueue
  dueAt?: string;
  caption?: string;
  credit?: PhotoCredit;
  /** Delete the local work dir after a successful post (default true). */
  cleanupLocal?: boolean;
}

/**
 * Publish a rendered reel: thumbnail → MinIO upload → Buffer(TikTok) post →
 * ledger. On success the local work dir is removed (Buffer fetches from MinIO;
 * the MinIO object is pruned later by `prune`).
 */
export async function publishReel(reel: ReelJob, mp4Path: string, opts: PublishOpts = {}): Promise<string[]> {
  const mode = opts.mode ?? 'addToQueue';
  const stamp = basename(reel.workDir);

  log.step('Extracting thumbnail…');
  const thumb = await extractThumbnail(mp4Path, reel.workDir);

  log.step('Uploading to MinIO…');
  const video = await uploadFile(mp4Path, `${stamp}.mp4`, 'video/mp4');
  const thumbUp = await uploadFile(thumb, `${stamp}.jpg`, 'image/jpeg');
  log.ok(`Video → ${video.url}`);

  log.step(`Posting to Buffer/TikTok (mode: ${mode})…`);
  const postIds = await publishToTiktok({
    text: opts.caption ?? buildCaption(reel, opts.credit),
    videoUrl: video.url,
    thumbnailUrl: thumbUp.url,
    mode,
    dueAt: opts.dueAt,
  });

  await appendEntry({
    ts: new Date().toISOString(),
    surah: reel.surah,
    ayahFrom: reel.ayahFrom,
    ayahTo: reel.ayahTo,
    reciter: reel.reciter,
    postIds,
    videoObject: video.objectName,
    thumbObject: thumbUp.objectName,
  });

  if (opts.cleanupLocal !== false) {
    await rm(reel.workDir, { recursive: true, force: true });
    log.ok('Removed local work dir (media lives on MinIO until prune)');
  }
  return postIds;
}

/**
 * Remove stale assets: MinIO objects older than MINIO_RETENTION_HOURS and local
 * work/ dirs older than RETENTION_DAYS. Safe to run at the start of every cron.
 */
export async function prune(): Promise<void> {
  const now = Date.now();

  // MinIO objects (only if configured)
  if (env.minio.endpoint) {
    try {
      const stale = await listStaleObjects(env.minioRetentionHours * 3600_000, now);
      for (const obj of stale) await deleteObject(obj);
      log.ok(`Pruned ${stale.length} stale MinIO object(s)`);
    } catch (e) {
      log.warn(`MinIO prune skipped: ${e instanceof Error ? e.message : e}`);
    }
  }

  // Local work dirs
  const workRoot = join(process.cwd(), 'work');
  const cutoff = now - env.retentionDays * 86_400_000;
  let removed = 0;
  try {
    for (const name of await readdir(workRoot)) {
      const p = join(workRoot, name);
      const s = await stat(p).catch(() => null);
      if (s?.isDirectory() && s.mtimeMs < cutoff) {
        await rm(p, { recursive: true, force: true });
        removed++;
      }
    }
  } catch { /* work/ may not exist yet */ }
  log.ok(`Pruned ${removed} old local work dir(s)`);
}
