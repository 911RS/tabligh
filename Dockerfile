# ── Build stage: compile TS → dist ────────────────────────────────────────
FROM node:22-bookworm-slim AS builder
WORKDIR /app
COPY package*.json ./
ENV PUPPETEER_SKIP_DOWNLOAD=1
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ── Web stage: build the public SPA → dist/web ────────────────────────────
# Separate stage with its own dependency layer: the frontend's toolchain (Vite,
# React, Tailwind) is large and has no business in the runtime image. Only the
# built static output is copied forward.
FROM node:22-bookworm-slim AS web
WORKDIR /app/web
COPY web/package*.json ./
RUN npm ci
COPY web/ ./
RUN npm run build

# ── Runtime stage ─────────────────────────────────────────────────────────
FROM node:22-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    PUPPETEER_CACHE_DIR=/app/.cache/puppeteer

# ffmpeg + the shared libraries Chrome needs at runtime + Arabic fallback fonts.
# We deliberately do NOT use the distro `chromium` package — its version does not
# match Puppeteer's protocol and crashes on launch. Puppeteer downloads its own
# matching Chrome below; these libs are what that Chrome dlopen()s at runtime.
RUN apt-get update && apt-get install -y --no-install-recommends \
      ffmpeg ca-certificates wget fontconfig fonts-liberation \
      fonts-noto-core fonts-noto-extra \
      libasound2 libatk-bridge2.0-0 libatk1.0-0 libcairo2 libcups2 libdbus-1-3 \
      libdrm2 libexpat1 libgbm1 libglib2.0-0 libgtk-3-0 libnspr4 libnss3 \
      libpango-1.0-0 libpangocairo-1.0-0 libx11-6 libxcb1 libxcomposite1 \
      libxdamage1 libxext6 libxfixes3 libxkbcommon0 libxrandr2 libxshmfence1 \
    && rm -rf /var/lib/apt/lists/*

# Prod deps + Puppeteer's matching Chrome (postinstall downloads it into
# PUPPETEER_CACHE_DIR). No PUPPETEER_SKIP_DOWNLOAD here on purpose.
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist
# The built SPA. `tabligh web` serves this from dist/web; without it that
# command still starts but answers with a "not built yet" notice.
COPY --from=web /app/dist/web ./dist/web
COPY assets ./assets
COPY examples ./examples

# Persisted store (settings, panel password, queue, history) lives here. Declaring
# it as a volume means Docker/Coolify persist it across redeploys automatically —
# no manual volume setup needed. The app creates data/store.json on first boot.
VOLUME ["/app/data"]

# 1998 = private control panel + scheduler (`serve`).
# 1999 = public anonymous web studio (`web`). Which one runs is set by CMD;
# docker-compose.yml brings both up as separate services off this one image.
EXPOSE 1998 1999

# Which of the two the container runs. `command:` in docker-compose still wins;
# TABLIGH_CMD=web is for platforms that can only set environment variables.
# See docker-entrypoint.sh.
ENV TABLIGH_CMD=serve
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh
ENTRYPOINT ["/app/docker-entrypoint.sh"]
