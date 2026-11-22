---
name: cartoon-audio-short
description: Cria um curta de desenho animado vertical (cartoon short), em português do Brasil. Oferece 10 ideias, escreve o roteiro e transforma a locução do usuário em um MP4 finalizado com música e efeitos sonoros a 50% do nível da voz. Use para qualquer pedido de curta cartoon, vídeo de história animada, animated story video, short animado ou vídeo 3D cartoon.
---

# Curta cartoon: ideia → roteiro → locução → MP4 finalizado

**Idioma:** converse com o usuário, escreva ideias, roteiros e todo texto que aparece no vídeo em **português do Brasil**. Nomes de arquivos, comandos, código e nomes de funções permanecem em inglês.

O visual: personagens cartoon 2D de cabeça de feijão (bean-head; "cards" desenhados em canvas, com contorno ameixa) em um mundo 3D colorido com contornos de nanquim preto, texturas pintadas, profundidade de campo e câmeras deslizantes. A saída é 1080x1920, 30 fps, exatamente do tamanho da locução. A voz do usuário fica intacta. A trilha e os efeitos sonoros (SFX) são sintetizados e ficam a **50% do nível da voz**. Testado em "The Soldier Who Never Left" (19,7 s, 8 planos).

## Regras
- Histórias, personagens e planos são sempre originais. Nunca recrie o vídeo de outro criador plano a plano. Ofereça uma versão original da mesma ideia.
- Nada de pessoas reais vivas com nome como personagens, nem mascotes ou logos de marcas.
- Sem legendas, a menos que o usuário peça. Texto dentro da cena (uma mensagem entalhada, uma placa) é permitido e deve ler-se corretamente (sem espelhar). Esse texto fica em português do Brasil, com acentuação correta.
- Nunca edite nem altere o tempo da voz. A imagem se adapta a ela, e toda reação visual cai de 0 a 3 quadros antes da palavra correspondente.
- **Níveis de áudio:** a trilha fica a 50% do nível da voz (−6 dB, RMS com gate). Os SFX ficam a 50% ou um pouco menos, com picos limitados para que nenhum impacto se sobreponha à narração. Sempre mixe com `mix.py`, nunca à mão. Não use ducking nem compressão que alterem essa proporção; só um ganho linear mais um limitador de pico em toda a mixagem.
- Mantenha o usuário informado com uma lista de tarefas. Envie uma folha de contato com stills antes da renderização longa.

## Etapa 1: Início (sempre primeiro)
Se já houver um arquivo de áudio anexado, pule para a Etapa 4. Se também veio um roteiro, use-o para o tempo.
Caso contrário, faça uma AskUserQuestion (ou texto simples se a ferramenta não existir): **"De onde você está partindo?"**
- **Locução pronta**: peça o upload, mais o texto do roteiro se tiver (o roteiro deixa o tempo exato). Vá para a Etapa 4 quando chegar.
- **Tenho um roteiro, preciso da locução**: ajuste o roteiro conforme a Etapa 3 se necessário, devolva-o com dicas de gravação, peça o upload e vá para a Etapa 4.
- **Preciso de ideias de vídeo e de um roteiro**: vá para a Etapa 2.
Pergunte também a duração desejada, se ainda não foi dita. O padrão é 20-30 s; 45-60 s é permitido.

## Etapa 2: 10 ideias de vídeo
Dê exatamente 10 ideias em uma única resposta, numeradas, e peça ao usuário que responda com um número (ou "mais"). Cada ideia traz:
- **Título** (5-8 palavras, que desperte curiosidade, ex.: "O Soldado Que Nunca Foi Embora").
- **Frase de gancho**: a primeira frase falada, um paradoxo dito como fato ("Um homem vendeu a Torre Eiffel. Duas vezes.").
- **A virada** em uma linha (o desfecho irônico que encerra o vídeo).
- **Por que anima bem**: os 2-3 grandes momentos visuais (um desabamento, uma revelação, uma perseguição).
- **Real ou lenda**: diga com clareza se é história documentada, relato contestado ou folclore.

