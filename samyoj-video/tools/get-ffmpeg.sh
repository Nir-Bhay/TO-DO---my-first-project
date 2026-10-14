#!/usr/bin/env bash
# samyoj-video/tools/get-ffmpeg.sh
#
# Puts an ffmpeg in tools/ so render.mjs, voice.mjs and audio-synth.mjs find it without any
# configuration. Run it once. Every path below is a normal, public download — no account, no key.
#
#   bash tools/get-ffmpeg.sh
set -e
cd "$(dirname "$0")"
[ -x ./ffmpeg ] && { echo "✓ tools/ffmpeg already here: $(./ffmpeg -version | head -1)"; exit 0; }

echo "▸ looking for an ffmpeg to use…"
if command -v ffmpeg >/dev/null 2>&1; then
  echo "✓ found a system ffmpeg: $(command -v ffmpeg)"
  echo "  (that is enough — the scripts fall back to PATH. Nothing else to do.)"
  exit 0
fi

echo "▸ none on PATH; downloading a static build…"
ARCH=$(uname -m)
if [ "$ARCH" = "x86_64" ] || [ "$ARCH" = "amd64" ]; then
  URL="https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz"
elif [ "$ARCH" = "aarch64" ] || [ "$ARCH" = "arm64" ]; then
  URL="https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-arm64-static.tar.xz"
else
  echo "✋ unknown architecture: $ARCH — install ffmpeg yourself (brew install ffmpeg / apt install ffmpeg)"; exit 1
fi

curl -sL "$URL" -o /tmp/ffmpeg.tar.xz
tar -xJf /tmp/ffmpeg.tar.xz -C /tmp --wildcards 'ffmpeg-*/ffmpeg'
cp /tmp/ffmpeg-*/ffmpeg ./ffmpeg
chmod +x ./ffmpeg
rm -rf /tmp/ffmpeg.tar.xz
echo "✓ tools/ffmpeg → $(./ffmpeg -version | head -1)"
