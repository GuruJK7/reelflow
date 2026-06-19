# ReelFlow worker — Node + Python(auto-editor) + ffmpeg + whisper.cpp + Remotion(Chromium)
# Build context = raíz del repo (ver render.yaml: dockerContext .)
FROM node:20-bookworm

ENV DEBIAN_FRONTEND=noninteractive

# Dependencias de sistema: ffmpeg, build tools (whisper.cpp), python (auto-editor)
# y las librerías que requiere el Chromium headless de Remotion.
RUN apt-get update && apt-get install -y --no-install-recommends \
      ffmpeg \
      python3 python3-venv python3-pip \
      build-essential cmake git ca-certificates \
      libnss3 libdbus-1-3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 \
      libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 \
      libasound2 libpango-1.0-0 libcairo2 libatspi2.0-0 libxshmfence1 \
      fonts-liberation \
  && rm -rf /var/lib/apt/lists/*

# auto-editor en un venv aislado (no toca el Python base del sistema)
RUN python3 -m venv /opt/venv && /opt/venv/bin/pip install --no-cache-dir auto-editor
ENV PATH="/opt/venv/bin:${PATH}"

WORKDIR /app

# --- deps del worker (con dev: necesita typescript para el build) ---
COPY worker/package.json /app/worker/package.json
RUN cd /app/worker && npm install --no-audit --no-fund

# --- deps del proyecto remotion (solo runtime: bundlear el template) ---
COPY remotion/package.json /app/remotion/package.json
RUN cd /app/remotion && npm install --omit=dev --no-audit --no-fund

# --- código (node_modules excluido por .dockerignore) ---
COPY worker /app/worker
COPY remotion /app/remotion

# build del worker (TS -> dist)
RUN cd /app/worker && npm run build

# whisper.cpp + modelo (en build, no en cada job)
ENV REELFLOW_WHISPER_PATH=/app/whisper \
    REELFLOW_WHISPER_VERSION=1.5.5 \
    REELFLOW_WHISPER_MODEL=medium
RUN node /app/worker/scripts/prepare-whisper.mjs

# Chromium headless de Remotion (en el contexto del worker = donde corre el render)
RUN cd /app/worker && node -e "import('@remotion/renderer').then((r) => r.ensureBrowser()).then(() => console.log('browser ok'))"

ENV REELFLOW_REMOTION_ENTRY=/app/remotion/src/index.ts \
    REELFLOW_WORK_ROOT=/app/work \
    NODE_ENV=production
RUN mkdir -p /app/work

CMD ["node", "/app/worker/dist/index.js"]
