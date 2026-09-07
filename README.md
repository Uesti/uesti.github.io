# Cartas viradas

Site de cartas viradas para baixo. Ao clicar, a carta gira e mostra o texto.
Suporta **vários baralhos**, cada um com suas cartas, suas cores e seu jeito de
jogar. Tudo vem de arquivos JSON — você não precisa mexer no código.

## Como abrir

O navegador bloqueia a leitura dos arquivos JSON quando você abre o `index.html`
com duplo clique. Rode um servidor local na pasta do projeto:

```bash
python -m http.server 8000
```

Depois acesse `http://localhost:8000`.

(Se abrir com duplo clique mesmo assim, a página mostra um aviso explicando.
Com vários baralhos em arquivos separados, o servidor local é necessário.)

## Estrutura dos arquivos

| Arquivo | Para que serve |
| --- | --- |
| `cartas.json` | **Índice.** Lista os baralhos e guarda a configuração que vale para todos eles. |
| `decks/*.json` | **Um arquivo por baralho**, com as cartas e os ajustes só daquele baralho. |
| `index.html` | Esqueleto da página. Raramente precisa mudar. |
| `css/` | Estilo base, um arquivo por parte da tela. Só mexa se quiser algo além das opções do JSON. |
| `js/` | Código, um arquivo por assunto. Lê os arquivos e monta as cartas. |

### O que tem em `js/`

O ponto de entrada é o `js/main.js` — é ele que o `index.html` carrega. Os
outros arquivos são importados a partir dele:

| Arquivo | Para que serve |
| --- | --- |
| `main.js` | Lê o `cartas.json` e liga os botões da barra. |
| `padroes.js` | Valores usados quando a chave não existe no JSON. |
| `elementos.js` | Os elementos do `index.html` em um lugar só. |
| `estado.js` | O que os módulos compartilham (config, cartas, monte, descarte). |
| `utilidades.js` | Mesclar configurações, desligar animações, formatar texto. |
| `embaralhar.js` | Embaralhamento com peso por tag e por carta. |
| `armazenamento.js` | Memória do que já foi revelado (`lembrarEstado`). |
| `tema.js` | Passa o `config.tema` para as variáveis do CSS. |
| `carta.js` | Monta cada carta, vira e trata o clique. |
| `cronometro.js` | O tempo das cartas que trazem `tempo`. |
| `pilha.js` | Modo pilha: baralho, descarte, descartar e voltar. |
| `barra.js` | Contador, filtros e reiniciar. |
| `modos.js` | Troca entre "grade" e "pilha". |
| `decks.js` | Índice dos baralhos e troca de baralho. |
| `render.js` | Desenha um baralho na tela. |
| `aviso.js` | Mensagem de erro quando o JSON não pode ser lido. |

O `css/` segue a mesma ideia (uma parte da tela por arquivo). A ordem dos
`<link>` no `index.html` é a ordem em que as regras valem — se for dividir mais,
mantenha a ordem.

Baralhos que já vêm prontos:

| Baralho | Arquivo | Como funciona |
| --- | --- | --- |
| Cartas Eróticas | `decks/eroticas.json` | Cada carta tem um tempo e um botão para iniciar o cronômetro. Embaralhado **com peso por tag**: quanto mais longa a carta, mais ela tende ao fim do baralho. |
| Baralho da Ousadia | `decks/ousadia.json` | Desafios avulsos, **embaralhados**. Sorteie, cumpra e passe a vez. |
| Verdade ou Sacanagem | `decks/verdade-ou-sacanagem.json` | Verdades e sacanagens. Os filtros no topo são a escolha: **Verdade**, **Sacanagem** ou **Misturar** (sorteia dos dois). |
| Exemplo | `decks/exemplo.json` | Demonstração dos recursos de formatação. Vem **oculto** — abra por `?deck=exemplo`. |

## Os baralhos

O `cartas.json` é só o índice:

```json
{
  "config": { "...": "vale para todos os baralhos" },
  "deckPadrao": "eroticas",
  "decks": [
    { "id": "eroticas", "nome": "Cartas Eróticas", "arquivo": "decks/eroticas.json" },
    { "id": "ousadia",  "nome": "Baralho da Ousadia", "arquivo": "decks/ousadia.json" }
  ]
}
```

