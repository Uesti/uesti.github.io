/* ==========================================================================
   Tema: passa o "config.tema", o verso e a frente do JSON para as variaveis
   CSS que os arquivos de css/ usam.
   ========================================================================== */

import { el } from './elementos.js';
import { config } from './estado.js';
import { comprimento } from './utilidades.js';

export function aplicarTema() {
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
export function aplicarLadosPadrao(alvo, verso, frente) {
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
