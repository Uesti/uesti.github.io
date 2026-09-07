/* ==========================================================================
   Cartas viradas
   Le tudo do arquivo cartas.json. Voce normalmente nao precisa mexer aqui:
   cores, tamanhos, textos e comportamento sao definidos no JSON.

   Dois modos, escolhidos em config.modo:
     "grade" - todas as cartas lado a lado
     "pilha" - baralho empilhado: vira a de cima e descarta para ver a proxima
   ========================================================================== */

'use strict';

/* Valores usados quando a chave nao existe no cartas.json. */
const CONFIG_PADRAO = {
  modo: 'grade',

  titulo: '',
  subtitulo: '',
  mostrarCabecalho: true,
  mostrarContador: true,
  mostrarBotaoVirarTodas: true,
  mostrarBotaoReiniciar: true,
  mostrarFiltros: false,
  mostrarSeletorModo: true,
  mostrarSeletorDeck: true,
  mostrarTags: true,        // false esconde as etiquetas sem desligar os filtros
  mostrarTempo: true,
  textoTempoFim: 'Tempo!',
  textoIniciarTempo: 'Iniciar',
  textoPausarTempo: 'Pausar',
  textoContinuarTempo: 'Continuar',

  textoModoGrade: 'Tabela',
  textoModoPilha: 'Pilha',
  textoVirarTodas: 'Virar todas',
  textoEsconderTodas: 'Esconder todas',
  textoReiniciar: 'Reiniciar',
  textoFiltroTodos: 'Todas',
  textoContador: '{reveladas} de {total} reveladas',

  embaralhar: false,
  forcaDoPeso: 1.5,      // quanto o "peso" da carta empurra na hora de embaralhar
  pesosPorTag: {},       // peso padrao por tag, ex.: { "intenso": 1, "leve": -1 }
  virarUmaPorVez: false,
  permitirDesvirar: true,
  lembrarEstado: false,

  colunas: 0,            // 0 = ajusta sozinho a largura da tela
  larguraCarta: 240,     // px (largura minima quando colunas = 0)
  alturaCarta: 320,      // px, ou "auto" para acompanhar o conteudo
  espacamento: 20,       // px entre as cartas
  duracaoFlip: 600,      // ms da animacao
  eixoFlip: 'y',         // "y" (horizontal) ou "x" (vertical)

  pilha: {
    mostrarDescarte: false,   // true = mostra o monte de descartadas ao lado
    mostrarBotaoDescartar: true,
    mostrarBotaoVoltar: true,
    descartarAoClicar: true,
    sumirSozinho: 0,          // ms para a carta sumir sozinha depois de virar (0 = so no clique)
    sumirNoFimDoTempo: false, // descarta sozinho quando o cronometro da carta zera
    reembaralharNoFim: true,
    cartasVisiveis: 4,     // quantas cartas do monte aparecem empilhadas
    desvio: 7,             // px de deslocamento entre elas
    inclinacao: 3,         // graus de giro aleatorio no descarte
    textoDescartar: 'Descartar',
    textoVoltar: 'Voltar',
    textoMonte: 'Baralho',
    textoDescarte: 'Descarte',
    textoFim: 'Acabaram as cartas',
    textoContador: '{restantes} no baralho · {descartadas} descartadas'
  },

  tema: {
    fundoPagina: '#12121a',
    corTexto: '#ecebf5',
    corTextoSuave: '#a09fb3',
    corDestaque: '#f5c542',
    fonteTitulo: 'Georgia, "Times New Roman", serif',
    fonteTexto: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    raioBorda: '18px',
    sombra: '0 14px 34px rgba(0,0,0,0.38)'
  },

  verso: {
    fundo: 'linear-gradient(145deg, #2b2b5e 0%, #1b1b3a 100%)',
    corTexto: '#ffffff',
    borda: '1px solid rgba(255,255,255,0.14)',
    icone: '?',
    texto: '',
    imagem: null,
    padrao: true
  },

  frente: {
    fundo: '#ffffff',
    corTexto: '#1a1a24',
    borda: '1px solid rgba(0,0,0,0.08)',
    alinhamento: 'left',        // left | center | right
    alinhamentoVertical: 'top'  // top | center | bottom
  }
};

/* Elementos da pagina ---------------------------------------------------- */

const el = {
  cabecalho: document.getElementById('cabecalho'),
  titulo: document.getElementById('titulo'),
  subtitulo: document.getElementById('subtitulo'),
  barra: document.getElementById('barra'),
  filtros: document.getElementById('filtros'),
  seletorDeck: document.getElementById('seletor-deck'),
  seletorModo: document.getElementById('seletor-modo'),
  btnModoGrade: document.getElementById('modo-grade'),
  btnModoPilha: document.getElementById('modo-pilha'),
  contador: document.getElementById('contador'),
  btnDescartar: document.getElementById('btn-descartar'),
  btnVoltar: document.getElementById('btn-voltar'),
  btnVirar: document.getElementById('btn-virar'),
  btnReiniciar: document.getElementById('btn-reiniciar'),
  grade: document.getElementById('grade'),
  pilha: document.getElementById('pilha'),
  monte: document.getElementById('monte'),
  descarte: document.getElementById('descarte'),
  colunaDescarte: document.getElementById('coluna-descarte'),
  pilhaVazia: document.getElementById('pilha-vazia'),
  rotuloMonte: document.getElementById('rotulo-monte'),
  rotuloDescarte: document.getElementById('rotulo-descarte'),
  aviso: document.getElementById('aviso')
};

