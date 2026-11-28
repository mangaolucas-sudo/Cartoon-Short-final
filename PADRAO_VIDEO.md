# Bento Contaê — padrão de todo vídeo

Vale para todo Short/TikTok do canal. Os personagens estão em [`personagens/PERSONAGENS.md`](personagens/PERSONAGENS.md).

## Enquadramento: sem zoom, tudo dentro da área visível
- **Nenhum zoom:** nada de zoom de câmera, de "soco" de zoom nos cortes nem de cenário ampliado. O quadro 1080x1920 aparece inteiro.
- Para dar movimento, use **deslocamento lateral do cenário**, troca de cenário a cada 2–4 s, objetos entrando com "pop" e o personagem andando ou mudando de cara.
- **Áreas cobertas pela interface do TikTok e do Shorts** (não colocar nada importante nelas):
  - coluna de botões à direita: x > 930 e y > 880;
  - nome, descrição e música embaixo: y > 1560;
  - barra de cima: y < 170.
- **Texto e números importantes:** entre x 60 e 900. Legenda centrada em y≈1350 (de 50 a 930). Título no terço superior (y≈300–520).
- Nenhum texto pode passar da borda da sua placa ou cédula: o texto se ajusta ao espaço (`fit.ts`).

## Retenção (o problema nº 1 do canal: as pessoas saem antes de 5 s)
1. **Primeira frase com conflito + número em até 2 s.** Sem nome, contexto ou "olá".
2. **Quadro 0 com um foco só,** fundo claro e uma pergunta no topo.
3. **Algo se mexe nos 10 primeiros quadros** (preço trocando, BIP, susto).
4. **Pergunta aberta e promessa** respondidas só no fim.
5. **Reganche a cada 8–10 s.**
6. **Voz sem silêncio antes da 1ª palavra.** ElevenLabs com velocidade 1,08–1,12 e estabilidade 35–45%.
7. **Loop:** a última imagem igual ao quadro 0, sem tela final e sem fade.

## Técnico
1080x1920, 30 fps, H.264 + AAC, duração = duração do áudio. Remotion + Whisper local (small, pt) para os tempos de cada palavra.
Voz a −14 LUFS, trilha bem abaixo (~−27 LUFS), whoosh nas trocas, efeitos sonoros nos momentos-chave e ambiência por cenário.
Legenda palavra por palavra, até 3 palavras, bold branco com contorno preto e palavra atual em amarela.
