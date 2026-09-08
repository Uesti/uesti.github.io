/* ==========================================================================
   Bateria de testes do embaralhamento.

   Roda o embaralhador DE VERDADE - importa `embaralharLista` de
   js/embaralhar.js e monta a config do mesmo jeito que js/render.js monta
   (CONFIG_PADRAO <- cartas.json <- config do deck). Nao ha copia do
   algoritmo aqui: se o embaralhador mudar, o teste acompanha.

   Sem nenhum argumento ja mostra tudo:

     node tools/testar-embaralhamento.mjs

   Cinco opcoes, todas dispensaveis (o proprio programa lembra delas no fim):

     --deck=<id>       so um baralho (padrao: todos os nao ocultos)
     --n=<int>         quantas vezes embaralhar (padrao: 5000)
     --filtro=<tag>    simula o filtro do jogo: so as cartas dessa tag
     --tags=<lista>    testa outros pesosPorTag sem editar o JSON,
                       no formato "nome:valor,nome:valor"
     --csv=<arquivo>   grava a tabela em CSV, com a contagem de cada posicao
   ========================================================================== */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { embaralharLista } from '../js/embaralhar.js';
import { definirConfig } from '../js/estado.js';
import { CONFIG_PADRAO } from '../js/padroes.js';
import { mesclar } from '../js/utilidades.js';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const lerJSON = rel => JSON.parse(readFileSync(join(RAIZ, rel), 'utf8'));

/* -------------------------------------------------------------- argumentos */

const args = process.argv.slice(2);
function opcao(nome, padrao = null) {
  const p = args.find(a => a === `--${nome}` || a.startsWith(`--${nome}=`));
  if (!p) return padrao;
  return p.includes('=') ? p.slice(p.indexOf('=') + 1) : true;
}

const CONHECIDAS = ['deck', 'n', 'filtro', 'tags', 'csv'];
const desconhecida = args.find(a => a.startsWith('--') &&
  !CONHECIDAS.includes(a.replace(/^--/, '').split('=')[0]));
if (desconhecida) {
  console.error(`Opcao desconhecida: ${desconhecida}`);
  console.error(`As unicas sao: ${CONHECIDAS.map(o => '--' + o).join(', ')}`);
  process.exit(1);
}

const DECK_ALVO = opcao('deck');
const FILTRO = opcao('filtro');
const CSV = opcao('csv');

const N = Number(opcao('n', 5000));
if (!Number.isFinite(N) || N < 1 || Math.floor(N) !== N) {
  console.error(`--n precisa ser um inteiro >= 1 (recebi "${opcao('n')}").`);
  process.exit(1);
}

/* "nome:valor,nome:valor" - divide no ULTIMO ":" porque o nome pode ter
   espaco e acento ("30 sec:-0.4"). */
function lerTags(txt) {
  if (!txt) return null;
  const saida = {};
  for (const parte of String(txt).split(',')) {
    const i = parte.lastIndexOf(':');
    if (i < 0) continue;
    saida[parte.slice(0, i).trim()] = Number(parte.slice(i + 1));
  }
  return saida;
}
const TAGS_OVERRIDE = lerTags(opcao('tags'));

/* -------------------------------------------------------------- utilidades */

const C = {
  off: '\x1b[0m', dim: '\x1b[2m', neg: '\x1b[1m',
  ciano: '\x1b[36m', verde: '\x1b[32m', amarelo: '\x1b[33m', vermelho: '\x1b[31m'
};
const usarCor = process.stdout.isTTY && !process.env.NO_COLOR;
const cor = (c, t) => (usarCor ? c + t + C.off : String(t));

const num = (v, casas = 2, larg = 0) =>
  ((v >= 0 ? '+' : '-') + Math.abs(v).toFixed(casas)).padStart(larg, ' ');
const pct = v => (v * 100).toFixed(0) + '%';

const media = a => a.reduce((s, v) => s + v, 0) / a.length;
const desvio = a => { const m = media(a); return Math.sqrt(media(a.map(v => (v - m) ** 2))); };

function percentil(ordenado, p) {
  const i = (ordenado.length - 1) * p;
  const lo = Math.floor(i), hi = Math.ceil(i);
  return lo === hi ? ordenado[lo] : ordenado[lo] + (ordenado[hi] - ordenado[lo]) * (i - lo);
}

/* Postos com media em caso de empate - necessario porque muitas cartas
   receberam pesos iguais de proposito. */
