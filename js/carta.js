/* ==========================================================================
   A carta: montagem do elemento a partir dos dados do JSON, o virar e o
   clique. Vale para os dois modos - a pilha e a grade usam a mesma carta.
   ========================================================================== */

import { el } from './elementos.js';
import { config, ehPilha, monte, reveladas, todasCartas } from './estado.js';
import { mesclar, formatarTexto } from './utilidades.js';
import { aplicarLadosPadrao } from './tema.js';
import { formatarTempo, alternarTempo, zerarTempo } from './cronometro.js';
import { armazenamento } from './armazenamento.js';
import { descartar, agendarSumico } from './pilha.js';
import { atualizarBarra } from './barra.js';

export function criarCarta(dados, indice) {
  const verso = mesclar(config.verso, dados.verso || {});
  const frente = mesclar(config.frente, dados.frente || {});
  const id = String(dados.id != null ? dados.id : indice);

  /* div em vez de <button>: o cronometro tem um botao proprio dentro da carta,
     e botao dentro de botao e HTML invalido. */
  const carta = document.createElement('div');
  carta.className = 'carta';
  carta.setAttribute('role', 'button');
  carta.tabIndex = 0;
  carta.dataset.id = id;
  carta.dataset.tags = (dados.tags || []).join('|');
  if (dados.peso != null && dados.peso !== '') carta.dataset.peso = String(dados.peso);
  carta.dataset.giro = (Math.random() * 2 - 1) * (Number(config.pilha.inclinacao) || 0);
  carta.setAttribute('aria-pressed', 'false');
  carta.setAttribute('aria-label', dados.titulo || verso.texto || 'Carta ' + (indice + 1));
  aplicarLadosPadrao(carta, dados.verso ? verso : null, dados.frente ? frente : null);

  const interna = document.createElement('div');
  interna.className = 'carta-interna';

  /* --- verso: o lado que aparece virado para baixo --- */
  const faceVerso = document.createElement('div');
  faceVerso.className = 'face face-verso' + (verso.padrao ? ' com-padrao' : '');

  if (verso.icone) {
    const icone = document.createElement('div');
    icone.className = 'verso-icone';
    icone.textContent = verso.icone;
    faceVerso.appendChild(icone);
  }
  if (verso.texto) {
    const rotulo = document.createElement('div');
    rotulo.className = 'verso-texto';
    rotulo.textContent = verso.texto;
    faceVerso.appendChild(rotulo);
  }

  /* --- frente: o conteudo revelado --- */
  const faceFrente = document.createElement('div');
  faceFrente.className = 'face face-frente';

  if (dados.imagem) {
    const img = document.createElement('img');
    img.className = 'frente-imagem';
    img.src = dados.imagem;
    img.alt = dados.textoImagem || '';
    img.loading = 'lazy';
    faceFrente.appendChild(img);
  }

  const conteudo = document.createElement('div');
  conteudo.className = 'frente-conteudo';

  if (dados.titulo) {
    const h = document.createElement('h2');
    h.className = 'frente-titulo';
    h.textContent = dados.titulo;
    conteudo.appendChild(h);
  }

  if (dados.texto) {
    const p = document.createElement('div');
    p.className = 'frente-texto';
    p.innerHTML = formatarTexto(dados.texto, dados.html === true);
    conteudo.appendChild(p);
  }

  if (Array.isArray(dados.tags) && dados.tags.length && config.mostrarTags) {
    const caixa = document.createElement('div');
    caixa.className = 'frente-tags';
    for (const t of dados.tags) {
      const tag = document.createElement('span');
      tag.className = 'tag';
      tag.textContent = t;
      caixa.appendChild(tag);
    }
    conteudo.appendChild(caixa);
  }

  if (dados.tempo && config.mostrarTempo) {
    carta.dataset.tempo = String(dados.tempo);
    carta.dataset.restante = String(dados.tempo);

    const caixa = document.createElement('div');
    caixa.className = 'frente-tempo';

    const valor = document.createElement('span');
    valor.className = 'tempo-valor';
    valor.textContent = formatarTempo(Number(dados.tempo));

    const botao = document.createElement('button');
    botao.type = 'button';
    botao.className = 'botao tempo-botao';
    botao.textContent = config.textoIniciarTempo;
    botao.addEventListener('click', e => {
      e.stopPropagation();          // nao vira nem descarta a carta
      alternarTempo(carta);
    });

    caixa.appendChild(valor);
    caixa.appendChild(botao);
    conteudo.appendChild(caixa);
  }

  if (dados.rodape) {
    const rodape = document.createElement('div');
    rodape.className = 'frente-rodape';
    rodape.textContent = dados.rodape;
    conteudo.appendChild(rodape);
  }

  faceFrente.appendChild(conteudo);
  interna.appendChild(faceVerso);
  interna.appendChild(faceFrente);
  carta.appendChild(interna);

  carta.addEventListener('click', () => cliqueNaCarta(carta));
  carta.addEventListener('keydown', e => {
    if (e.key !== 'Enter' && e.key !== ' ' && e.key !== 'Spacebar') return;
    e.preventDefault();
    cliqueNaCarta(carta);
  });
  return carta;
}

export function virarCarta(carta, virar) {
  carta.classList.toggle('virada', virar);
  carta.setAttribute('aria-pressed', String(virar));
  if (virar) {
    reveladas.add(carta.dataset.id);
  } else {
    reveladas.delete(carta.dataset.id);
    zerarTempo(carta);
  }
}

export function cliqueNaCarta(carta) {
  if (ehPilha()) {
    if (carta !== monte[0]) return;
    if (!carta.classList.contains('virada')) {
      virarCarta(carta, true);
      agendarSumico(carta);
    }
    else if (config.pilha.descartarAoClicar) return descartar();
    else if (config.permitirDesvirar) virarCarta(carta, false);
    atualizarBarra();
    return;
  }

  const estaVirada = carta.classList.contains('virada');
  if (estaVirada && !config.permitirDesvirar) return;

  if (!estaVirada && config.virarUmaPorVez) {
    el.grade.querySelectorAll('.carta.virada').forEach(outra => virarCarta(outra, false));
  }

  virarCarta(carta, !estaVirada);
  armazenamento.gravar([...reveladas]);
  atualizarBarra();
}

export function definirTodas(virar) {
  todasCartas.forEach(carta => virarCarta(carta, virar));
  armazenamento.gravar([...reveladas]);
  atualizarBarra();
}
