/* ==========================================================================
   Barra do topo: contador, filtros por tag e o botao de reiniciar.
   ========================================================================== */

import { el } from './elementos.js';
import {
  config, ehPilha, cartas, todasCartas, monte, descartadas, reveladas,
  filtroAtual, definirFiltroAtual
} from './estado.js';
import { embaralharLista } from './embaralhar.js';
import { armazenamento } from './armazenamento.js';
import { definirTodas } from './carta.js';
import { montarPilha } from './pilha.js';

export function atualizarBarra() {
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

export function montarFiltros() {
  el.filtros.textContent = '';
  if (!config.mostrarFiltros) return;

  const tags = [...new Set(cartas.flatMap(c => c.tags || []))];
  if (!tags.length) return;

  const criarBotao = (rotulo, valor) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'botao' + (filtroAtual === valor ? ' ativo' : '');
    b.textContent = rotulo;
    b.addEventListener('click', () => { definirFiltroAtual(valor); aplicarFiltro(); montarFiltros(); });
    el.filtros.appendChild(b);
  };

  criarBotao(config.textoFiltroTodos, null);
  tags.forEach(t => criarBotao(t, t));
}

export function passaNoFiltro(carta) {
  if (!filtroAtual) return true;
  const tags = carta.dataset.tags ? carta.dataset.tags.split('|') : [];
  return tags.includes(filtroAtual);
}

export function aplicarFiltro() {
  if (ehPilha()) {
    montarPilha(todasCartas.filter(passaNoFiltro));
  } else {
    todasCartas.forEach(c => { c.style.display = passaNoFiltro(c) ? '' : 'none'; });
  }
}

export function reiniciar() {
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
