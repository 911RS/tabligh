# ── Build stage: compile TS → dist ────────────────────────────────────────
FROM node:22-bookworm-slim AS builder
WORKDIR /app
COPY package*.json ./
ENV PUPPETEER_SKIP_DOWNLOAD=1
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ── Runtime stage ─────────────────────────────────────────────────────────
FROM node:22-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    PUPPETEER_SKIP_DOWNLOAD=1 \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# System deps: Chromium (puppeteer), ffmpeg (video), yt-dlp (future YouTube path),
# Arabic-capable fallback fonts. Amiri Quran itself ships vendored in assets/.
RUN apt-get update && apt-get install -y --no-install-recommends \
      chromium ffmpeg yt-dlp ca-certificates \
      fonts-noto-core fonts-noto-extra fontconfig \
    && rm -rf /var/lib/apt/lists/*

# Prod-only node_modules (skips puppeteer's bundled Chromium download).
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist
COPY assets ./assets
COPY examples ./examples

# Always-on: the self-scheduler renders + publishes at PUBLISH_TIMES (3×/day).
ENTRYPOINT ["node", "dist/cli.js"]
CMD ["serve"]
