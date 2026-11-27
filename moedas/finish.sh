#!/usr/bin/env bash
# Junta vídeo (Remotion) + mix de áudio -> saida/moedas_*.mp4 e extrai o frame 0
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p saida
for n in youtube tiktok; do
  ffmpeg -v error -y -i video/out/${n}_video.mp4 -i video/out/${n}_mix.wav -map 0:v -map 1:a \
    -c:v copy -c:a aac -b:a 192k -ar 48000 -shortest -movflags +faststart saida/moedas_${n}.mp4
  ffmpeg -v error -y -i saida/moedas_${n}.mp4 -frames:v 1 saida/moedas_${n}_frame_0.png
done
