/* ==========================================================================
   Valores usados quando a chave nao existe no cartas.json.
   Tudo aqui pode ser sobrescrito pelo "config" do JSON.
   ========================================================================== */

export const CONFIG_PADRAO = {
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
