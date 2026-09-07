/* ==========================================================================
   Funcoes soltas usadas por varios modulos: mesclar configuracoes, desligar
   as animacoes durante uma remontagem e preparar texto para a tela.
   ========================================================================== */

export function mesclar(base, extra) {
  const saida = Object.assign({}, base);
  if (!extra || typeof extra !== 'object') return saida;
  for (const chave of Object.keys(extra)) {
    const valorBase = base[chave];
    const valorExtra = extra[chave];
    const ehObjeto = v => v && typeof v === 'object' && !Array.isArray(v);
    saida[chave] = ehObjeto(valorBase) && ehObjeto(valorExtra)
      ? mesclar(valorBase, valorExtra)
      : valorExtra;
  }
  return saida;
}

/* Remonta o baralho sem animacao: a troca de faces tem meio flip de atraso e
   deixaria a face errada aparecendo enquanto as cartas sao reposicionadas. */
export function semAnimacao(montar) {
  document.body.classList.add('montando');
  try {
    montar();
    /* Ler o layout aqui obriga o navegador a calcular o estado novo ainda com as
       transicoes desligadas. Depois disso pode religar na mesma hora: a mudanca
       ja aconteceu, entao nada anima retroativamente. Nada de
       requestAnimationFrame aqui - ele nao dispara com a aba em segundo plano
       e a classe ficaria presa, matando todas as animacoes. */
    void document.body.offsetHeight;
  } finally {
    document.body.classList.remove('montando');
  }
}

export function escapar(texto) {
  return String(texto).replace(/[&<>"]/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]
  ));
}

/* Aceita string ou lista de paragrafos. Formatacao leve:
   **negrito**  *italico*  `codigo`  [link](https://...)  quebra de linha. */
export function formatarTexto(valor, permitirHtml) {
  const bruto = Array.isArray(valor) ? valor.join('\n\n') : String(valor == null ? '' : valor);
  if (permitirHtml) return bruto;

  let t = escapar(bruto);
  t = t.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  t = t.replace(/\*([^*\n]+)\*/g, '<em>$1</em>');
  t = t.replace(/`([^`]+)`/g, '<code>$1</code>');

  return t.split(/\n{2,}/)
    .map(p => '<p>' + p.replace(/\n/g, '<br>') + '</p>')
    .join('');
}

export function comprimento(valor) {
  return typeof valor === 'number' ? valor + 'px' : String(valor);
}