O que torna uma ideia "perfeita" para este formato:
- Uma história surpreendente com causa e efeito físicos que dá para mostrar.
- Um personagem comum e claro, tensão crescente e uma virada na última frase.
- Um cenário que possa ser montado com formas 3D simples mais cards cartoon (cidades, pontes, navios, castelos, desertos, laboratórios, palácios).
- Misture as 10 entre épocas e temas: antiguidade, Idade Média, século XIX, atualidade, ciência, animais, invenções, desastres, leis estranhas, acasos felizes. Inclua histórias do Brasil e da América Latina quando fizer sentido.
- Para qualquer coisa apresentada como verdadeira, verifique os fatos principais com uma busca na web antes de oferecer. Não apresente lenda viral como fato. Se o usuário quiser mesmo assim, enquadre como "diz a lenda".
- Nenhuma pessoa real viva como alvo de piada, nada gráfico e nada político.

## Etapa 3: Roteiro (depois que escolherem)
Escreva só a narração (sem indicações de cena no texto falado), dimensionada em cerca de 3,2 palavras/s em português: 20 s ≈ 65 palavras, 30 s ≈ 95, 60 s ≈ 190. (O original em inglês usa 3,7 palavras/s; o português tem palavras mais longas, então cabem menos palavras no mesmo tempo.) Fórmula:
1. **Gancho** (frase 1, sem preparação): o fato absurdo.
2. **Cenário** em 1-2 linhas: quando, onde, quem, um detalhe concreto.
3. **Escalada**, 2-4 momentos, cada um maior que o anterior. Outros duvidam ou zombam. Use uma piada com exagero.
4. **Mistério ou virada**: "Mas quando..." / "Acontece que..." apresenta o mecanismo real, muitas vezes com uma analogia do dia a dia.
5. **Virada / desfecho**: curto, irônico, e as últimas palavras do vídeo.
Use português brasileiro falado e natural, frases de cerca de 8-15 palavras e números escritos por extenso. Prefira o tom de contador de histórias, com contrações da fala quando soarem naturais ("pra", "tá"), sem exagero. Nunca descreva o que o espectador já está vendo.

Depois responda com:
- O roteiro em um bloco copiável, com a contagem de palavras e a duração estimada.
- Um parágrafo de plano visual (os planos que você vai animar).
- Dicas de gravação: uma voz de narrador constante e calorosa; o ElevenLabs funciona bem (escolha uma voz em português do Brasil, com o modelo multilíngue; velocidade cerca de 1,05-1,1, estabilidade cerca de 45-55%). Mp3 ou wav servem. Deixe pausas naturais no fim das frases. Exporte sem música.
- O pedido: **"Envie a locução quando estiver pronta e eu faço o vídeo completo."**
Guarde o texto final do roteiro. Ele conduz o tempo na Etapa 4, então não é preciso reconhecimento de fala. Se gravarem uma versão alterada, peça o texto final.

## Etapa 4: Montar o vídeo (depois do upload da locução)
Faça tudo daqui em diante sem parar. Pergunte só se o tempo não puder ser resolvido.

### 4.0 Obter o kit
O kit de código vem **dentro da pasta desta skill** em `kit/` (motor, ferramentas, exemplo prático, mais three.js r160 e a biblioteca Pen `toon.ts`, ambos de github.com/mromidev/claude-animated-shorts, licença MIT). Localize a pasta com `find / -name SKILL.md -path "*cartoon-audio-short*" 2>/dev/null` e trate o `kit/` dela como somente leitura.