function postos(valores) {
  const ordem = valores.map((v, i) => [v, i]).sort((a, b) => a[0] - b[0]);
  const r = new Array(valores.length);
  for (let i = 0; i < ordem.length;) {
    let j = i;
    while (j + 1 < ordem.length && ordem[j + 1][0] === ordem[i][0]) j++;
    const posto = (i + j) / 2 + 1;
    for (let k = i; k <= j; k++) r[ordem[k][1]] = posto;
    i = j + 1;
  }
  return r;
}

/* Spearman: 1 = a ordem prevista bate exatamente com a que sai. */
function spearman(xs, ys) {
  const a = postos(xs), b = postos(ys);
  const ma = media(a), mb = media(b);
  let s = 0, da = 0, db = 0;
  for (let i = 0; i < a.length; i++) {
    s += (a[i] - ma) * (b[i] - mb);
    da += (a[i] - ma) ** 2;
    db += (b[i] - mb) ** 2;
  }
  return da && db ? s / Math.sqrt(da * db) : 0;
}

const BLOCOS = ' ▁▂▃▄▅▆▇█';

/* Uma coluna por posicao da pilha. Cada linha e normalizada pelo proprio pico,
   entao a barra mostra o FORMATO da distribuicao, nao a altura absoluta. */
const distribuicao = (hist, pico) =>
  hist.map(v => BLOCOS[v === 0 ? 0 : 1 + Math.min(7, Math.floor(v / pico * 7.999))]).join('');

/* Regua "1   5    10 ..." com uma coluna por posicao, alinhada ao recuo. */
function regua(total, recuo) {
  const marcas = [1];
  for (let p = 5; p <= total; p += 5) marcas.push(p);
  let numeros = '', barras = '';
  for (const p of marcas) {
    numeros = numeros.padEnd(p - 1, ' ') + String(p);
    barras = barras.padEnd(p - 1, ' ') + '|';
  }
  const pad = ' '.repeat(recuo);
  return [pad + numeros, pad + barras];
}

const corta = (s, n) => (s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s);

/* ------------------------------------------- monta o baralho para o teste */

/* Reproduz o que js/carta.js grava no dataset. `embaralharLista` so le
   dataset.tags e dataset.peso, entao um objeto simples basta. */
function elementoFalso(dados, indice) {
  const dataset = {
    id: String(dados.id != null ? dados.id : indice),
    tags: (dados.tags || []).join('|')
  };
  if (dados.peso != null && dados.peso !== '') dataset.peso = String(dados.peso);
  return { dataset, dados };
}

/* Mesma regra do pesoDe() em embaralhar.js: vale a PRIMEIRA tag com peso. */
function tagQueConta(dados, pesosPorTag) {
  for (const t of dados.tags || []) if (pesosPorTag[t] != null) return t;
  return null;
}

/* ------------------------------------------------------------------ teste */

