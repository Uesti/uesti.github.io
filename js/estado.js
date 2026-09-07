/* ==========================================================================
   Estado compartilhado entre os modulos.

   Quem importa "config", "monte" e companhia sempre le o valor atual: modulo
   ES entrega o nome vivo, nao uma copia. O que nao da e atribuir de fora - por
   isso cada valor tem um "definirX". Listas e conjuntos podem ser mexidos no
   lugar (push, shift, add) sem passar por eles.
   ========================================================================== */

import { CONFIG_PADRAO } from './padroes.js';

export let config = CONFIG_PADRAO;   // config do baralho aberto, ja mesclada
export let cartas = [];              // dados crus vindos do JSON
export let todasCartas = [];         // um elemento para cada carta
export let monte = [];               // cartas no baralho (indice 0 = a de cima)
export let descartadas = [];         // cartas ja descartadas (ultima = topo)
export let reveladas = new Set();    // ids revelados (usado no modo grade)
export let filtroAtual = null;
export let modoEscolhido = null;     // modo escolhido no seletor, se escolhido
export let ordemPilha = [];          // ordem sorteada, mantida ao trocar de modo
export let topoPendente = null;      // carta revelada no topo, ainda nao descartada

export function definirConfig(valor) { config = valor; }
export function definirCartas(valor) { cartas = valor; }
export function definirTodasCartas(valor) { todasCartas = valor; }
export function definirMonte(valor) { monte = valor; }
export function definirDescartadas(valor) { descartadas = valor; }
export function definirReveladas(valor) { reveladas = valor; }
export function definirFiltroAtual(valor) { filtroAtual = valor; }
export function definirModoEscolhido(valor) { modoEscolhido = valor; }
export function definirOrdemPilha(valor) { ordemPilha = valor; }
export function definirTopoPendente(valor) { topoPendente = valor; }

export function ehPilha() {
  return String(config.modo).toLowerCase() === 'pilha';
}