| Chave | O que faz |
| --- | --- |
| `config` | Ajustes que valem para todos os baralhos. Cada baralho pode sobrescrever o que quiser. |
| `deckPadrao` | `id` do baralho que abre primeiro. Sem isso, abre o primeiro da lista. |
| `decks[].id` | Identificador único do baralho. |
| `decks[].nome` | Nome no botão de seleção. |
| `decks[].descricao` | Texto que aparece ao passar o mouse no botão. Opcional. |
| `decks[].arquivo` | Caminho do arquivo do baralho. |
| `decks[].oculto` | `true` tira o baralho dos botões, sem apagar nada. Ele continua acessível por `?deck=<id>` no endereço — ex.: `http://localhost:8000/?deck=exemplo`. |
| `decks[].cartas` | Alternativa ao `arquivo`: as cartas direto aqui, sem arquivo separado. |

### Criar um baralho novo

1. Crie `decks/meu-baralho.json` com esta forma:

```json
{
  "config": {
    "titulo": "Meu baralho",
    "subtitulo": "uma linha explicando",
    "modo": "pilha",
    "embaralhar": true,
    "tema": { "corDestaque": "#3bb0a0" },
    "verso": { "icone": "★", "texto": "Meu baralho" }
  },
  "cartas": [
    { "id": "1", "texto": "Primeira carta" },
    { "id": "2", "texto": "Segunda carta", "tempo": 90 }
  ]
}
```

2. Adicione uma linha na lista `decks` do `cartas.json`.

Pronto — o botão aparece sozinho na barra de cima. Os ajustes do baralho valem
por cima do `config` global, então dá para cada baralho ter cor, modo e ritmo
próprios sem repetir tudo.

## `config` — ajustes gerais

### Modo de exibição

| Chave | Padrão | O que faz |
| --- | --- | --- |
| `modo` | `"grade"` | Qual modo abre por padrão. `"grade"` mostra todas as cartas lado a lado, para virar e desvirar. `"pilha"` mostra um baralho: você vira a de cima e ela some para dar lugar à próxima. |
| `mostrarSeletorModo` | `true` | Mostra na tela o botão duplo **Tabela / Pilha**, para trocar de modo sem editar o arquivo. Com `false` fica só o modo definido em `modo`. |
| `textoModoGrade` | `"Tabela"` | Texto do botão do modo grade. |
| `textoModoPilha` | `"Pilha"` | Texto do botão do modo pilha. |

Trocar de modo **mantém onde você está no jogo**. Os dois modos falam do mesmo
estado: carta virada na Tabela é carta já vista, e carta já vista na Pilha está
no descarte.

| Você fez | Ao trocar de modo |
| --- | --- |
| Descartou cartas na Pilha | Elas aparecem viradas para cima na Tabela |
| Virou cartas na Tabela | Elas já entram como descartadas na Pilha |
| Deixou uma carta revelada no topo da Pilha | Ela volta para o topo, revelada — não vai para o descarte |
| Nada | A ordem sorteada do baralho continua a mesma |

Um cronômetro que estava correndo pausa na troca e guarda o tempo que faltava —
o botão volta como "Continuar".

Para começar do zero mesmo, use **Reiniciar**. Trocar de baralho ou de filtro
também monta um baralho novo.

