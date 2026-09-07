/* ==========================================================================
   Cartas viradas - ponto de entrada.

   Le o cartas.json e liga os botoes da barra. Voce normalmente nao precisa
   mexer no codigo: cores, textos e comportamento vem do JSON.

   Dois modos, escolhidos em config.modo:
     "grade" - todas as cartas lado a lado
     "pilha" - baralho empilhado: vira a de cima e descarta para ver a proxima
   ========================================================================== */

import { el } from './elementos.js';
import { reveladas, todasCartas } from './estado.js';
import { definirTodas } from './carta.js';
import { descartar, voltar } from './pilha.js';
import { reiniciar } from './barra.js';
import { trocarModo } from './modos.js';
import { iniciar } from './decks.js';
import { mostrarAviso } from './aviso.js';

el.btnModoGrade.addEventListener('click', () => trocarModo('grade'));
el.btnModoPilha.addEventListener('click', () => trocarModo('pilha'));
el.btnDescartar.addEventListener('click', descartar);
el.btnVoltar.addEventListener('click', voltar);
el.btnReiniciar.addEventListener('click', reiniciar);

el.btnVirar.addEventListener('click', () => {
  definirTodas(reveladas.size !== todasCartas.length);
});

function carregar() {
  fetch('cartas.json', { cache: 'no-store' })
    .then(r => {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(iniciar)
    .catch(mostrarAviso);
}

carregar();