Depois rode `bash <skill>/kit/tools/setup.sh ~/shorts/<slug>`. Ele copia o motor e as ferramentas para o projeto, instala o three.js incluído, remove os tipos de `toon.ts` com o `module.stripTypeScriptTypes` do Node 22 e vincula o Playwright. Não precisa de rede se `kit/vendor/three.module.js` e `kit/vendor/toon.ts` existirem. Se faltarem, ele procura em `$VENDOR_DIR` (uma pasta com os dois arquivos, por exemplo onde o usuário os anexou) e só então recorre ao npm ou a um git clone. Se não achar os arquivos e a rede estiver bloqueada, não procure no disco nem contorne o bloqueio: peça ao usuário que anexe `three.module.js` (three@0.160.0, build/) e `toon.ts` (mromidev/claude-animated-shorts, templates/bridge/) no chat, e rode o setup com `VENDOR_DIR=<pasta dos anexos>`.
- Requisitos: Node 22.6+, Python 3 com numpy + Pillow, ffmpeg e Playwright com Chromium (`npm i -g playwright && npx playwright install chromium` se faltar).
- Se os registros de pacotes estiverem bloqueados, o git via GitHub geralmente funciona. Nunca desative o TLS nem contorne o proxy.
- Chromium: use o navegador Playwright pré-instalado com `--use-angle=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist`. Isso dá WebGL na CPU, a cerca de 3-10 s por quadro.

### 4.1 Tempo
Rode `VOICE_LANG=pt python3 timing.py voice.mp3 script.txt --out work`. (`VOICE_LANG=pt` ajusta a contagem de sílabas e o reconhecimento de fala para português; sem isso o padrão é inglês.)
- Com whisper ou faster-whisper instalado, usa timestamps por palavra (em português usa o modelo multilíngue `small`, não o `base.en`).
- Caso contrário, alinha as frases do roteiro (divididas na pontuação) aos trechos de fala detectados por silêncio, com uma programação dinâmica que casa sílabas com duração e penaliza finais de frase dentro de um trecho e pausas longas dentro de uma frase.
- Sem ASR e sem roteiro, peça o roteiro. O Claude não consegue ouvir áudio.
- Confira `work/phrases.json`: as pausas devem cair nos finais de frase. Total de quadros = round(duração × 30).

### 4.2 Plano de planos (`work/PLAN.md` antes do código)
Faça uma linha por plano: quadros, palavras, cenário, luz, movimento de câmera, personagens/poses/expressões, efeitos e deixa de SFX.
- O quadro 0 já é a imagem do gancho.
- Em geral um plano por frase. Una frases minúsculas à seguinte.
- Ilustre cada frase literalmente. Os objetos carregam as piadas.
- Varie o tamanho dos planos: gancho em plano médio fechado (MCU) → revelação em plano aberto → plano de dois → inserção em close do objeto-chave → close de reação → movimento de ambiente para o desfecho.
- Use a luz para marcar momentos: dia para o normal, dourada para declínio ou drama, azul-noite para explicação. Um salto de tempo ganha um flash branco de 6 quadros.
- A frase da virada ganha um sting (a música para, golpe grave, push-in com rotação). O desfecho físico do último plano cai na palavra final.

### 4.3 Mundo (`web/main.js`)
Mantenha as seções do motor: materiais toon, contrato de contorno (ink), `add`/`tbox`, céu, luzes, cards, render targets/pós-processamento, `applyLight`, `drawActors`, `swapForNd`, `renderFrame`. Troque o mundo de exemplo entre `// ---------- world ----------` e `// ---------- cards ----------`, além das partes de história de `worldState()`.
- Construa com primitivas e texturas pintadas em canvas (`paint.js`: tábuas, vigas, madeira podre, pedra, musgo/hera, grama, terra, reboco, telhas, mármore, faixas, texto entalhado). Escreva novos pintores no mesmo estilo chapado com frestas escuras.
- Use `tbox` para densidade de texel constante, um gradiente toon de 2 passos e neblina = cor do horizonte.
- Fundo: colinas (esferas semienterradas), montanhas (cones + picos nevados), ciprestes/pinheiros, casas distantes, nuvens pintadas em billboards.
- Elementos de cena (desabamentos, quedas, portas) são grupos com pivô, conduzidos por um progresso 0..1 vindo de `worldAt(f)`, com partes suavizadas e escalonadas.
- Texto curvo dentro da cena usa UVs planares. Confira se não está espelhado.