function rodar(deck, cfgDeck) {
  const cfg = mesclar(cfgDeck, {});
  if (TAGS_OVERRIDE) cfg.pesosPorTag = TAGS_OVERRIDE;
  definirConfig(cfg);

  const porTag = cfg.pesosPorTag || {};

  /* Guarda contra --tags digitado errado. Nome de tag com espaco ("30 sec")
     precisa ir entre aspas no shell, senao chega picado e nao casa com nada. */
  if (TAGS_OVERRIDE) {
    const existentes = new Set(deck.cartas.flatMap(c => c.tags || []));
    const orfas = Object.keys(TAGS_OVERRIDE).filter(t => !existentes.has(t));
    if (orfas.length) {
      console.error('');
      console.error(`  AVISO: --tags traz nome que nao existe neste baralho: ${orfas.map(o => `"${o}"`).join(', ')}`);
      console.error(`  tags do baralho: ${[...existentes].map(o => `"${o}"`).join(', ')}`);
      console.error('  se a tag tem espaco, ponha o argumento inteiro entre aspas.');
      console.error('');
    }
  }

  let cartas = deck.cartas;
  if (FILTRO) cartas = cartas.filter(c => (c.tags || []).includes(FILTRO));
  if (!cartas.length) throw new Error(`nenhuma carta com a tag "${FILTRO}"`);

  const elementos = cartas.map(elementoFalso);
  const total = elementos.length;
  const posicoes = new Map(elementos.map(e => [e, []]));

  let vizinhosMesmaTag = 0, vizinhosTotal = 0;

  for (let r = 0; r < N; r++) {
    const ordem = embaralharLista(elementos.slice());
    ordem.forEach((e, i) => posicoes.get(e).push(i + 1));
    for (let i = 1; i < ordem.length; i++) {
      const a = tagQueConta(ordem[i - 1].dados, porTag);
      const b = tagQueConta(ordem[i].dados, porTag);
      vizinhosTotal++;
      if (a != null && a === b) vizinhosMesmaTag++;
    }
  }

  /* Linha de base: o mesmo baralho com o peso desligado (sorteio puro). */
  definirConfig(mesclar(cfg, { forcaDoPeso: 0 }));
  let baseVizinhos = 0, baseVizinhosTotal = 0;
  const basePos = new Map(elementos.map(e => [e, []]));
  for (let r = 0; r < Math.min(N, 2000); r++) {
    const ordem = embaralharLista(elementos.slice());
    ordem.forEach((e, i) => basePos.get(e).push(i + 1));
    for (let i = 1; i < ordem.length; i++) {
      const a = tagQueConta(ordem[i - 1].dados, porTag);
      const b = tagQueConta(ordem[i].dados, porTag);
      baseVizinhosTotal++;
      if (a != null && a === b) baseVizinhos++;
    }
  }
  definirConfig(cfg);

  const linhas = elementos.map(e => {
    const ps = posicoes.get(e).slice().sort((a, b) => a - b);
    const tag = tagQueConta(e.dados, porTag);
    const pesoTag = tag ? Number(porTag[tag]) : 0;
    const pesoCarta = e.dataset.peso != null ? Number(e.dataset.peso) : 0;

    /* Quantas vezes a carta caiu em cada posicao. hist[0] = posicao 1. */
    const hist = new Array(total).fill(0);
    for (const p of ps) hist[p - 1]++;
    const pico = Math.max(...hist);

    return {
      id: e.dataset.id,
      texto: String(e.dados.texto ?? e.dados.titulo ?? '').replace(/\s+/g, ' '),
      tag, pesoTag, pesoCarta, total: pesoTag + pesoCarta,
      med: media(ps), mediana: percentil(ps, 0.5), moda: hist.indexOf(pico) + 1,
      dp: desvio(ps), pico, picoFrac: pico / ps.length,
      p10: percentil(ps, 0.10), p90: percentil(ps, 0.90), hist,
      primeiras5: ps.filter(p => p <= 5).length / ps.length,
      ultimas5: ps.filter(p => p > total - 5).length / ps.length
    };
  }).sort((a, b) => a.med - b.med);

  /* O peso da carta e a intensidade atribuida a ela. Se a tag mandar demais,
     esta correlacao despenca: cartas de intensidade parecida caem longe uma
     da outra so porque estao em categorias diferentes. */
  const concordancia = spearman(linhas.map(l => l.pesoCarta), linhas.map(l => l.med));

  /* A mesma medida DENTRO de cada faixa, onde a tag e constante e so o peso
     da carta ordena. Vale mais que a global quando os pesos foram calibrados
     por faixa em vez de numa regua unica - caso de Verdade ou Sacanagem. */
  const grupos = new Map();
  for (const l of linhas) {
    const k = l.tag ?? '';
    if (!grupos.has(k)) grupos.set(k, []);
    grupos.get(k).push(l);
  }
  let somaPeso = 0, somaR = 0;
  for (const ls of grupos.values()) {
    if (ls.length < 3) continue;
    somaR += spearman(ls.map(l => l.pesoCarta), ls.map(l => l.med)) * ls.length;
    somaPeso += ls.length;
  }
  const concordanciaInterna = somaPeso ? somaR / somaPeso : null;

  /* Pior par: pesos de carta quase iguais, posicoes medias bem distantes. */
  let pior = null;
  for (let i = 0; i < linhas.length; i++) {
    for (let j = i + 1; j < linhas.length; j++) {
      const a = linhas[i], b = linhas[j];
      if (a.tag === b.tag || Math.abs(a.pesoCarta - b.pesoCarta) > 0.03) continue;
      const dist = Math.abs(a.med - b.med);
      if (!pior || dist > pior.dist) pior = { a, b, dist };
    }
  }

  const dpBase = media(elementos.map(e => desvio(basePos.get(e))));
  return {
    total, cfg, porTag, linhas, concordancia, concordanciaInterna, pior,
    forca: Number(cfg.forcaDoPeso),
    vizinhos: vizinhosTotal ? vizinhosMesmaTag / vizinhosTotal : 0,
    vizinhosBase: baseVizinhosTotal ? baseVizinhos / baseVizinhosTotal : 0,
    amplitude: media(linhas.map(l => l.p90 - l.p10)),
    imprevisibilidade: dpBase ? media(linhas.map(l => l.dp)) / dpBase : 1
  };
}