As opções específicas da pilha ficam em [`config.pilha`](#configpilha--o-modo-baralho).

### Cabeçalho e textos da interface

| Chave | Padrão | O que faz |
| --- | --- | --- |
| `titulo` | `""` | Título no topo (também vira o título da aba). |
| `subtitulo` | `""` | Linha abaixo do título. |
| `mostrarCabecalho` | `true` | Esconde o título/subtítulo se `false`. |
| `mostrarContador` | `true` | Mostra "X de Y reveladas". |
| `mostrarBotaoVirarTodas` | `true` | Botão que vira/esconde todas de uma vez. |
| `mostrarBotaoReiniciar` | `true` | Botão que desvira tudo. |
| `mostrarFiltros` | `false` | Botões de filtro por `tags`. |
| `mostrarTags` | `true` | Mostra as etiquetas na carta. Com `false` as tags continuam valendo para os filtros, mas não aparecem — útil quando a categoria já está no `titulo`. |
| `mostrarSeletorDeck` | `true` | Mostra os botões de escolha de baralho no topo. Some sozinho se houver só um baralho. |
| `textoVirarTodas` | `"Virar todas"` | Texto do botão. |
| `textoEsconderTodas` | `"Esconder todas"` | Texto do mesmo botão quando tudo está virado. |
| `textoReiniciar` | `"Reiniciar"` | Texto do botão. |
| `textoFiltroTodos` | `"Todas"` | Texto do filtro que mostra tudo. |
| `textoContador` | `"{reveladas} de {total} reveladas"` | `{reveladas}` e `{total}` são substituídos. |

### Comportamento

| Chave | Padrão | O que faz |
| --- | --- | --- |
| `embaralhar` | `false` | Sorteia a ordem das cartas a cada carregamento. |
| `forcaDoPeso` | `1.5` | Quanto o `peso` das cartas empurra o sorteio. `0` ignora os pesos (sorteio puro). Veja [Embaralhamento com peso](#embaralhamento-com-peso). |
| `pesosPorTag` | `{}` | Peso por tag, ex.: `{ "intenso": 1, "leve": -1 }`. **Soma** com o `peso` escrito na carta. |
| `virarUmaPorVez` | `false` | Ao virar uma carta, as outras se fecham. Bom para quiz. |
| `permitirDesvirar` | `true` | Se `false`, a carta virada não volta mais. |
| `lembrarEstado` | `false` | Guarda no navegador quais cartas já foram reveladas. Vale só no modo grade. |
| `chaveArmazenamento` | `"cartas-viradas"` | Nome usado para guardar esse estado (troque se tiver mais de um baralho). |

### Tamanho e animação

| Chave | Padrão | O que faz |
| --- | --- | --- |
| `colunas` | `0` | Número fixo de colunas. `0` = a grade se ajusta à tela sozinha. |
| `larguraCarta` | `240` | Largura em px (largura *mínima* quando `colunas` é `0`). |
| `alturaCarta` | `320` | Altura em px, ou `"auto"` para a carta acompanhar o tamanho do texto. |
| `espacamento` | `20` | Espaço em px entre as cartas. |
| `duracaoFlip` | `600` | Duração da virada em milissegundos. |
| `eixoFlip` | `"y"` | `"y"` gira na horizontal, `"x"` gira na vertical. |

### `config.pilha` — o modo baralho

Só tem efeito quando `"modo": "pilha"`. Por padrão a tela mostra **uma pilha só**,
centralizada, com as cartas viradas de verso. O fluxo é: clicar na carta de cima
revela o texto; clicar de novo faz ela sumir e a próxima aparece.

| Chave | Padrão | O que faz |
| --- | --- | --- |
| `sumirSozinho` | `0` | Milissegundos até a carta revelada sumir sozinha, sem precisar do segundo clique. `0` desliga. Ex.: `3000` = some 3 segundos depois de virar. |
| `mostrarDescarte` | `false` | Com `true`, as cartas descartadas vão para um monte ao lado, viradas para cima, em vez de sumirem. |
| `descartarAoClicar` | `true` | Clicar numa carta já revelada faz ela sumir. Com `false` ela só desvira, e o sumiço fica por conta do botão. |
| `mostrarBotaoDescartar` | `true` | Botão "Descartar" (funciona mesmo com a carta virada para baixo — serve para pular). |
| `mostrarBotaoVoltar` | `true` | Botão "Voltar": traz de volta a última carta que sumiu. |
| `reembaralharNoFim` | `false` | Quando o baralho acaba, remonta tudo sozinho depois de um instante. |
| `cartasVisiveis` | `4` | Quantas cartas aparecem empilhadas (as outras ficam escondidas atrás). |
| `desvio` | `7` | Px de deslocamento entre uma carta e a de baixo — a "grossura" da pilha. |
| `inclinacao` | `3` | Graus de giro aleatório das cartas no descarte, para parecer um monte de verdade. Só aparece com `mostrarDescarte: true`. |
| `textoDescartar` | `"Descartar"` | Texto do botão. |
| `textoVoltar` | `"Voltar"` | Texto do botão. |
| `textoMonte` | `"Baralho"` | Legenda embaixo da pilha (aparece como "Baralho · 7"). |
| `textoDescarte` | `"Descarte"` | Legenda embaixo do descarte, quando ele está visível. |
| `textoFim` | `"Acabaram as cartas"` | Mensagem no lugar do baralho quando ele esvazia. |
| `textoContador` | `"{restantes} no baralho · {descartadas} descartadas"` | Contador da barra. Aceita `{restantes}`, `{descartadas}` e `{total}`. |

Detalhes que valem saber:

- `embaralhar` no modo pilha embaralha a cada **Reiniciar**, sem precisar recarregar a página.
- Os filtros por `tags` também funcionam: escolher uma tag monta um baralho só com aquelas cartas.
- `alturaCarta: "auto"` funciona, mas como as cartas ficam empilhadas a altura passa a
  ser a da carta de cima. Com textos de tamanhos muito diferentes, uma altura fixa fica melhor.
- `virarUmaPorVez` e `lembrarEstado` não se aplicam aqui — só no modo grade.

### Cronômetro das cartas

Cartas com o campo `tempo` mostram uma contagem regressiva com um **botão
Iniciar** logo abaixo. Virar a carta só mostra o tempo — quem decide quando a
contagem começa é você. Depois de começar, o botão vira **Pausar**, e a pausa
guarda o que faltava (volta como **Continuar**).

| Chave | Padrão | O que faz |
| --- | --- | --- |
| `mostrarTempo` | `true` | Liga o cronômetro nas cartas que têm `tempo`. Com `false`, o tempo é ignorado. |
| `textoIniciarTempo` | `"Iniciar"` | Texto do botão parado. |
| `textoPausarTempo` | `"Pausar"` | Texto do botão enquanto corre. |
| `textoContinuarTempo` | `"Continuar"` | Texto do botão depois de pausar. |
| `textoTempoFim` | `"Tempo!"` | O que aparece no lugar do relógio quando zera. |
| `pilha.sumirNoFimDoTempo` | `false` | No modo pilha, a carta sai sozinha quando o tempo acaba. |

Desvirar a carta devolve o cronômetro ao tempo cheio. Quando zera, o botão volta
a ser "Iniciar", caso queira repetir.

A contagem usa o relógio do sistema, não o número de batidas — se o navegador
travar ou a tela apagar, o tempo continua certo.

### `config.tema` — cores e fontes

| Chave | Exemplo |
| --- | --- |
| `fundoPagina` | `"#12121a"` ou qualquer gradiente CSS |
| `corTexto` | Cor do título e dos textos da interface |
| `corTextoSuave` | Cor do subtítulo e do contador |
| `corDestaque` | Cor dos botões ativos e do foco do teclado |
| `fonteTitulo` | `"Georgia, serif"` |
| `fonteTexto` | `"system-ui, sans-serif"` |
| `raioBorda` | `"18px"` — arredondamento das cartas |
| `sombra` | `"0 14px 34px rgba(0,0,0,0.45)"` |

### `config.verso` — o lado virado para baixo (padrão de todas as cartas)

| Chave | O que faz |
| --- | --- |
| `fundo` | Cor ou gradiente CSS. |
| `corTexto` | Cor do ícone e do texto do verso. |
| `borda` | Borda CSS, ex.: `"1px solid rgba(255,255,255,0.14)"`. |
| `icone` | Qualquer caractere ou emoji grande no centro: `"?"`, `"♠"`, `"🎁"`. |
| `texto` | Texto curto abaixo do ícone. Deixe `""` para nenhum. |
| `imagem` | Caminho de uma imagem de fundo (substitui o `fundo`). |
| `padrao` | `true` desenha a moldura e a textura xadrez decorativa. |

### `config.frente` — o lado revelado (padrão de todas as cartas)

| Chave | O que faz |
| --- | --- |
| `fundo` | Cor ou gradiente. |
| `corTexto` | Cor do texto revelado. |
| `borda` | Borda CSS. |
| `alinhamento` | Horizontal: `"left"`, `"center"` ou `"right"`. |
| `alinhamentoVertical` | Vertical: `"top"` (padrão), `"center"` ou `"bottom"`. Use `"center"` em cartas só de texto. |

---

## `cartas` — a lista de cartas

Cada item da lista é uma carta. Só o que você quiser usar precisa estar lá:

```json
{
  "id": "1",
  "titulo": "Título da carta",
  "texto": "O que aparece quando vira.",
  "imagem": "fotos/gato.jpg",
  "textoImagem": "descrição da imagem",
  "tags": ["categoria"],
  "rodape": "linha pequena no rodapé",
  "verso":  { "icone": "★", "texto": "Sorte", "fundo": "#8b1e3f" },
  "frente": { "fundo": "#fff6e9", "corTexto": "#5c2318", "alinhamento": "center" }
}
```

| Chave | O que faz |
| --- | --- |
| `id` | Identificador único. Usado para lembrar o estado. Se faltar, usa a posição. |
| `titulo` | Título em destaque na frente. Opcional. |
| `texto` | O texto revelado. Pode ser uma string ou uma **lista de strings** (cada uma vira um parágrafo). |
| `imagem` | Imagem no topo da frente da carta. |
| `textoImagem` | Descrição da imagem para leitores de tela. |
| `tags` | Lista de categorias. Aparecem como etiquetas e alimentam os filtros. |
| `tempo` | Segundos de contagem regressiva, iniciada ao virar a carta. Ex.: `60` para um minuto. |
| `peso` | Puxa a carta para o começo ou para o fim do baralho embaralhado. `-1` começo, `0` neutro, `1` fim. Aceita também `"comeco"`, `"meio"`, `"fim"`. Soma com o peso da tag, se houver. |
| `rodape` | Texto pequeno no pé da carta. |
| `verso` | Sobrescreve o `config.verso` só nesta carta. |
| `frente` | Sobrescreve o `config.frente` só nesta carta. |
| `html` | `true` permite escrever HTML puro no `texto` (use só com conteúdo seu). |

### Formatação dentro do `texto`

| Você escreve | Resultado |
| --- | --- |
| `**palavra**` | **negrito** |
| `*palavra*` | *itálico* |
| `` `palavra` `` | `código` |
| `[texto](https://site.com)` | link (abre em nova aba) |
| Uma linha em branco | novo parágrafo |
| Uma quebra de linha só | quebra de linha simples |

---

## Embaralhamento com peso

Às vezes o baralho não é plano: tem carta que combina mais com o começo e carta
que combina mais com o fim. O `peso` resolve isso **sem** travar a ordem.

```json
{ "id": "1",  "texto": "Um beijo demorado.",  "peso": -1 },
{ "id": "20", "texto": "Vale tudo agora.",    "peso": 1 },
{ "id": "10", "texto": "Uma carta comum." }
```

| `peso` | Efeito |
| --- | --- |
| `-1` (ou `"comeco"`) | Tende a sair no começo |
| `0` (padrão, ou `"meio"`) | Sem tendência |
| `1` (ou `"fim"`) | Tende a sair no fim |

Valores intermediários funcionam (`-0.4`, `0.7`), e valores além de ±1 puxam mais forte.

### Como funciona

Cada carta sorteia uma posição = `peso × forcaDoPeso + ruído`. A lista é ordenada
por essa posição. O ruído tem distribuição normal, ou seja, **cauda infinita**: o
peso muda a *probabilidade* da carta cair antes ou depois, mas nunca fixa a
posição. Uma carta puxada para o fim ainda pode sair primeiro — só que raramente.

Sem nenhum peso, todas as posições vêm só do ruído, o que dá um embaralhamento
uniforme comum (qualquer ordem com a mesma chance).

### Regulando com `forcaDoPeso`

Medido num baralho de 30 cartas, com uma carta de peso `-1`, uma de peso `1` e o
resto neutro (3000 embaralhamentos):

| `forcaDoPeso` | Posição média da `-1` | Da neutra | Da `1` | Carta `1` caindo nas 5 primeiras |
| --- | --- | --- | --- | --- |
| `0` | 14,4 | 14,4 | 14,9 | 16% (peso ignorado) |
| `1.5` (padrão) | 4,1 | 14,4 | 24,9 | 0,5% |
| `4` | 0,1 | 14,4 | 28,9 | 0% |

Baixe o valor para um baralho mais imprevisível, suba para uma ordem mais firme.

### Pesando por tag, e afinando por carta

Em baralhos grandes, marcar carta por carta cansa. Dá para pesar por tag:

```json
"pesosPorTag": { "leve": -1, "intenso": 0.8 }
```

Os dois níveis **somam**: a tag define a faixa (qual grupo tende ao começo ou ao
fim) e o `peso` da carta ajusta a ordem *dentro* dessa faixa.

```json
{ "id": "3", "texto": "...", "tags": ["intenso"], "peso": -0.3 }
```

Essa carta fica em `0.8 - 0.3 = 0.5`: continua no grupo dos intensos, mas tende a
sair antes dos outros intensos.

Como escolher a escala: se as faixas das tags estão separadas por `1`, use algo
em torno de `±0.35` nas cartas para só ordenar por dentro. Valores maiores tiram
a carta da faixa da tag de propósito. Quem usa só um dos dois não muda nada — o
outro entra como zero. Se a carta tiver mais de uma tag com peso, vale a primeira.

É assim que o baralho de Cartas Eróticas funciona:

```json
"pesosPorTag": { "30 sec": -1, "40 sec": 0, "90 sec": 1 }
```

com cada carta trazendo um ajuste de `±0.35` vindo da posição dela no PDF
original. Resultado medido em 5000 embaralhamentos: as de 30s ficam entre as
posições 4,5 e 8,9; as de 40s entre 12,4 e 17,1; as de 90s entre 21,3 e 22,2 — e
dentro de cada faixa a ordem do PDF é respeitada, em média.

Sem virar regra fixa: cada faixa já apareceu em quase toda posição do baralho, e
em **28% das partidas** alguma carta de 30s sai depois de alguma de 90s.

## Receitas rápidas

**Quiz — uma resposta por vez, sem poder esconder:**

```json
"virarUmaPorVez": true,
"permitirDesvirar": false
```

**Pilha única, sem botão nenhum — só clicar na carta:**

```json
"modo": "pilha",
"embaralhar": true,
"mostrarContador": false,
"mostrarFiltros": false,
"mostrarSeletorModo": false,
"mostrarBotaoReiniciar": false,
"pilha": {
  "mostrarBotaoDescartar": false,
  "mostrarBotaoVoltar": false,
  "textoFim": "Fim!"
}
```

**A carta some sozinha 3 segundos depois de virar:**

```json
"modo": "pilha",
"pilha": { "sumirSozinho": 3000 }
```

**Baralho que nunca acaba (dá a volta sozinho):**

```json
"modo": "pilha",
"embaralhar": true,
"pilha": { "reembaralharNoFim": true }
```

**Com monte de descarte ao lado, para ver o que já saiu:**

```json
"modo": "pilha",
"pilha": { "mostrarDescarte": true }
```

**Cartas do tamanho do texto, em 3 colunas:**

```json
"colunas": 3,
"alturaCarta": "auto"
```

**Tema claro:**

```json
"tema": {
  "fundoPagina": "#f2f0ea",
  "corTexto": "#20202a",
  "corTextoSuave": "#6b6b78",
  "corDestaque": "#c2410c",
  "sombra": "0 10px 24px rgba(0,0,0,0.12)"
},
"verso": { "fundo": "linear-gradient(145deg, #c2410c, #7c2d12)" }
```

**Baralho de cartas de sorte, embaralhado e sem cabeçalho:**

```json
"embaralhar": true,
"mostrarCabecalho": false,
"mostrarFiltros": false,
"verso": { "icone": "🍀", "texto": "", "padrao": true }
```

**Um baralho com tempo, que passa sozinho quando acaba:**

```json
"modo": "pilha",
"pilha": { "sumirNoFimDoTempo": true }
```

e nas cartas:

```json
{ "id": "1", "texto": "O desafio", "tempo": 120 }
```

**Um baralho de duas categorias (estilo verdade ou desafio):**

Marque cada carta com a `tag` da categoria e ligue os filtros — os botões viram
a escolha do jogador, e "Misturar" sorteia das duas.

```json
"mostrarFiltros": true,
"mostrarTags": false,
"textoFiltroTodos": "Misturar"
```

```json
{ "id": "v1", "titulo": "Verdade", "texto": "...", "tags": ["Verdade"] },
{ "id": "s1", "titulo": "Desafio", "texto": "...", "tags": ["Desafio"] }
```

**Baralho que esquenta aos poucos, mas sem ordem fixa:**

```json
"embaralhar": true,
"forcaDoPeso": 1.5
```

com as cartas mais leves em `"peso": -1` e as mais intensas em `"peso": 1`.

O baralho de Cartas Eróticas combina os dois níveis: a tag da duração define a
faixa, e um ajuste pequeno em cada carta ordena por dentro dela. Veja
[Pesando por tag, e afinando por carta](#pesando-por-tag-e-afinando-por-carta).
