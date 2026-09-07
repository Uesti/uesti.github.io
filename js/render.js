/* ==========================================================================
   Desenha um baralho na tela: mescla a config, cria as cartas e entrega o
   resto para o modo escolhido.
   ========================================================================== */

import { el } from './elementos.js';
import { CONFIG_PADRAO } from './padroes.js';
import {
  config, cartas, todasCartas, ehPilha,
  definirConfig, definirCartas, definirTodasCartas, definirReveladas,
  definirOrdemPilha, definirTopoPendente
} from './estado.js';
import { mesclar } from './utilidades.js';
import { embaralharLista } from './embaralhar.js';
import { armazenamento } from './armazenamento.js';
import { aplicarTema } from './tema.js';
import { criarCarta } from './carta.js';
import { montarFiltros } from './barra.js';
import { aplicarModo } from './modos.js';

export function renderizar(dados) {
  definirConfig(mesclar(CONFIG_PADRAO, dados.config || {}));
  definirCartas(Array.isArray(dados.cartas) ? dados.cartas.slice() : []);

  if (dados.config && dados.config.chaveArmazenamento) {
    armazenamento.chave = dados.config.chaveArmazenamento;
  }

  aplicarTema();

  el.cabecalho.hidden = !(config.mostrarCabecalho && (config.titulo || config.subtitulo));
  el.titulo.textContent = config.titulo || '';
  el.subtitulo.textContent = config.subtitulo || '';
  el.subtitulo.hidden = !config.subtitulo;

  definirReveladas(new Set());
  definirOrdemPilha([]);
  definirTopoPendente(null);
  definirTodasCartas(cartas.map((carta, i) => criarCarta(carta, i)));

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
