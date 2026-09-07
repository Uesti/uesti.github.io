/* ==========================================================================
   Embaralhamento com peso: a tag define a faixa da carta no baralho e o peso
   escrito na carta ajusta a ordem dentro dessa faixa.
   ========================================================================== */

import { config } from './estado.js';

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
export function embaralharLista(lista) {
  const forca = Number(config.forcaDoPeso);
  const escala = Number.isFinite(forca) ? forca : 0;
  const posicoes = new Map();
  lista.forEach(carta => posicoes.set(carta, pesoDe(carta) * escala + ruidoNormal()));
  lista.sort((a, b) => posicoes.get(a) - posicoes.get(b));
  return lista;
}
