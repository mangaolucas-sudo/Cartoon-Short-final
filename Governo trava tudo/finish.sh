#!/usr/bin/env bash
# Junta vídeo (Remotion) + mix de áudio -> saida/*.mp4 e extrai frame_0.png
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p saida
for n in youtube tiktok; do
  ffmpeg -v error -y -i video/out/${n}_video.mp4 -i video/out/${n}_mix.wav -map 0:v -map 1:a \
    -c:v copy -c:a aac -b:a 192k -ar 48000 -movflags +faststart saida/poupanca_${n}.mp4
  ffmpeg -v error -y -i saida/poupanca_${n}.mp4 -frames:v 1 saida/poupanca_${n}_frame_0.png
done