/* -------------------------------------------------------------- relatorio */

function faixas(res) {
  const grupos = new Map();
  for (const l of res.linhas) {
    const k = l.tag ?? '(sem tag com peso)';
    if (!grupos.has(k)) grupos.set(k, []);
    grupos.get(k).push(l);
  }
  const lista = [...grupos.entries()].map(([tag, ls]) => ({
    tag, peso: ls[0].pesoTag, n: ls.length,
    med: media(ls.map(l => l.med)),
    p10: Math.min(...ls.map(l => l.p10)),
    p90: Math.max(...ls.map(l => l.p90)),
    hist: ls.reduce((acc, l) => acc.map((v, i) => v + l.hist[i]), new Array(res.total).fill(0))
  })).sort((a, b) => a.med - b.med);

  /* Sobreposicao entre faixas vizinhas: quanto o p10-p90 de uma invade o da
     seguinte, em fracao da largura da menor das duas. */
  const sobrep = [];
  for (let i = 1; i < lista.length; i++) {
    const a = lista[i - 1], b = lista[i];
    const inter = Math.max(0, Math.min(a.p90, b.p90) - Math.max(a.p10, b.p10));
    sobrep.push(inter / (Math.min(a.p90 - a.p10, b.p90 - b.p10) || 1));
  }
  return { lista, sobreposicao: sobrep.length ? media(sobrep) : null };
}

function veredito(res, sobreposicao) {
  const out = [];
  if (sobreposicao != null) {
    if (sobreposicao < 0.05) out.push([C.vermelho, 'As faixas de tag nao se tocam: o baralho sai ORDENADO por tag, nao embaralhado.']);
    else if (sobreposicao < 0.35) out.push([C.amarelo, 'Faixas quase separadas: da para prever o bloco de cada carta. Tendencia forte, pouca mistura.']);
    else if (sobreposicao < 1.2) out.push([C.verde, 'Faixas se sobrepoem: mistura real, com tendencia visivel. E o alvo.']);
    else out.push([C.dim, 'Faixas praticamente indistinguiveis: a tag quase nao empurra mais.']);
  }
  const excesso = res.vizinhos - res.vizinhosBase;
  if (excesso > 0.35) out.push([C.vermelho, `Cartas da mesma tag saem coladas: ${pct(res.vizinhos)} dos vizinhos compartilham tag (sorteio puro daria ${pct(res.vizinhosBase)}).`]);
  else if (excesso > 0.15) out.push([C.amarelo, `Agrupamento moderado por tag: ${pct(res.vizinhos)} de vizinhos iguais contra ${pct(res.vizinhosBase)} no sorteio puro.`]);

  /* Concordancia global baixa COM interna alta nao e defeito: significa que os
     pesos foram calibrados por faixa, cada faixa centrada no proprio zero. */
  const porFaixa = res.concordanciaInterna != null && res.concordanciaInterna > 0.9;
  if (res.concordancia < 0.7 && porFaixa) {
    out.push([C.dim, `Concordancia global ${res.concordancia.toFixed(2)}, interna ${res.concordanciaInterna.toFixed(2)}: os pesos foram calibrados por faixa, nao numa regua unica. Esperado.`]);
  } else if (res.concordancia < 0.45) {
    out.push([C.vermelho, `A categoria pesa mais que a intensidade (concordancia ${res.concordancia.toFixed(2)}): cartas parecidas caem longe uma da outra.`]);
  } else if (res.concordancia < 0.7) {
    out.push([C.amarelo, `A tag ainda disputa com a intensidade da carta (concordancia ${res.concordancia.toFixed(2)}).`]);
  }
  if (res.concordanciaInterna != null && res.concordanciaInterna < 0.75) {
    out.push([C.amarelo, `Dentro da faixa a ordem sai bagunçada (${res.concordanciaInterna.toFixed(2)}): os pesos dessa faixa estao apertados demais para separa-la.`]);
  }
  if (res.imprevisibilidade < 0.45) out.push([C.vermelho, `A pilha repete muito entre partidas (imprevisibilidade ${res.imprevisibilidade.toFixed(2)} de 1,00).`]);
  else if (res.imprevisibilidade < 0.7) out.push([C.amarelo, `Pilha razoavelmente estavel entre partidas (imprevisibilidade ${res.imprevisibilidade.toFixed(2)} de 1,00).`]);

  if (!out.length) out.push([C.verde, 'Nada fora do lugar.']);
  return out;
}

