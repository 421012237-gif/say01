#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
MODEL_TARGET="$PROJECT_ROOT/android/app/src/main/assets/kokoro-int8-en-v0_19"
AAR_TARGET="$PROJECT_ROOT/android/app/libs/sherpa-onnx-1.13.6.aar"
DOWNLOAD_DIR="${TMPDIR:-/tmp}/eleven-says-local-voice-v1"
MODEL_ARCHIVE="$DOWNLOAD_DIR/kokoro-int8-en-v0_19.tar.bz2"
AAR_DOWNLOAD="$DOWNLOAD_DIR/sherpa-onnx-1.13.6.aar"

MODEL_URL="https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/kokoro-int8-en-v0_19.tar.bz2"
AAR_URL="https://github.com/k2-fsa/sherpa-onnx/releases/download/v1.13.6/sherpa-onnx-1.13.6.aar"
MODEL_SHA256="c9f0dd393615805b0bab050c340834d5e684e732aec91c0e860cd30e982c08bd"
AAR_SHA256="0012d9a28f15bd6fb966b62b70a75da3990512fdccce28b83098248ce4be1698"

if [[ -f "$MODEL_TARGET/model.int8.onnx" && -f "$MODEL_TARGET/voices.bin" && -f "$AAR_TARGET" ]]; then
  echo "Local Mia voice assets are already present."
  exit 0
fi

mkdir -p "$DOWNLOAD_DIR" "$PROJECT_ROOT/android/app/libs" "$PROJECT_ROOT/android/app/src/main/assets"
curl --fail --location --retry 3 --output "$MODEL_ARCHIVE" "$MODEL_URL"
curl --fail --location --retry 3 --output "$AAR_DOWNLOAD" "$AAR_URL"
echo "$MODEL_SHA256  $MODEL_ARCHIVE" | shasum -a 256 --check
echo "$AAR_SHA256  $AAR_DOWNLOAD" | shasum -a 256 --check
tar -xjf "$MODEL_ARCHIVE" -C "$DOWNLOAD_DIR"
cp -R "$DOWNLOAD_DIR/kokoro-int8-en-v0_19" "$PROJECT_ROOT/android/app/src/main/assets/"
cp "$AAR_DOWNLOAD" "$AAR_TARGET"
echo "Local Mia voice assets restored successfully."
