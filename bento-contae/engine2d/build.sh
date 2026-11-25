#!/usr/bin/env bash
# uso: bash engine2d/build.sh producao/ep02 [voz.mp3] [nome_saida]
# 1) tempo: com voz usa o timing.py do kit (alinha o roteiro à locução); sem voz, estimativa
# 2) quadros  3) trilha+efeitos+mix  4) MP4 final (−14 LUFS, pico −1 dBFS)
set -euo pipefail
EP=$1; VOICE=${2:-}; NAME=${3:-$(basename $EP)}
ROOT=$(cd "$(dirname "$0")/.." && pwd); cd "$ROOT"
KIT=../cartoon-audio-short-final/kit/tools
if [ -n "${SKIP_TIMING:-}" ]; then
  echo "tempo: usando work/words.json existente"
elif [ -n "$VOICE" ]; then
  VOICE_LANG=pt python3 -I $KIT/timing.py "$VOICE" $EP/work/script.txt --out $EP/work
  python3 -I - "$EP" <<'PY'
import json,sys,os; ep=sys.argv[1]; p=json.load(open(os.path.join(ep,'work','phrases.json')))
json.dump({'duration':p['duration'],'frames':p['frames30'],'source':p['source']},open(os.path.join(ep,'work','meta.json'),'w'))
print('tempo:',p['source'],p['duration'],'s')
PY
else
  python3 -I engine2d/estimate.py $EP
fi
[ -n "${SKIP_FRAMES:-}" ] || { rm -rf $EP/work/frames; node engine2d/render.mjs $EP $EP/work/frames all; }
python3 -I engine2d/audio.py $EP ${VOICE:+"$VOICE"}
mkdir -p $EP/out
G=$(ffmpeg -nostats -i $EP/work/mix.wav -af ebur128 -f null - 2>&1 | awk '/^ *I:/{v=$2} END{print v}')
TARGET=$([ -n "$VOICE" ] && echo -14 || echo -20)   # prévia sem voz fica mais baixa
GAIN=$(python3 -c "print(round(min(12, $TARGET - float('$G')), 2))")
ffmpeg -v error -y -framerate 30 -i $EP/work/frames/f%04d.jpg -i $EP/work/mix.wav -map 0:v -map 1:a \
  -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -af "volume=${GAIN}dB,alimiter=limit=0.79:level=disabled" -c:a aac -b:a 192k -ar 48000 -shortest -movflags +faststart $EP/out/$NAME.mp4
echo "pronto: $EP/out/$NAME.mp4 (ganho ${GAIN} dB)"