/* Estado da aplicacao ---------------------------------------------------- */

let config = CONFIG_PADRAO;
let cartas = [];            // dados crus vindos do JSON
let todasCartas = [];       // um elemento <button> para cada carta
let monte = [];             // cartas no baralho (indice 0 = a de cima)
let descartadas = [];       // cartas ja descartadas (ultima = topo do descarte)
let reveladas = new Set();  // ids revelados (usado no modo grade)
let filtroAtual = null;

let configGlobal = {};      // config do cartas.json, valida para todos os baralhos
let decks = [];             // lista de baralhos disponiveis
let deckAtual = null;       // id do baralho aberto
let modoEscolhido = null;   // modo que voce escolheu no seletor, se escolheu
let ordemPilha = [];        // ordem sorteada do baralho, mantida ao trocar de modo
let topoPendente = null;    // carta revelada no topo que ainda nao foi descartada
const cacheDecks = {};      // baralhos ja baixados
const cronometros = new Map();   // carta -> id do setInterval

let timerSumir = null;      // temporizador do "sumir sozinho"

const DURACAO_SAIDA = 340;  // ms da animacao de saida quando nao ha descarte visivel

function ehPilha() {
  return String(config.modo).toLowerCase() === 'pilha';
}

/* Utilidades ------------------------------------------------------------- */

function mesclar(base, extra) {
  const saida = Object.assign({}, base);
  if (!extra || typeof extra !== 'object') return saida;
  for (const chave of Object.keys(extra)) {
    const valorBase = base[chave];
    const valorExtra = extra[chave];
    const ehObjeto = v => v && typeof v === 'object' && !Array.isArray(v);
    saida[chave] = ehObjeto(valorBase) && ehObjeto(valorExtra)
      ? mesclar(valorBase, valorExtra)
      : valorExtra;
  }
  return saida;
}

/* Remonta o baralho sem animacao: a troca de faces tem meio flip de atraso e
   deixaria a face errada aparecendo enquanto as cartas sao reposicionadas. */
function semAnimacao(montar) {
  document.body.classList.add('montando');
  try {
    montar();
    /* Ler o layout aqui obriga o navegador a calcular o estado novo ainda com as
       transicoes desligadas. Depois disso pode religar na mesma hora: a mudanca
       ja aconteceu, entao nada anima retroativamente. Nada de
       requestAnimationFrame aqui - ele nao dispara com a aba em segundo plano
       e a classe ficaria presa, matando todas as animacoes. */
    void document.body.offsetHeight;
  } finally {
    document.body.classList.remove('montando');
  }
}

