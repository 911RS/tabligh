import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { randomBytes } from 'node:crypto';
import { loadStore, updateSettings, updateSecrets, markSetupComplete, settings, secrets, type Settings } from './store/store.js';
import { hashPassword } from './auth.js';
import { startPanel } from './panel/daemon.js';
import { openBrowser } from './util/openBrowser.js';

const C = {
  b: (s: string) => `\x1b[1m${s}\x1b[0m`,
  g: (s: string) => `\x1b[32m${s}\x1b[0m`,
  y: (s: string) => `\x1b[33m${s}\x1b[0m`,
  dim: (s: string) => `\x1b[2m${s}\x1b[0m`,
  cyan: (s: string) => `\x1b[36m${s}\x1b[0m`,
};

/**
 * Interactive terminal setup wizard: `tabligh init`.
 * Walks through keys, storage, publishing, schedule, branding and the panel
 * password, then writes everything to the persisted store.
 */
export async function runWizard(): Promise<void> {
  const rl = createInterface({ input: stdin, output: stdout });
  const s = settings();
  const sec = secrets();

  const ask = async (q: string, def = ''): Promise<string> => {
    const hint = def ? C.dim(` (${def})`) : '';
    const a = (await rl.question(`  ${q}${hint} ${C.dim('›')} `)).trim();
    return a || def;
  };
  const askSecret = async (q: string, existing = ''): Promise<string> => {
    const masked = existing ? C.dim(' (leave blank to keep current)') : '';
    const a = (await rl.question(`  ${q}${masked} ${C.dim('›')} `)).trim();
    return a || existing;
  };
  const yesNo = async (q: string, def: boolean): Promise<boolean> => {
    const a = (await rl.question(`  ${q} ${C.dim(def ? '(Y/n)' : '(y/N)')} ${C.dim('›')} `)).trim().toLowerCase();
    if (!a) return def;
    return a === 'y' || a === 'yes';
  };

  console.log(`\n${C.g('Tabligh — setup')}\n${C.dim('   Answer a few questions. Press Enter to accept the default.')}\n`);

  // ── Backgrounds ──────────────────────────────────────────────────────────
  console.log(C.b('\n▸ Backgrounds'));
  const bgSourceRaw = (await ask('Source: auto / pexels / unsplash / local', s.content.backgroundSource)).toLowerCase();
  const bgSource = (['auto', 'pexels', 'unsplash', 'local'].includes(bgSourceRaw) ? bgSourceRaw : 'auto') as Settings['content']['backgroundSource'];
  let bgLocalDir = s.content.backgroundLocalDir;
  let pexelsKey = sec.pexelsKey;
  let unsplashKey = sec.unsplashKey;
  if (bgSource === 'local') {
    bgLocalDir = await ask('Folder of your own portrait images', bgLocalDir);
  } else {
    pexelsKey = await askSecret('Pexels API key', sec.pexelsKey);
    unsplashKey = await askSecret('Unsplash Access Key', sec.unsplashKey);
  }

  // ── Storage ──────────────────────────────────────────────────────────────
  console.log(C.b('\n▸ Object storage (public URL the publisher fetches the video from)'));
  const minioEndpoint = await ask('S3/MinIO endpoint host', sec.minio.endpoint);
  const minioPort = Number(await ask('Port', String(sec.minio.port || 9000)));
  const minioSSL = await yesNo('Use SSL?', sec.minio.useSSL);
  const minioAccessKey = await askSecret('Access key', sec.minio.accessKey);
  const minioSecretKey = await askSecret('Secret key', sec.minio.secretKey);
  const minioBucket = await ask('Bucket name', sec.minio.bucket || 'tabligh');
  const minioPublicUrl = await ask('Public base URL (e.g. https://storage.example.com)', sec.minio.publicUrl);

  // ── Publishing ───────────────────────────────────────────────────────────
  console.log(C.b('\n▸ Publishing via Buffer (leave blank to skip / configure later)'));
  const bufferToken = await askSecret('Buffer access token', sec.bufferToken);
  const csv = (v: string[]) => v.join(',');
  const tiktok = (await ask('TikTok channel ids (comma-separated)', csv(s.publish.channels.tiktok))).split(',').map((x) => x.trim()).filter(Boolean);
  const instagram = (await ask('Instagram channel ids', csv(s.publish.channels.instagram))).split(',').map((x) => x.trim()).filter(Boolean);
  const facebook = (await ask('Facebook channel ids', csv(s.publish.channels.facebook))).split(',').map((x) => x.trim()).filter(Boolean);
  const youtube = (await ask('YouTube channel ids', csv(s.publish.channels.youtube))).split(',').map((x) => x.trim()).filter(Boolean);

  // ── Schedule ─────────────────────────────────────────────────────────────
  console.log(C.b('\n▸ Schedule'));
  const tz = await ask('Timezone', s.schedule.tz);
  const times = (await ask('Post times (comma-separated HH:MM)', s.schedule.times.join(','))).split(',').map((x) => x.trim()).filter(Boolean);

  // ── Content ──────────────────────────────────────────────────────────────
  console.log(C.b('\n▸ Content'));
  const translationEdition = await ask('Translation edition (e.g. en.sahih, fr.hamidullah, "" for none)', s.content.translationEdition);
  const randomMinAyahs = Number(await ask('Min ayahs per reel', String(s.content.randomMinAyahs)));
  const randomMaxAyahs = Number(await ask('Max ayahs per reel', String(s.content.randomMaxAyahs)));
  const basmalaAlways = await yesNo('Add Bismillah before EVERY passage? (passages starting at ayah 1 always get it)', s.content.basmala === 'always');
  const basmala = (basmalaAlways ? 'always' : 'off') as Settings['content']['basmala'];

  // ── Branding ─────────────────────────────────────────────────────────────
  console.log(C.b('\n▸ Branding'));
  const tplRaw = (await ask('Template: classic / glass / noor', s.branding.template)).toLowerCase();
  const template = (['classic', 'glass', 'noor'].includes(tplRaw) ? tplRaw : 'classic') as Settings['branding']['template'];
  const karaokeEnabled = await yesNo('Karaoke word-fill?', s.branding.karaokeEnabled);
  const textFillColor = await ask('Filled text color (hex)', s.branding.textFillColor || '#ffffff');
  const watermarkEnabled = await yesNo('Show corner logo watermark? (put a PNG at assets/logo.png)', s.branding.watermarkEnabled);

  // ── Panel ────────────────────────────────────────────────────────────────
  console.log(C.b('\n▸ Control panel'));
  let panelPasswordHash = sec.panelPasswordHash;
  const pw = await askSecret('Panel password', panelPasswordHash ? 'keep current' : '');
  if (pw && pw !== 'keep current') panelPasswordHash = hashPassword(pw);
  const triggerToken = sec.triggerToken || randomBytes(16).toString('hex');

  // ── Finish ───────────────────────────────────────────────────────────────
  const startNow = await yesNo('Start the control panel now?', true);
  rl.close();

  // ── Persist ──────────────────────────────────────────────────────────────
  updateSecrets({
    pexelsKey, unsplashKey, bufferToken, panelPasswordHash, triggerToken,
    minio: { endpoint: minioEndpoint, port: minioPort, useSSL: minioSSL, accessKey: minioAccessKey, secretKey: minioSecretKey, bucket: minioBucket, publicUrl: minioPublicUrl },
  });
  updateSettings({
    schedule: { tz, times, enabled: true },
    content: { translationEdition, randomMinAyahs, randomMaxAyahs, backgroundSource: bgSource, backgroundLocalDir: bgLocalDir, basmala },
    branding: { template, karaokeEnabled, textFillColor, watermarkEnabled },
    publish: { channels: { tiktok, instagram, facebook, youtube } },
  });
  markSetupComplete();
  loadStore(); // ensure persisted

  const port = Number(process.env.PORT ?? '1998');
  const url = `http://localhost:${port}/`;
  const line = '─'.repeat(url.length + 18);
  console.log(`\n  ${C.g('┌' + line + '┐')}`);
  console.log(`  ${C.g('│')}  ${C.b('✓ Setup complete')}${' '.repeat(line.length - 15)}${C.g('│')}`);
  console.log(`  ${C.g('│')}  ${C.dim('Control panel:')}  ${C.cyan(url)}   ${C.g('│')}`);
  console.log(`  ${C.g('└' + line + '┘')}`);
  console.log(`  ${C.dim('Log in with your panel password. Manage everything anytime with')} ${C.cyan('tabligh')}${C.dim('.')}\n`);

  if (startNow) {
    console.log(`  ${C.dim('Starting the panel…')}`);
    const st = await startPanel();
    if (st.running) {
      console.log(`  ${C.g('●')} ${C.dim('Panel is up at')} ${C.cyan(url)}`);
      openBrowser(url);
    } else {
      console.log(`  ${C.y('!')} ${C.dim('Could not confirm the panel started — run')} ${C.cyan('tabligh serve')} ${C.dim('manually.')}`);
    }
  } else {
    console.log(`  ${C.dim('Start it later with')} ${C.cyan('tabligh serve')} ${C.dim('or the')} ${C.cyan('tabligh')} ${C.dim('menu.')}`);
  }
}