/* Larguras da tabela principal, num lugar so. */
const L = { id: 6, carta: 26, peso: 8, tag: 7, tot: 7, med: 8, mdn: 9, moda: 10, faixa: 9 };
const RECUO = 2 + L.id + L.carta + L.peso + L.tag + L.tot + L.med + L.mdn + L.moda + L.faixa + 2;

function imprimir(nome, arquivo, res) {
  const { lista, sobreposicao } = faixas(res);
  console.log('\n' + cor(C.ciano, '='.repeat(RECUO + res.total)));
  console.log(cor(C.neg, '  ' + nome) + cor(C.dim, '  ·  ' + arquivo));
  console.log(cor(C.dim, '  ' + [
    `${res.total} cartas`, `forcaDoPeso ${res.forca}`, `${N} embaralhamentos`,
    FILTRO ? `filtro "${FILTRO}"` : null,
    TAGS_OVERRIDE ? 'pesosPorTag sobrescrito por --tags' : null
  ].filter(Boolean).join(' · ')));
  console.log(cor(C.ciano, '='.repeat(RECUO + res.total)));

  const [numeros, barras] = regua(res.total, RECUO);

  /* ---- tabela principal: uma linha por carta ---- */
  console.log('\n' + cor(C.neg, 'CARTAS') +
    cor(C.dim, '  ·  ordenadas pela posicao media  ·  a barra e a distribuicao, uma coluna por posicao da pilha'));
  console.log(cor(C.dim, numeros));
  console.log(cor(C.dim,
    '  ' + 'id'.padEnd(L.id) + 'carta'.padEnd(L.carta) +
    'peso'.padStart(L.peso) + 'tag'.padStart(L.tag) + 'total'.padStart(L.tot) +
    'média'.padStart(L.med) + 'mediana'.padStart(L.mdn) + 'moda'.padStart(L.moda) +
    'p10-p90'.padStart(L.faixa) + '  ' + barras.slice(RECUO)));

  for (const l of res.linhas) {
    console.log(
      '  ' + l.id.padEnd(L.id) + corta(l.texto, L.carta - 1).padEnd(L.carta) +
      num(l.pesoCarta, 2, L.peso) + num(l.pesoTag, 2, L.tag) + num(l.total, 2, L.tot) +
      l.med.toFixed(1).padStart(L.med) +
      l.mediana.toFixed(0).padStart(L.mdn) +
      `${l.moda} · ${pct(l.picoFrac)}`.padStart(L.moda) +
      `${l.p10.toFixed(0)}-${l.p90.toFixed(0)}`.padStart(L.faixa) +
      '  ' + distribuicao(l.hist, l.pico));
  }
  console.log(cor(C.dim,
    '  cada barra e normalizada pelo proprio pico: mostra o formato, nao a altura.' +
    ' "moda · %" = posicao mais frequente e quanto ela vale.'));

  /* ---- o mesmo, somado por faixa de tag ---- */
  if (lista.length > 1) {
    console.log('\n' + cor(C.neg, 'FAIXAS POR TAG'));
    console.log(cor(C.dim, numeros));
    console.log(cor(C.dim,
      '  ' + 'tag'.padEnd(L.id + L.carta) + 'peso'.padStart(L.peso) +
      'cartas'.padStart(L.tag + L.tot) + 'média'.padStart(L.med + L.mdn + L.moda) +
      'p10-p90'.padStart(L.faixa) + '  ' + barras.slice(RECUO)));
    for (const f of lista) {
      const pico = Math.max(...f.hist);
      console.log(
        '  ' + corta(f.tag, L.id + L.carta - 1).padEnd(L.id + L.carta) +
        num(f.peso, 2, L.peso) + String(f.n).padStart(L.tag + L.tot) +
        f.med.toFixed(1).padStart(L.med + L.mdn + L.moda) +
        `${f.p10.toFixed(0)}-${f.p90.toFixed(0)}`.padStart(L.faixa) +
        '  ' + distribuicao(f.hist, pico));
    }
  }

  /* ---- metricas ---- */
  console.log('\n' + cor(C.neg, 'METRICAS'));
  const met = (rot, val, obs) =>
    console.log('  ' + rot.padEnd(38, '.') + ' ' + String(val).padStart(6) + cor(C.dim, '  ' + obs));
  if (sobreposicao != null) met('Sobreposicao entre faixas vizinhas', pct(sobreposicao), '0% = blocos isolados · 50%+ = mistura real');
  met('Vizinhos com a mesma tag', pct(res.vizinhos), `sorteio puro daria ${pct(res.vizinhosBase)}`);
  met('Amplitude tipica de uma carta', res.amplitude.toFixed(1), `posicoes, de ${res.total}`);
  met('Imprevisibilidade entre partidas', res.imprevisibilidade.toFixed(2), '1,00 = sorteio puro · 0 = sempre igual');
  met('Intensidade manda na posicao?', res.concordancia.toFixed(2), '1,00 = so o peso da carta decide · 0 = a tag decide');
  if (res.concordanciaInterna != null) {
    met('   ...dentro de cada faixa', res.concordanciaInterna.toFixed(2), 'aqui a tag e constante: tem que dar perto de 1,00');
  }
  if (res.pior) {
    const { a, b, dist } = res.pior;
    console.log(cor(C.dim, `      pior par: ${a.id} (${a.tag}, peso ${num(a.pesoCarta)}) cai em ${a.med.toFixed(1)}`));
    console.log(cor(C.dim, `                ${b.id} (${b.tag}, peso ${num(b.pesoCarta)}) cai em ${b.med.toFixed(1)}`));
    console.log(cor(C.dim, `                mesma intensidade, ${dist.toFixed(1)} posicoes de distancia`));
  }

  console.log('\n' + cor(C.neg, 'VEREDITO'));
  for (const [c, txt] of veredito(res, sobreposicao)) console.log('  ' + cor(c, '• ') + txt);
}