/* Numero aleatorio com distribuicao normal (media 0, desvio 1) - Box-Muller. */
function ruidoNormal() {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

const ATALHOS_DE_PESO = {
  comeco: -1, 'começo': -1, inicio: -1, 'início': -1,
  meio: 0, neutro: 0,
  fim: 1, final: 1
};

function valorDePeso(bruto) {
  const atalho = ATALHOS_DE_PESO[String(bruto).toLowerCase()];
  if (atalho != null) return atalho;
  const n = Number(bruto);
  return Number.isFinite(n) ? n : 0;
}

/* Peso da carta = peso da tag + peso escrito na propria carta.

   Os dois SOMAM em vez de um anular o outro: a tag define a faixa (qual grupo
   tende ao comeco ou ao fim) e o peso da carta ajusta a ordem dentro dessa
   faixa. Use valores pequenos na carta (+-0.3) para so ordenar por dentro, ou
   valores grandes para tirar a carta da faixa da tag.

   Quem usa so um dos dois nao muda de comportamento - o outro entra como zero.
   Se a carta tiver mais de uma tag com peso, vale a primeira. */
function pesoDe(carta) {
  if (!carta || !carta.dataset) return 0;
  let total = 0;

  const porTag = config.pesosPorTag || {};
  const tags = carta.dataset.tags ? carta.dataset.tags.split('|') : [];
  for (const t of tags) {
    if (porTag[t] != null) {
      total += valorDePeso(porTag[t]);
      break;
    }
  }

  const proprio = carta.dataset.peso;
  if (proprio != null && proprio !== '') total += valorDePeso(proprio);

  return total;
}

/* Embaralhamento com peso.

   Cada carta sorteia uma posicao = peso * forca + ruido normal, e a lista e
   ordenada por ela. Sem pesos, todas as posicoes vem so do ruido, o que da um
   embaralhamento uniforme comum (qualquer ordem tem a mesma chance).

   Com peso, a carta ganha um empurrao: negativo puxa para o comeco, positivo
   para o fim. Como o ruido e normal - cauda infinita - o empurrao muda a
   PROBABILIDADE e nunca trava a posicao: uma carta puxada para o fim ainda pode
   sair primeiro, so que raramente. "forcaDoPeso" regula o quanto isso pesa;
   com 0 o peso e ignorado e volta a ser sorteio puro. */
function embaralharLista(lista) {
  const forca = Number(config.forcaDoPeso);
  const escala = Number.isFinite(forca) ? forca : 0;
  const posicoes = new Map();
  lista.forEach(carta => posicoes.set(carta, pesoDe(carta) * escala + ruidoNormal()));
  lista.sort((a, b) => posicoes.get(a) - posicoes.get(b));
  return lista;
}

function escapar(texto) {
  return String(texto).replace(/[&<>"]/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]
  ));
}

/* Aceita string ou lista de paragrafos. Formatacao leve:
   **negrito**  *italico*  `codigo`  [link](https://...)  quebra de linha. */
function formatarTexto(valor, permitirHtml) {
  const bruto = Array.isArray(valor) ? valor.join('\n\n') : String(valor == null ? '' : valor);
  if (permitirHtml) return bruto;

  let t = escapar(bruto);
  t = t.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  t = t.replace(/\*([^*\n]+)\*/g, '<em>$1</em>');
  t = t.replace(/`([^`]+)`/g, '<code>$1</code>');

  return t.split(/\n{2,}/)
    .map(p => '<p>' + p.replace(/\n/g, '<br>') + '</p>')
    .join('');
}

function comprimento(valor) {
  return typeof valor === 'number' ? valor + 'px' : String(valor);
}

/* Memoria do que ja foi revelado (opcional, so no modo grade) ------------- */

const armazenamento = {
  chave: 'cartas-viradas',
  ler() {
    if (!config.lembrarEstado || ehPilha()) return null;
    try { return JSON.parse(localStorage.getItem(this.chave)); } catch (e) { return null; }
  },
  gravar(lista) {
    if (!config.lembrarEstado || ehPilha()) return;
    try { localStorage.setItem(this.chave, JSON.stringify(lista)); } catch (e) { /* ignora */ }
  },
  limpar() {
    try { localStorage.removeItem(this.chave); } catch (e) { /* ignora */ }
  }
};

/* Tema ------------------------------------------------------------------- */

function aplicarTema() {
  const raiz = document.documentElement.style;
  const t = config.tema;

  raiz.setProperty('--fundo-pagina', t.fundoPagina);
  raiz.setProperty('--cor-texto', t.corTexto);
  raiz.setProperty('--cor-texto-suave', t.corTextoSuave);
  raiz.setProperty('--cor-destaque', t.corDestaque);
  raiz.setProperty('--fonte-titulo', t.fonteTitulo);
  raiz.setProperty('--fonte-texto', t.fonteTexto);
  raiz.setProperty('--raio-borda', comprimento(t.raioBorda));
  raiz.setProperty('--sombra', t.sombra);

  raiz.setProperty('--largura-carta', comprimento(config.larguraCarta));
  raiz.setProperty('--espacamento', comprimento(config.espacamento));
  raiz.setProperty('--duracao-flip', config.duracaoFlip + 'ms');
  raiz.setProperty('--colunas', String(config.colunas || 1));

  const eixoX = String(config.eixoFlip).toLowerCase() === 'x';
  raiz.setProperty('--eixo-x', eixoX ? '1' : '0');
  raiz.setProperty('--eixo-y', eixoX ? '0' : '1');

  const alturaAuto = String(config.alturaCarta).toLowerCase() === 'auto';
  raiz.setProperty('--altura-carta', alturaAuto ? '220px' : comprimento(config.alturaCarta));
  document.body.classList.toggle('altura-auto', alturaAuto);
  document.body.classList.toggle('altura-fixa', !alturaAuto);
  el.grade.classList.toggle('colunas-fixas', Number(config.colunas) > 0);

  aplicarLadosPadrao(document.documentElement, config.verso, config.frente);

  if (config.titulo) document.title = config.titulo;
}

/* Escreve as variaveis de verso/frente em um elemento (raiz ou carta). */
function aplicarLadosPadrao(alvo, verso, frente) {
  const s = alvo.style;
  if (verso) {
    if (verso.imagem) s.setProperty('--verso-fundo', 'url("' + verso.imagem + '")');
    else if (verso.fundo) s.setProperty('--verso-fundo', verso.fundo);
    if (verso.corTexto) s.setProperty('--verso-cor-texto', verso.corTexto);
    if (verso.borda) s.setProperty('--verso-borda', verso.borda);
  }
  if (frente) {
    if (frente.fundo) s.setProperty('--frente-fundo', frente.fundo);
    if (frente.corTexto) s.setProperty('--frente-cor-texto', frente.corTexto);
    if (frente.borda) s.setProperty('--frente-borda', frente.borda);
    if (frente.alinhamento) s.setProperty('--frente-alinhamento', frente.alinhamento);
    if (frente.alinhamentoVertical) {
      const mapa = { top: 'flex-start', center: 'center', bottom: 'flex-end' };
      const v = mapa[frente.alinhamentoVertical] || 'flex-start';
      s.setProperty('--frente-vertical', v);
      /* o rodape e o cronometro so empurram para baixo no alinhamento do topo;
         no centro eles acompanham o grupo, senao "comem" o espaco livre */
      s.setProperty('--frente-empurra', v === 'flex-start' ? 'auto' : '0px');
    }
  }
}

/* Montagem das cartas ---------------------------------------------------- */

function criarCarta(dados, indice) {
  const verso = mesclar(config.verso, dados.verso || {});
  const frente = mesclar(config.frente, dados.frente || {});
  const id = String(dados.id != null ? dados.id : indice);

  /* div em vez de <button>: o cronometro tem um botao proprio dentro da carta,
     e botao dentro de botao e HTML invalido. */
  const carta = document.createElement('div');
  carta.className = 'carta';
  carta.setAttribute('role', 'button');
  carta.tabIndex = 0;
  carta.dataset.id = id;
  carta.dataset.tags = (dados.tags || []).join('|');
  if (dados.peso != null && dados.peso !== '') carta.dataset.peso = String(dados.peso);
  carta.dataset.giro = (Math.random() * 2 - 1) * (Number(config.pilha.inclinacao) || 0);
  carta.setAttribute('aria-pressed', 'false');
  carta.setAttribute('aria-label', dados.titulo || verso.texto || 'Carta ' + (indice + 1));
  aplicarLadosPadrao(carta, dados.verso ? verso : null, dados.frente ? frente : null);

  const interna = document.createElement('div');
  interna.className = 'carta-interna';

  /* --- verso: o lado que aparece virado para baixo --- */
  const faceVerso = document.createElement('div');
  faceVerso.className = 'face face-verso' + (verso.padrao ? ' com-padrao' : '');

  if (verso.icone) {
    const icone = document.createElement('div');
    icone.className = 'verso-icone';
    icone.textContent = verso.icone;
    faceVerso.appendChild(icone);
  }
  if (verso.texto) {
    const rotulo = document.createElement('div');
    rotulo.className = 'verso-texto';
    rotulo.textContent = verso.texto;
    faceVerso.appendChild(rotulo);
  }

  /* --- frente: o conteudo revelado --- */
  const faceFrente = document.createElement('div');
  faceFrente.className = 'face face-frente';

  if (dados.imagem) {
    const img = document.createElement('img');
    img.className = 'frente-imagem';
    img.src = dados.imagem;
    img.alt = dados.textoImagem || '';
    img.loading = 'lazy';
    faceFrente.appendChild(img);
  }

  const conteudo = document.createElement('div');
  conteudo.className = 'frente-conteudo';

  if (dados.titulo) {
    const h = document.createElement('h2');
    h.className = 'frente-titulo';
    h.textContent = dados.titulo;
    conteudo.appendChild(h);
  }

  if (dados.texto) {
    const p = document.createElement('div');
    p.className = 'frente-texto';
    p.innerHTML = formatarTexto(dados.texto, dados.html === true);
    conteudo.appendChild(p);
  }

  if (Array.isArray(dados.tags) && dados.tags.length && config.mostrarTags) {
    const caixa = document.createElement('div');
    caixa.className = 'frente-tags';
    for (const t of dados.tags) {
      const tag = document.createElement('span');
      tag.className = 'tag';
      tag.textContent = t;
      caixa.appendChild(tag);
    }
    conteudo.appendChild(caixa);
  }

  if (dados.tempo && config.mostrarTempo) {
    carta.dataset.tempo = String(dados.tempo);
    carta.dataset.restante = String(dados.tempo);

    const caixa = document.createElement('div');
    caixa.className = 'frente-tempo';

    const valor = document.createElement('span');
    valor.className = 'tempo-valor';
    valor.textContent = formatarTempo(Number(dados.tempo));

    const botao = document.createElement('button');
    botao.type = 'button';
    botao.className = 'botao tempo-botao';
    botao.textContent = config.textoIniciarTempo;
    botao.addEventListener('click', e => {
      e.stopPropagation();          // nao vira nem descarta a carta
      if (carta.dataset.fim === '1') zerarTempo(carta);
      if (cronometros.has(carta)) pausarTempo(carta);
      else iniciarTempo(carta);
    });

    caixa.appendChild(valor);
    caixa.appendChild(botao);
    conteudo.appendChild(caixa);
  }

  if (dados.rodape) {
    const rodape = document.createElement('div');
    rodape.className = 'frente-rodape';
    rodape.textContent = dados.rodape;
    conteudo.appendChild(rodape);
  }

  faceFrente.appendChild(conteudo);
  interna.appendChild(faceVerso);
  interna.appendChild(faceFrente);
  carta.appendChild(interna);

  carta.addEventListener('click', () => cliqueNaCarta(carta));
  carta.addEventListener('keydown', e => {
    if (e.key !== 'Enter' && e.key !== ' ' && e.key !== 'Spacebar') return;
    e.preventDefault();
    cliqueNaCarta(carta);
  });
  return carta;
}

/* Cronometro das cartas que trazem "tempo" (em segundos) ------------------ */

function formatarTempo(segundos) {
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  return m + ':' + String(s).padStart(2, '0');
}

/* O cronometro so anda quando voce aperta o botao na carta.
   A contagem usa o relogio do sistema, entao continua certa mesmo se o
   navegador engasgar ou a tela apagar. */

function pintarTempo(carta) {
  const valor = carta.querySelector('.tempo-valor');
  const botao = carta.querySelector('.tempo-botao');
  if (!valor) return;

  const total = Number(carta.dataset.tempo) || 0;
  const resta = Number(carta.dataset.restante) || 0;
  const acabou = carta.dataset.fim === '1';
  const rodando = cronometros.has(carta);

  valor.textContent = acabou ? config.textoTempoFim : formatarTempo(resta);
  valor.classList.toggle('acabou', acabou);
  valor.classList.toggle('correndo', rodando);

  if (!botao) return;
  botao.textContent = rodando ? config.textoPausarTempo
    : (acabou || resta === total ? config.textoIniciarTempo : config.textoContinuarTempo);
  botao.classList.toggle('rodando', rodando);
}

function iniciarTempo(carta) {
  if (cronometros.has(carta)) return;
  const resta = Number(carta.dataset.restante) || 0;
  if (resta <= 0) return;

  const alvo = Date.now() + resta * 1000;
  cronometros.set(carta, setInterval(() => {
    const falta = Math.max(0, Math.round((alvo - Date.now()) / 1000));
    carta.dataset.restante = String(falta);
    if (falta > 0) return pintarTempo(carta);

    pararTempo(carta);
    carta.dataset.fim = '1';
    pintarTempo(carta);
    if (ehPilha() && config.pilha.sumirNoFimDoTempo && monte[0] === carta) descartar();
  }, 250));

  pintarTempo(carta);
}

function pausarTempo(carta) {
  pararTempo(carta);
  pintarTempo(carta);
}

/* So limpa o intervalo; o que falta fica guardado em dataset.restante. */
function pararTempo(carta) {
  const t = cronometros.get(carta);
  if (t) clearInterval(t);
  cronometros.delete(carta);
}

/* Volta a carta para o tempo cheio. */
function zerarTempo(carta) {
  pararTempo(carta);
  if (!carta.dataset.tempo) return;
  carta.dataset.restante = carta.dataset.tempo;
  delete carta.dataset.fim;
  pintarTempo(carta);
}

function pararTodosOsTempos() {
  const paradas = [...cronometros.keys()];
  cronometros.forEach(t => clearInterval(t));
  cronometros.clear();
  paradas.forEach(pintarTempo);   // senao o botao fica preso em "Pausar"
}

function virarCarta(carta, virar) {
  carta.classList.toggle('virada', virar);
  carta.setAttribute('aria-pressed', String(virar));
  if (virar) {
    reveladas.add(carta.dataset.id);
  } else {
    reveladas.delete(carta.dataset.id);
    zerarTempo(carta);
  }
}

function cliqueNaCarta(carta) {
  if (ehPilha()) {
    if (carta !== monte[0]) return;
    if (!carta.classList.contains('virada')) {
      virarCarta(carta, true);
      agendarSumico(carta);
    }
    else if (config.pilha.descartarAoClicar) return descartar();
    else if (config.permitirDesvirar) virarCarta(carta, false);
    atualizarBarra();
    return;
  }

  const estaVirada = carta.classList.contains('virada');
  if (estaVirada && !config.permitirDesvirar) return;

  if (!estaVirada && config.virarUmaPorVez) {
    el.grade.querySelectorAll('.carta.virada').forEach(outra => virarCarta(outra, false));
  }

  virarCarta(carta, !estaVirada);
  armazenamento.gravar([...reveladas]);
  atualizarBarra();
}

function definirTodas(virar) {
  todasCartas.forEach(carta => virarCarta(carta, virar));
  armazenamento.gravar([...reveladas]);
  atualizarBarra();
}

/* Modo pilha ------------------------------------------------------------- */

/* Faz a carta sumir sozinha alguns milissegundos depois de virada,
   quando config.pilha.sumirSozinho for maior que zero. */
function agendarSumico(carta) {
  cancelarSumico();
  const ms = Number(config.pilha.sumirSozinho) || 0;
  if (ms <= 0) return;
  timerSumir = setTimeout(() => {
    timerSumir = null;
    if (monte[0] === carta && carta.classList.contains('virada')) descartar();
  }, ms);
}

function cancelarSumico() {
  if (timerSumir) clearTimeout(timerSumir);
  timerSumir = null;
}

/* Monta o baralho. Com "preservar", mantem o que ja foi revelado: carta virada
   conta como carta ja vista, entao vai para o descarte, e a ordem sorteada do
   baralho continua a mesma. Sem isso, monta tudo de novo virado para baixo. */
function montarPilha(elementos, preservar) {
  semAnimacao(() => remontarPilha(elementos, preservar));
}

function remontarPilha(elementos, preservar) {
  cancelarSumico();
  el.monte.querySelectorAll('.carta').forEach(c => c.remove());
  el.descarte.querySelectorAll('.carta').forEach(c => c.remove());

  let ordem;
  if (preservar && ordemPilha.length) {
    const querFicar = new Set(elementos);
    ordem = ordemPilha.filter(c => querFicar.has(c));
    const jaTem = new Set(ordem);
    elementos.forEach(c => { if (!jaTem.has(c)) ordem.push(c); });
  } else {
    ordem = elementos.slice();
    if (config.embaralhar) embaralharLista(ordem);
    ordem.forEach(carta => virarCarta(carta, false));
  }
  ordemPilha = ordem;

  monte = ordem.filter(c => !c.classList.contains('virada'));
  descartadas = ordem.filter(c => c.classList.contains('virada'));

  /* a carta que estava revelada no topo volta para o topo, nao para o descarte */
  if (topoPendente && descartadas.includes(topoPendente)) {
    descartadas = descartadas.filter(c => c !== topoPendente);
    monte.unshift(topoPendente);
  }
  topoPendente = null;

  const acomodar = (carta, onde) => {
    carta.classList.remove('saindo');
    carta.style.display = '';
    onde.appendChild(carta);
  };
  monte.forEach(c => acomodar(c, el.monte));
  descartadas.forEach(c => acomodar(c, el.descarte));

  atualizarPilha();
}

/* Reposiciona as cartas do baralho e do descarte.
   "ignorar" pula a carta que esta no meio da animacao de saida. */
function atualizarPilha(ignorar) {
  const p = config.pilha;
  const visiveis = Math.max(1, Number(p.cartasVisiveis) || 1);
  const desvio = Number(p.desvio) || 0;

  monte.forEach((carta, i) => {
    if (carta === ignorar) return;
    const topo = i === 0;
    carta.classList.toggle('topo', topo);
    carta.hidden = i >= visiveis;
    carta.setAttribute('aria-disabled', String(!topo));
    carta.tabIndex = topo ? 0 : -1;
    carta.setAttribute('aria-hidden', topo ? 'false' : 'true');
    carta.style.zIndex = String(monte.length - i);
    carta.style.setProperty('--py', (i * desvio) + 'px');
    carta.style.setProperty('--pr', '0deg');
    carta.style.setProperty('--ps', (1 - i * 0.025).toFixed(3));
  });

  descartadas.forEach((carta, i) => {
    if (carta === ignorar) return;
    const doTopo = descartadas.length - 1 - i;   // 0 = descartada mais recente
    carta.classList.toggle('topo', doTopo === 0);
    carta.hidden = doTopo >= visiveis;
    carta.setAttribute('aria-disabled', 'true');
    carta.tabIndex = -1;
    carta.setAttribute('aria-hidden', doTopo === 0 ? 'false' : 'true');
    carta.style.zIndex = String(i + 1);
    carta.style.setProperty('--py', (doTopo * -desvio) + 'px');
    carta.style.setProperty('--pr', Number(carta.dataset.giro || 0).toFixed(2) + 'deg');
    carta.style.setProperty('--ps', '1');
  });

  el.pilhaVazia.hidden = monte.length > 0;
  el.pilhaVazia.textContent = p.textoFim;
  el.rotuloMonte.textContent = p.textoMonte + ' · ' + monte.length;
  el.rotuloDescarte.textContent = p.textoDescarte + ' · ' + descartadas.length;

  atualizarBarra();

  if (!monte.length && descartadas.length && p.reembaralharNoFim) {
    setTimeout(reiniciar, 800);
  }
}

/* Move a carta de um monte para o outro animando o percurso (tecnica FLIP). */
function moverCarta(carta, destino) {
  const antes = carta.getBoundingClientRect();
  destino.appendChild(carta);
  atualizarPilha();

  if (!carta.animate || el.colunaDescarte.hidden) return;
  const depois = carta.getBoundingClientRect();
  const dx = antes.left - depois.left;
  const dy = antes.top - depois.top;
  if (!dx && !dy) return;

  try {
    carta.animate(
      [{ transform: 'translate(' + dx + 'px, ' + dy + 'px)' },
       { transform: 'translate(0px, 0px)' }],
      { duration: 320, easing: 'cubic-bezier(0.2, 0.8, 0.3, 1)', composite: 'add' }
    );
  } catch (e) { /* navegador sem suporte a composite: fica sem animacao */ }
}

function descartar() {
  cancelarSumico();
  if (!monte.length) return;
  const carta = monte.shift();
  descartadas.push(carta);

  /* Sem monte de descarte visivel, a carta sai de cena voando.
     Ela perde o .topo antes de animar: so uma carta por vez pode ficar no
     fluxo do slot, senao a que esta saindo empurra a proxima para baixo. */
  if (el.colunaDescarte.hidden) {
    carta.classList.remove('topo');
    carta.classList.add('saindo');
    carta.setAttribute('aria-disabled', 'true');
    atualizarPilha(carta);
    setTimeout(() => {
      carta.classList.remove('saindo');
      el.descarte.appendChild(carta);
      atualizarPilha();
    }, DURACAO_SAIDA);
    return;
  }

  moverCarta(carta, el.descarte);
}

function voltar() {
  if (!descartadas.length) return;
  const carta = descartadas.pop();
  monte.unshift(carta);
  moverCarta(carta, el.monte);
}

/* Barra: contador, botoes e filtros -------------------------------------- */

function atualizarBarra() {
  const p = config.pilha;

  if (config.mostrarContador) {
    el.contador.hidden = false;
    el.contador.textContent = ehPilha()
      ? p.textoContador
          .replace('{restantes}', String(monte.length))
          .replace('{descartadas}', String(descartadas.length))
          .replace('{total}', String(monte.length + descartadas.length))
      : config.textoContador
          .replace('{reveladas}', String(reveladas.size))
          .replace('{total}', String(todasCartas.length));
  }

  if (ehPilha()) {
    el.btnDescartar.disabled = !monte.length;
    el.btnVoltar.disabled = !descartadas.length;
  } else if (config.mostrarBotaoVirarTodas) {
    const todas = todasCartas.length > 0 && reveladas.size === todasCartas.length;
    el.btnVirar.textContent = todas ? config.textoEsconderTodas : config.textoVirarTodas;
  }
}

function montarFiltros() {
  el.filtros.textContent = '';
  if (!config.mostrarFiltros) return;

  const tags = [...new Set(cartas.flatMap(c => c.tags || []))];
  if (!tags.length) return;

  const criarBotao = (rotulo, valor) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'botao' + (filtroAtual === valor ? ' ativo' : '');
    b.textContent = rotulo;
    b.addEventListener('click', () => { filtroAtual = valor; aplicarFiltro(); montarFiltros(); });
    el.filtros.appendChild(b);
  };

  criarBotao(config.textoFiltroTodos, null);
  tags.forEach(t => criarBotao(t, t));
}

function passaNoFiltro(carta) {
  if (!filtroAtual) return true;
  const tags = carta.dataset.tags ? carta.dataset.tags.split('|') : [];
  return tags.includes(filtroAtual);
}

function aplicarFiltro() {
  if (ehPilha()) {
    montarPilha(todasCartas.filter(passaNoFiltro));
  } else {
    todasCartas.forEach(c => { c.style.display = passaNoFiltro(c) ? '' : 'none'; });
  }
}

function reiniciar() {
  armazenamento.limpar();
  if (ehPilha()) {
    aplicarFiltro();
  } else {
    definirTodas(false);
    if (config.embaralhar) {
      embaralharLista(todasCartas);
      todasCartas.forEach(carta => el.grade.appendChild(carta));
    }
  }
}

/* Troca de modo ---------------------------------------------------------- */

/* Devolve a carta ao estado neutro depois de ela ter passado pela pilha. */
function limparEstiloDePilha(carta, manterVirada) {
  carta.classList.remove('topo', 'saindo');
  carta.hidden = false;
  carta.removeAttribute('aria-disabled');
  carta.tabIndex = 0;
  carta.removeAttribute('aria-hidden');
  carta.style.zIndex = '';
  ['--px', '--py', '--pr', '--ps'].forEach(v => carta.style.removeProperty(v));
  if (!manterVirada) virarCarta(carta, false);
}

/* Monta a tela no modo atual e acerta os botoes da barra.
   Serve tanto para o primeiro desenho quanto para a troca pelo seletor. */
function aplicarModo(preservar) {
  const pilha = ehPilha();
  cancelarSumico();
  pararTodosOsTempos();

  /* guarda a carta que estava revelada no topo antes de desmontar a pilha */
  if (preservar && !pilha) {
    topoPendente = monte[0] && monte[0].classList.contains('virada') ? monte[0] : null;
  }

  el.grade.hidden = pilha;
  el.pilha.hidden = !pilha;
  el.colunaDescarte.hidden = !pilha || !config.pilha.mostrarDescarte;

  el.seletorModo.hidden = !config.mostrarSeletorModo;
  el.btnModoGrade.classList.toggle('ativo', !pilha);
  el.btnModoPilha.classList.toggle('ativo', pilha);
  el.btnModoGrade.setAttribute('aria-pressed', String(!pilha));
  el.btnModoPilha.setAttribute('aria-pressed', String(pilha));

  el.btnDescartar.hidden = !(pilha && config.pilha.mostrarBotaoDescartar);
  el.btnVoltar.hidden = !(pilha && config.pilha.mostrarBotaoVoltar);
  el.btnVirar.hidden = pilha || !config.mostrarBotaoVirarTodas;
  el.btnReiniciar.hidden = !config.mostrarBotaoReiniciar;
  el.barra.hidden = !(config.mostrarContador || config.mostrarFiltros ||
                      config.mostrarSeletorModo ||
                      !el.btnDescartar.hidden || !el.btnVoltar.hidden ||
                      !el.btnVirar.hidden || !el.btnReiniciar.hidden);

  if (pilha) {
    el.grade.textContent = '';
    montarPilha(todasCartas.filter(passaNoFiltro), preservar);
  } else {
    monte = [];
    descartadas = [];
    el.monte.querySelectorAll('.carta').forEach(c => c.remove());
    el.descarte.querySelectorAll('.carta').forEach(c => c.remove());
    el.grade.textContent = '';
    semAnimacao(() => todasCartas.forEach(carta => {
      limparEstiloDePilha(carta, preservar);
      el.grade.appendChild(carta);
    }));

    if (!preservar) {
      const salvas = armazenamento.ler();
      if (Array.isArray(salvas)) {
        const porId = new Map(todasCartas.map(c => [c.dataset.id, c]));
        salvas.forEach(id => { if (porId.has(id)) virarCarta(porId.get(id), true); });
      }
    }
    aplicarFiltro();
  }

  atualizarBarra();
}

function trocarModo(novo) {
  modoEscolhido = novo;    // sua escolha vale para os outros baralhos tambem
  if (String(config.modo).toLowerCase() === String(novo).toLowerCase()) return;
  config.modo = novo;
  aplicarModo(true);       // mantem o que ja foi virado / descartado
}

/* Baralhos --------------------------------------------------------------- */

/* Baralhos com "oculto": true ficam de fora dos botoes, mas continuam
   acessiveis por ?deck=<id> na barra de endereco. */
function decksVisiveis() {
  return decks.filter(d => !d.oculto);
}

function montarSeletorDeck() {
  el.seletorDeck.textContent = '';
  const lista = decksVisiveis();
  el.seletorDeck.hidden = !(configGlobal.mostrarSeletorDeck !== false && lista.length > 1);
  if (el.seletorDeck.hidden) return;

  lista.forEach(deck => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'botao' + (deck.id === deckAtual ? ' ativo' : '');
    b.textContent = deck.nome || deck.id;
    if (deck.descricao) b.title = deck.descricao;
    b.setAttribute('aria-pressed', String(deck.id === deckAtual));
    b.addEventListener('click', () => abrirDeck(deck.id));
    el.seletorDeck.appendChild(b);
  });
}

/* Abre um baralho: junta a config global com a do proprio baralho e desenha. */
function abrirDeck(id) {
  const deck = decks.find(d => d.id === id) || decks[0];
  if (!deck) return;

  const desenhar = dados => {
    deckAtual = deck.id;
    filtroAtual = null;
    ordemPilha = [];
    topoPendente = null;
    pararTodosOsTempos();
    const cfg = mesclar(configGlobal, dados.config || {});
    if (modoEscolhido) cfg.modo = modoEscolhido;   // respeita o seletor da tela
    renderizar({ config: cfg, cartas: dados.cartas || [] });
    montarSeletorDeck();
  };

  if (Array.isArray(deck.cartas)) return desenhar(deck);      // cartas dentro do indice
  if (cacheDecks[deck.id]) return desenhar(cacheDecks[deck.id]);

  fetch(deck.arquivo, { cache: 'no-store' })
    .then(r => {
      if (!r.ok) throw new Error(deck.arquivo + ' -> HTTP ' + r.status);
      return r.json();
    })
    .then(dados => { cacheDecks[deck.id] = dados; desenhar(dados); })
    .catch(mostrarAviso);
}

/* Ponto de entrada: aceita o indice com varios baralhos ou um arquivo unico. */
function iniciar(dados) {
  configGlobal = dados.config || {};

  if (Array.isArray(dados.decks) && dados.decks.length) {
    decks = dados.decks;
    const pedido = new URLSearchParams(location.search).get('deck');
    const escolhido = (pedido && decks.find(d => d.id === pedido))
      || decks.find(d => d.id === dados.deckPadrao && !d.oculto)
      || decksVisiveis()[0]
      || decks[0];
    abrirDeck(escolhido.id);
  } else {
    decks = [];
    el.seletorDeck.hidden = true;
    renderizar(dados);
  }
}

/* Render ----------------------------------------------------------------- */

function renderizar(dados) {
  config = mesclar(CONFIG_PADRAO, dados.config || {});
  cartas = Array.isArray(dados.cartas) ? dados.cartas.slice() : [];

  if (dados.config && dados.config.chaveArmazenamento) {
    armazenamento.chave = dados.config.chaveArmazenamento;
  }

  aplicarTema();

  el.cabecalho.hidden = !(config.mostrarCabecalho && (config.titulo || config.subtitulo));
  el.titulo.textContent = config.titulo || '';
  el.subtitulo.textContent = config.subtitulo || '';
  el.subtitulo.hidden = !config.subtitulo;

  reveladas = new Set();
  ordemPilha = [];
  topoPendente = null;
  todasCartas = cartas.map((carta, i) => criarCarta(carta, i));

  /* Embaralha depois de criar os elementos, que e onde o peso de cada carta
     fica guardado. No modo pilha quem embaralha e o montarPilha, para o
     Reiniciar dar um baralho novo sem recarregar o arquivo. */
  if (config.embaralhar && !ehPilha()) embaralharLista(todasCartas);

  el.btnDescartar.textContent = config.pilha.textoDescartar;
  el.btnVoltar.textContent = config.pilha.textoVoltar;
  el.btnReiniciar.textContent = config.textoReiniciar;
  el.btnModoGrade.textContent = config.textoModoGrade;
  el.btnModoPilha.textContent = config.textoModoPilha;

  montarFiltros();
  aplicarModo();
  el.aviso.hidden = true;
}

/* Erro de carregamento (acontece ao abrir o index.html com duplo clique) -- */

function mostrarAviso(erro) {
  el.aviso.hidden = false;
  el.aviso.textContent = '';

  const titulo = document.createElement('h2');
  titulo.textContent = 'Não consegui ler o cartas.json';
  el.aviso.appendChild(titulo);

  const p1 = document.createElement('p');
  p1.innerHTML = 'O navegador bloqueia a leitura de arquivos quando a página é aberta ' +
    'com duplo clique (<code>file://</code>). Abra um terminal nesta pasta e rode:';
  el.aviso.appendChild(p1);

  const cmd = document.createElement('p');
  cmd.innerHTML = '<code>python -m http.server 8000</code>';
  el.aviso.appendChild(cmd);

  const p2 = document.createElement('p');
  p2.innerHTML = 'Depois acesse <code>http://localhost:8000</code>. ' +
    'Ou, se preferir, escolha o arquivo aqui mesmo:';
  el.aviso.appendChild(p2);

  const entrada = document.createElement('input');
  entrada.type = 'file';
  entrada.accept = '.json,application/json';
  entrada.addEventListener('change', () => {
    const arquivo = entrada.files && entrada.files[0];
    if (!arquivo) return;
    const leitor = new FileReader();
    leitor.onload = () => {
      try { iniciar(JSON.parse(leitor.result)); }
      catch (e) { alert('JSON inválido: ' + e.message); }
    };
    leitor.readAsText(arquivo, 'utf-8');
  });
  el.aviso.appendChild(entrada);

  const detalhe = document.createElement('p');
  detalhe.style.opacity = '0.6';
  detalhe.style.marginBottom = '0';
  detalhe.textContent = 'Detalhe técnico: ' + erro.message;
  el.aviso.appendChild(detalhe);
}

/* Inicializacao ---------------------------------------------------------- */

el.btnModoGrade.addEventListener('click', () => trocarModo('grade'));
el.btnModoPilha.addEventListener('click', () => trocarModo('pilha'));
el.btnDescartar.addEventListener('click', descartar);
el.btnVoltar.addEventListener('click', voltar);
el.btnReiniciar.addEventListener('click', reiniciar);

el.btnVirar.addEventListener('click', () => {
  definirTodas(reveladas.size !== todasCartas.length);
});

function carregar() {
  fetch('cartas.json', { cache: 'no-store' })
    .then(r => {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(iniciar)
    .catch(mostrarAviso);
}

carregar();
