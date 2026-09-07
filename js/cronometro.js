/* ==========================================================================
   Cronometro das cartas que trazem "tempo" (em segundos).

   O cronometro so anda quando voce aperta o botao na carta. A contagem usa o
   relogio do sistema, entao continua certa mesmo se o navegador engasgar ou a
   tela apagar.
   ========================================================================== */

import { config, ehPilha, monte } from './estado.js';
import { descartar } from './pilha.js';

const cronometros = new Map();   // carta -> id do setInterval

export function formatarTempo(segundos) {
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  return m + ':' + String(s).padStart(2, '0');
}

function pintarTempo(carta) {
  const valor = carta.querySelector('.tempo-valor');
  const botao = carta.querySelector('.tempo-botao');
  if (!valor) return;

  const total = Number(carta.dataset.tempo) || 0;
  const resta = Number(carta.dataset.restante) || 0;
  const acabou = carta.dataset.fim === '1';
  const rodando = cronometros.has(carta);

  valor.textContent = acabou ? config.textoTempoFim : formatarTempo(resta);
  valor.classList.toggle('acabou', acabou);
  valor.classList.toggle('correndo', rodando);

  if (!botao) return;
  botao.textContent = rodando ? config.textoPausarTempo
    : (acabou || resta === total ? config.textoIniciarTempo : config.textoContinuarTempo);
  botao.classList.toggle('rodando', rodando);
}

function iniciarTempo(carta) {
  if (cronometros.has(carta)) return;
  const resta = Number(carta.dataset.restante) || 0;
  if (resta <= 0) return;

  const alvo = Date.now() + resta * 1000;
  cronometros.set(carta, setInterval(() => {
    const falta = Math.max(0, Math.round((alvo - Date.now()) / 1000));
    carta.dataset.restante = String(falta);
    if (falta > 0) return pintarTempo(carta);

    pararTempo(carta);
    carta.dataset.fim = '1';
    pintarTempo(carta);
    if (ehPilha() && config.pilha.sumirNoFimDoTempo && monte[0] === carta) descartar();
  }, 250));

  pintarTempo(carta);
}

function pausarTempo(carta) {
  pararTempo(carta);
  pintarTempo(carta);
}

/* So limpa o intervalo; o que falta fica guardado em dataset.restante. */
function pararTempo(carta) {
  const t = cronometros.get(carta);
  if (t) clearInterval(t);
  cronometros.delete(carta);
}

/* Volta a carta para o tempo cheio. */
export function zerarTempo(carta) {
  pararTempo(carta);
  if (!carta.dataset.tempo) return;
  carta.dataset.restante = carta.dataset.tempo;
  delete carta.dataset.fim;
  pintarTempo(carta);
}

export function pararTodosOsTempos() {
  const paradas = [...cronometros.keys()];
  cronometros.forEach(t => clearInterval(t));
  cronometros.clear();
  paradas.forEach(pintarTempo);   // senao o botao fica preso em "Pausar"
}

/* O que o botao dentro da carta faz: retoma, pausa ou recomeca. */
export function alternarTempo(carta) {
  if (carta.dataset.fim === '1') zerarTempo(carta);
  if (cronometros.has(carta)) pausarTempo(carta);
  else iniciarTempo(carta);
}
