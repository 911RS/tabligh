# ── Build stage: compile TS → dist ────────────────────────────────────────
FROM node:22-bookworm-slim AS builder
WORKDIR /app
COPY package*.json ./
ENV PUPPETEER_SKIP_DOWNLOAD=1
# --include=dev explicitly: platforms that let you set NODE_ENV as an
# application variable (Coolify) inject it into the BUILD too, and a
# NODE_ENV=production build silently skips devDependencies — so tsc and vite
# are simply absent and the build dies with "tsc: not found".
RUN npm ci --include=dev
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ── Web stage: build the public SPA → dist/web ────────────────────────────
# Separate stage with its own dependency layer: the frontend's toolchain (Vite,
# React, Tailwind) is large and has no business in the runtime image. Only the
# built static output is copied forward.
FROM node:22-bookworm-slim AS web
WORKDIR /app
# The SPA is a separate project — 911RS/tabligh-studio — so that cloning this
# repo to run the generator does not drag 3.4MB of frontend along with it. It is
# fetched here rather than vendored.
#
# A submodule was tried first and does not survive the trip: the platform clones
# this repo with its own credentials, which do not extend to a second private
# repo, and the build dies on "could not read Username for https://github.com".
# STUDIO_TOKEN is the way through while tabligh-studio is private — a token with
# read access to it. It is only ever seen by THIS stage, which is discarded;
# only the built dist/web is copied into the runtime image.
ARG STUDIO_REPO=911RS/tabligh-studio
ARG STUDIO_REF=main
# Either is enough, and neither is needed once the repo is public:
#   STUDIO_DEPLOY_KEY — base64 of an SSH private key with read access. Preferred:
#                       a deploy key is scoped to that one repo and read-only, so
#                       it cannot reach anything else and is revoked by deleting
#                       it from the repo's settings.
#   STUDIO_TOKEN      — a GitHub token, for anyone who would rather use one.
ARG STUDIO_DEPLOY_KEY=
ARG STUDIO_TOKEN=
RUN apt-get update && apt-get install -y --no-install-recommends git ca-certificates openssh-client \
    && rm -rf /var/lib/apt/lists/*
RUN set -e; \
    if [ -n "$STUDIO_DEPLOY_KEY" ]; then \
      mkdir -p /root/.ssh && chmod 700 /root/.ssh; \
      echo "$STUDIO_DEPLOY_KEY" | base64 -d > /root/.ssh/studio && chmod 600 /root/.ssh/studio; \
      ssh-keyscan -t ed25519 github.com > /root/.ssh/known_hosts 2>/dev/null; \
      GIT_SSH_COMMAND="ssh -i /root/.ssh/studio -o UserKnownHostsFile=/root/.ssh/known_hosts" \
        git clone --depth 1 --branch "$STUDIO_REF" "git@github.com:${STUDIO_REPO}.git" web; \
      rm -f /root/.ssh/studio; \
    else \
      if [ -n "$STUDIO_TOKEN" ]; then auth="${STUDIO_TOKEN}@"; else auth=""; fi; \
      git clone --depth 1 --branch "$STUDIO_REF" "https://${auth}github.com/${STUDIO_REPO}.git" web 2>/dev/null; \
    fi || { \
      echo "ERROR: could not fetch the studio SPA from ${STUDIO_REPO}."; \
      echo "       While that repository is private the build needs read access:"; \
      echo "         --build-arg STUDIO_DEPLOY_KEY=\$(base64 -w0 path/to/deploy_key)"; \
      echo "       (on Coolify: add it as a Build Variable)"; \
      exit 1; }
WORKDIR /app/web
# See the note in the builder stage — same NODE_ENV trap, same fix.
RUN npm ci --include=dev && npm run build

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
