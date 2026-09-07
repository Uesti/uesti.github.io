/* ==========================================================================
   Memoria do que ja foi revelado (opcional, so no modo grade).
   Ligue com "lembrarEstado": true no JSON.
   ========================================================================== */

import { config, ehPilha } from './estado.js';

export const armazenamento = {
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
