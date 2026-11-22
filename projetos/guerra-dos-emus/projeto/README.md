# A Guerra Que a Austrália Perdeu Para Pássaros — projeto do vídeo

Vídeo horizontal 1920x1080, 30 fps, 10.196 quadros (5min40s), narração com a voz Alex (Kokoro `pm_alex`, velocidade 1,1).

- `voice_from_script.py` — gera a narração a partir de `../script.txt` (Kokoro ONNX) e o arquivo de tempos por frase.
- `web/` — motor 3D (three.js + cards 2D): `main.js` (mundo), `story.js` (plano de ~80 planos), `cast.js` (personagens e emus), `paint2.js` (texturas).
  Para rodar: `bash ../../../cartoon-audio-short-final/kit/tools/setup.sh <pasta>`, copie estes arquivos por cima e gere `web/toon.js` com
  `cat web/toonbase.js web/roman.js web/cast.js > web/toon.js`.
- `render.mjs` — renderiza quadros; `audio.py` — trilha e efeitos; `mix.py` — mixagem (música e efeitos a −6 dB da voz); `finish.sh` — codifica o MP4.

## Correção do chão piscando (aplicada depois do render final)
- **Causa 1, z-fighting:** a estrada, as poças, a represa, o tapete do Parlamento e o piso do estúdio ficavam no mesmo plano do chão de terra. Por isso o piso alternava entre um e outro a cada quadro.
  - Correção: função `decal()` em `web/main.js`, que aplica polygonOffset tanto no material de cor quanto no passe de normal/profundidade.
- **Causa 2, sombra "nadando":** a câmera da sombra seguia o foco sem se alinhar aos texels do shadow map.
  - Correção: em `placeSun()`, o foco agora é ajustado aos texels.
- **Causa 3, chão "fervendo":** a textura de terra tinha pontinhos muito contrastados.
  - Correção: contraste menor em `paint2.js` e anisotropia 16 na textura.
