# QuranPoster

Auto-generate vertical Quran reels (background + gradient overlay + synced Uthmani
ayah text + recitation) and publish to TikTok via Buffer. Designed to run as a
scheduled task on a Coolify server.

## Approach

**Curated path (v1):** you pick `surah + ayah range + reciter`. Text comes from
the Quran API (Uthmani, full shakl) and audio comes from **everyayah.com** as
per-ayah MP3s — so each ayah's duration *is* its timing. Sync is exact and free;
no ASR, no forced alignment, no AI error. (A YouTube + Whisper path for arbitrary
recitations is planned as an optional second input mode.)

Text rendering uses **Amiri Quran** rendered in headless Chromium (correct Arabic
shaping + diacritics), not baked PNGs — so text is crisp, restylable, and sits on
the gradient overlay.

## Pipeline

```
config → quran API (text+translation) → everyayah (per-ayah audio + exact timing)
       → TimedAyah[] IR → background (Pexels/Unsplash portrait)
       → Chromium still-per-ayah → ffmpeg slideshow + audio → MP4 (1080×1920)
       → MinIO (public URL) → Buffer → TikTok → cleanup
```

## Status / roadmap

- [x] **M1** Scaffold: TS project, config schema (zod), Dockerfile, env
- [x] **M2** Quran text + translation (alquran.cloud), Basmala-strip normalization
- [x] **M3** everyayah audio download + exact per-ayah timing + concat → `TimedAyah[]` IR
- [x] **M4** Background fetch (Pexels/Unsplash portrait, CK2/CK3) + gradient fallback
- [x] **M5** Chromium render: one still PNG per ayah (Amiri Quran + gradient overlay)
- [x] **M6** ffmpeg assemble: timed slideshow + audio mux → MP4 (`render` command)
- [x] **CI/CD** Dockerfile + GitHub Actions + Coolify redeploy webhook
- [ ] **M7** MinIO upload + Buffer publish (reuse 9at3a-api patterns) behind `--publish`
- [ ] **M8** Cleanup (3-layer) + JSONL run ledger + interactive wizard + Coolify cron

## Usage (current)

```bash
npm install
cp .env.example .env        # fill keys as stages need them

# Stage 1: fetch text + audio, compute timing, write ir.json into work/
npm run dev -- fetch --surah 112 --from 1 --to 4 --reciter alafasy --translation en.sahih
# or from a job file:
npm run dev -- fetch --job examples/job.example.json
```

Output lands in `work/<surah>_<from>-<to>_<reciter>__<tag>/`:
`audio/*.mp3` (per ayah), `passage.m4a` (concatenated), `ir.json` (the timed IR).

## Deployment & CI/CD (Coolify)

The repo builds into a single Docker image (`Dockerfile`) with Chromium, ffmpeg,
yt-dlp and Arabic fonts baked in.

**Auto-redeploy — two options:**

1. **Coolify native (simplest):** create the resource from this Git repo and enable
   *Auto Deploy*. Coolify installs its GitHub App / deploy key and rebuilds on every
   push to `main`. No Actions needed.

2. **GitHub Actions gated deploy (`.github/workflows/deploy.yml`):** every push/PR
   runs typecheck + build + a Docker build; pushes to `main` then hit Coolify's
   deploy webhook. Set two repo secrets:
   - `COOLIFY_WEBHOOK` — the resource's *Deploy Webhook* URL (Coolify → resource →
     Webhooks)
   - `COOLIFY_TOKEN` — a Coolify API token (Bearer)

**Running on schedule:** add a Coolify *Scheduled Task* on this resource with a cron
expression and the command, e.g. daily at 06:00:

```
node dist/cli.js render --job /config/job.json --publish
```

Mount your `job.json` and a `.env` (with `CK*`, `MINIO_*`, `BUFFER_*`) into the
container. Publishing (M7) lands next; until then drop `--publish` for render-only.

## Reciters

See `src/quran/reciters.ts`. Use an id (`alafasy`, `husary`, `minshawy`, …) or any
raw everyayah folder string (e.g. `Alafasy_128kbps`).

## Translations

Any alquran.cloud edition identifier, e.g. `en.sahih`, `fr.hamidullah`,
`""` for Arabic-only.
