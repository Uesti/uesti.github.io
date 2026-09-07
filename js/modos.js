/* ==========================================================================
   Troca entre os dois modos ("grade" e "pilha") e montagem da tela no modo
   atual. Serve tanto para o primeiro desenho quanto para o seletor.
   ========================================================================== */

import { el } from './elementos.js';
import {
  config, ehPilha, monte, todasCartas,
  definirMonte, definirDescartadas, definirTopoPendente, definirModoEscolhido
} from './estado.js';
import { semAnimacao } from './utilidades.js';
import { armazenamento } from './armazenamento.js';
import { virarCarta } from './carta.js';
import { cancelarSumico, montarPilha } from './pilha.js';
import { pararTodosOsTempos } from './cronometro.js';
import { atualizarBarra, passaNoFiltro, aplicarFiltro } from './barra.js';

/* Devolve a carta ao estado neutro depois de ela ter passado pela pilha. */
export function limparEstiloDePilha(carta, manterVirada) {
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
export function aplicarModo(preservar) {
  const pilha = ehPilha();
  cancelarSumico();
  pararTodosOsTempos();

  /* guarda a carta que estava revelada no topo antes de desmontar a pilha */
  if (preservar && !pilha) {
    definirTopoPendente(monte[0] && monte[0].classList.contains('virada') ? monte[0] : null);
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
    definirMonte([]);
    definirDescartadas([]);
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

export function trocarModo(novo) {
  definirModoEscolhido(novo);   // sua escolha vale para os outros baralhos tambem
  if (String(config.modo).toLowerCase() === String(novo).toLowerCase()) return;
  config.modo = novo;
  aplicarModo(true);       // mantem o que ja foi virado / descartado
}