### 4.4 Elenco (`web/roman.js` → `web/toon.js`)
- `romanFront(p, outfitKey, opts)` desenha em um canvas de design de 600x1000 com as solas em y=975. O card tem 2,25 m de altura, então 1 unidade = 0,00225 m.
- Adicione roupas em `OUTFITS` (túnica/capa/armadura/capacete/cabelo/boné/barba/avental/vestido/toga) e novos acessórios de cabeça e objetos no mesmo estilo.
- Poses de braço: hang, spear, point, up, wave, hip, belly, temple (+swirl), lift, reach (+lift), cheek, shield, cross, thumb.
- Expressões: o conjunto FACE do toon.ts mais snore, stubborn, squint. Estenda FACE para ter mais.
- Reconstrua depois de editar com `cat web/toonbase.js web/roman.js > web/toon.js`. Renderize uma folha de teste de personagens antes de usar novos designs.
- Billboards giram só em yaw, ganham uma mancha de contato e uma sombra com alpha-test, e nunca recebem contorno da passada do mundo.
- Monte as chaves dos cards com valores arredondados por `q()` (para o canvas só redesenhar quando houver mudança visível).
- Uma peça destacada (ex.: um capacete levantado) é seu próprio card, alinhado com `headCenter(seed)`: y = DECK + (partY − hc) × 0,00225.

### 4.5 Movimento: suave e vivo (`web/motion.js`)
- **Câmeras**: `camFromKeys(keys, f, {kicks})`. Use deslizes com smootherstep (18-45 quadros), `easeOut` para revelações e chicotadas, e pontos de passagem `path` (Catmull-Rom) para movimentos curvos. Toda pausa se mexe devagar e nada fica estático por 4+ quadros. Use rolagens de 3-5° em momentos dramáticos e tremidas de 7 quadros em impactos.
- **Continuidade**: prefira movimentos contínuos (recuar de um close para o plano aberto, rack focus, grua atravessando o convés, avançar sobre um objeto). Corte seco só em saltos de lugar ou tempo, com flash.
- **Personagens nunca congelam**: aplique `idle(f, seed)` em todo card, piscadas com `blinkAt` e balanço de cabeça nas palavras enfatizadas.
- **Ações**: antecipação → overshoot com `back` → assentamento com `spring`. Um pisão é uma queda de 2 quadros + nuvem de poeira + chute. Risadas são uma inclinação alternada + balanço.
- **Movimento secundário**: faixas de tecido ondulando, cards de efeito para folhas/poeira/pingos/Zzz, água corrente. Sempre há algo se movendo.
- **Caminhadas**: `walk()` dá distância + fase do passo. Pés plantados, balanço vertical de 3-7%.
- **Lente**: DOF em closes e planos médios (cInf 8-14 px), foco nos olhos. Planos abertos ficam nítidos. Os racks levam cerca de 14 quadros.

### 4.6 Checagem visual (antes da renderização completa)
Renderize stills no meio de cada plano, mais as transições e ações principais: `node render.mjs stills/a "5,40,..."` e depois `python3 sheet.py stills/a stills/sheet_a.jpg`. Olhe a folha e corrija estas armadilhas:
- **Quadro vertical estreito**: meia-largura horizontal = d·tan(hfov/2), com hfov = 2·atan(tan(vfov/2)·0,5625). A 4 m e fov 40 isso dá ±0,8 m, então posicione os personagens em profundidade.
- Grades ou postes cruzando rostos (câmera dentro do corrimão ou a ~2,5 m de altura). Caminho de câmera atravessando casas, telhados ou arbustos. Objetos em primeiro plano a menos de ~2 m. O herói escondido atrás de um pilar.
- Texto espelhado. Um card de peça destacada deslocado para o lado errado.
- Grupos de material de extrude: 0 = tampas, 1 = lados+topo.
- Contorno faltando: depure a saída só de bordas. Raio do contorno ~2,5 px em 1080. O céu conta como profundidade distante, não como card.
Envie a folha ao usuário com um resumo de uma linha por plano e depois inicie a renderização completa.

