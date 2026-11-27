# Moedas — "Essa moeda de 1 real já valeu 2,75 quintilhões"

Dois Shorts verticais do canal **Bento Contaê** (1080x1920, 30 fps, H.264 + AAC), com o **Dr. Bento**
(traço do motor 2D do canal, portado para SVG em `video/src/Person.tsx`).

Mesma stack do vídeo da poupança (Remotion + Whisper local + mix em Python):

```bash
python3 transcribe.py youtube tiktok      # Whisper small, pt -> timestamps/*.json
python3 build_timeline.py                 # cenas, cenários, sequências e SFX -> video/src/data/*.json
python3 mix.py                            # voz -14 LUFS + SFX + ambiência + trilha -> video/out/*_mix.wav
(cd video && node render.mjs youtube tiktok)
./finish.sh                               # -> saida/moedas_*.mp4 + frame 0
```

- `video/src/Scenery.tsx`: 17 cenários de fundo (trocam a cada 2–4 s, com chicote de câmera).
- `video/src/props2.tsx`: notas estilizadas (só o nome da moeda, sem reproduzir cédulas reais), moeda, tesoura etc.
- Para usar uma trilha própria, coloque o arquivo em `assets/musica/`.
