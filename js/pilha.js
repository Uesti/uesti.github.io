/* ==========================================================================
   Modo pilha: baralho de um lado, descarte do outro. Vira a carta de cima e
   descarta para ver a proxima.
   ========================================================================== */

import { el } from './elementos.js';
import {
  config, monte, descartadas, ordemPilha, topoPendente,
  definirMonte, definirDescartadas, definirOrdemPilha, definirTopoPendente
} from './estado.js';
import { semAnimacao } from './utilidades.js';
import { embaralharLista } from './embaralhar.js';
import { virarCarta } from './carta.js';
import { atualizarBarra, reiniciar } from './barra.js';

let timerSumir = null;      // temporizador do "sumir sozinho"

const DURACAO_SAIDA = 340;  // ms da animacao de saida quando nao ha descarte visivel

/* Faz a carta sumir sozinha alguns milissegundos depois de virada,
   quando config.pilha.sumirSozinho for maior que zero. */
export function agendarSumico(carta) {
  cancelarSumico();
  const ms = Number(config.pilha.sumirSozinho) || 0;
  if (ms <= 0) return;
  timerSumir = setTimeout(() => {
    timerSumir = null;
    if (monte[0] === carta && carta.classList.contains('virada')) descartar();
  }, ms);
}

export function cancelarSumico() {
  if (timerSumir) clearTimeout(timerSumir);
  timerSumir = null;
}

/* Monta o baralho. Com "preservar", mantem o que ja foi revelado: carta virada
   conta como carta ja vista, entao vai para o descarte, e a ordem sorteada do
   baralho continua a mesma. Sem isso, monta tudo de novo virado para baixo. */
export function montarPilha(elementos, preservar) {
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
  definirOrdemPilha(ordem);

  definirMonte(ordem.filter(c => !c.classList.contains('virada')));
  definirDescartadas(ordem.filter(c => c.classList.contains('virada')));

  /* a carta que estava revelada no topo volta para o topo, nao para o descarte */
  if (topoPendente && descartadas.includes(topoPendente)) {
    definirDescartadas(descartadas.filter(c => c !== topoPendente));
    monte.unshift(topoPendente);
  }
  definirTopoPendente(null);

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
export function atualizarPilha(ignorar) {
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

export function descartar() {
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

export function voltar() {
  if (!descartadas.length) return;
  const carta = descartadas.pop();
  monte.unshift(carta);
  moverCarta(carta, el.monte);
}