function gravarCSV(resultados, caminho) {
  const esc = v => `"${String(v).replace(/"/g, '""')}"`;
  const maior = Math.max(...resultados.map(r => r.res.total));
  const cab = ['baralho', 'id', 'carta', 'tag', 'peso_carta', 'peso_tag', 'peso_total',
    'media', 'mediana', 'moda', 'moda_pct', 'desvio', 'p10', 'p90',
    'pct_5_primeiras', 'pct_5_ultimas',
    ...Array.from({ length: maior }, (_, i) => `pos_${i + 1}`)];
  const linhas = [];
  for (const { nome, res } of resultados) {
    for (const l of res.linhas) {
      linhas.push([
        esc(nome), esc(l.id), esc(l.texto), esc(l.tag ?? ''),
        l.pesoCarta, l.pesoTag, l.total.toFixed(2),
        l.med.toFixed(2), l.mediana.toFixed(0), l.moda, (l.picoFrac * 100).toFixed(2),
        l.dp.toFixed(2), l.p10.toFixed(0), l.p90.toFixed(0),
        (l.primeiras5 * 100).toFixed(2), (l.ultimas5 * 100).toFixed(2),
        ...l.hist, ...new Array(maior - res.total).fill('')
      ].join(','));
    }
  }
  /* BOM na frente: sem ele o Excel no Windows abre os acentos errados. */
  writeFileSync(caminho, '﻿' + cab.join(',') + '\n' + linhas.join('\n') + '\n', 'utf8');
  console.log('\n' + cor(C.verde, 'CSV gravado em ') + caminho);
  console.log(cor(C.dim, `  ${linhas.length} linhas · pos_1..pos_${maior} sao contagens brutas; cada linha soma ${N}`));
}

/* -------------------------------------------------------------------- main */

const raiz = lerJSON('cartas.json');
const configGlobal = mesclar(CONFIG_PADRAO, raiz.config || {});
let decks = raiz.decks.filter(d => !d.oculto);
if (DECK_ALVO) {
  decks = raiz.decks.filter(d => d.id === DECK_ALVO);
  if (!decks.length) {
    console.error(`Baralho "${DECK_ALVO}" nao existe. Disponiveis: ${raiz.decks.map(d => d.id).join(', ')}`);
    process.exit(1);
  }
}

const resultados = [];
for (const info of decks) {
  const deck = lerJSON(info.arquivo);
  try {
    const res = rodar(deck, mesclar(configGlobal, deck.config || {}));
    imprimir(info.nome || info.id, info.arquivo, res);
    resultados.push({ nome: info.nome || info.id, res });
  } catch (erro) {
    console.error(`\n[${info.id}] ${erro.message}`);
  }
}

if (CSV && resultados.length) gravarCSV(resultados, CSV);

console.log('\n' + cor(C.dim,
  'Opcoes:  --deck=<id>   --n=<int>   --filtro=<tag>   --tags="nome:valor,..."   --csv=<arquivo>'));
console.log('');