### 4.7 Som (`audio.py` → stems → `mix.py`)
Reescreva a tabela de deixas para a história; os sintetizadores continuam. O `audio.py` grava só stems (`music.wav`, `sfx.wav`).
- Música: um loop curto de estilo marcha (bumbo/caixa, baixo dedilhado, pad de metais). Ela para na frase da virada, depois um drone grave continua.
- SFX nos eventos (em quadros/30): whooshes em movimentos grandes, thunk em pisões, estrondo+crash em desabamentos, raspão em metal, ting em revelações, sting na virada, rangidos, estalo, splash, ronco, folhas, ambiente de água.
- Mixe com `python3 mix.py voice.mp3 music.wav sfx.wav`. Ele ajusta a música a exatamente 50% do RMS com gate da voz (−6 dB) e os SFX a 50%, com picos limitados a 0,7× o pico da voz. Ele imprime os níveis medidos: confirme que a música marca −6,0 dB em relação à voz e que os SFX estão nesse valor ou abaixo.
- Trave o tempo da imagem antes de fazer o som. Qualquer mudança de tempo exige rodar de novo o audio.py e o mix.py.

### 4.8 Renderizar + finalizar
- Rode `node render.mjs frames "0-<N-1>"` com o `run_in_background` do Bash, acompanhado por um loop de Monitor que informa o progresso e detecta erros ou saída do processo. `RESUME=1` continua após uma interrupção. Não rode Python pesado ao mesmo tempo em máquinas pequenas.
- Rode `bash finish.sh "Título"`. Ele aplica um único ganho linear até cerca de −14 LUFS mais um limitador de pico de −1 dBFS, codifica H.264 CRF 17 + AAC, roda a QA de congelamento/preto e loudness, e grava `out/qa_sheet.jpg`. Olhe a folha. Trechos congelados de ≥0,4 s ou quadros pretos precisam de correção.
- Entregue o MP4 com SendUserFile e algumas linhas sobre o que cada plano mostra. Ofereça legendas, ajustes ou a próxima ideia da lista.

## Armadilhas do motor (mantidas no kit; mantenha-as se reconstruir)
- `#include <fog_vertex>` / `<fog_fragment>` ficam cada um em sua própria linha.
- A passada final escreve `linearToOutputTexel(...)` (os render targets são HalfFloat linear).
- A passada de normal+profundidade troca os materiais por malha: mundo → normal/profundidade, cards → máscara com alpha-test (rgb 0, a = profundidade), blobs/nuvens/céu ocultos, água → normal plana. Neblina e sombras ficam desligadas durante ela.
- O contorno vai só no lado próximo dos saltos de profundidade. Os vincos vêm do produto escalar da normal. Cards vizinhos são ignorados. O contorno some em ~140-520 m.
- DOF: 48 amostras com teste de CoC por amostra (sem vazamento do primeiro plano).
- O sol vem de az/el por preset de luz. A câmera de sombra é centrada na ação de cada plano.

## Arquitetura (referência para editar o kit)
- `web/index.html` carrega `main.js` (módulo ES) por um servidor HTTP local.
- `main.js`: renderer, materiais toon, mundo, cards (planos de CanvasTexture 1200x2000, origem nas solas), passadas cor (RT amostras 4) → normal/profundidade → contorno+correção de cor (saturação, ganho/lift, vinheta, flash) → DOF na tela. Expõe `window.renderFrame(f)` e `window.ready`.
- `story.js` exporta SHOTS, `shotAt`, `camAt`, `dofAt`, LIGHTS/`lightFor`, `worldAt`, `actorsAt(f, T)`, `fxAt(f, T)`. Todas são funções puras do quadro.
- `render.mjs`: Playwright → `renderFrame(f)` → `toDataURL('image/jpeg', .95)` → `frames/f0000.jpg`.
- `mix.py`: travamento de nível por RMS com gate (música e SFX a 50% da voz). `finish.sh`: ganho linear de loudness, limitador, codificação, QA.
- Personagens: a API Pen de `templates/bridge/toon.ts` do mromidev/claude-animated-shorts, estendida no mesmo escopo de módulo pelo arquivo do elenco.
