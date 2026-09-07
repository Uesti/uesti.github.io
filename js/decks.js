/* ==========================================================================
   Baralhos: le o indice do cartas.json, monta os botoes de selecao e abre o
   baralho pedido juntando a config global com a do proprio baralho.
   ========================================================================== */

import { el } from './elementos.js';
import {
  modoEscolhido, definirFiltroAtual, definirOrdemPilha, definirTopoPendente
} from './estado.js';
import { mesclar } from './utilidades.js';
import { pararTodosOsTempos } from './cronometro.js';
import { renderizar } from './render.js';
import { mostrarAviso } from './aviso.js';

let configGlobal = {};      // config do cartas.json, valida para todos os baralhos
let decks = [];             // lista de baralhos disponiveis
let deckAtual = null;       // id do baralho aberto
const cacheDecks = {};      // baralhos ja baixados

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
    definirFiltroAtual(null);
    definirOrdemPilha([]);
    definirTopoPendente(null);
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
export function iniciar(dados) {
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
