/* ==========================================================================
   Erro de carregamento: mostra o que fazer e deixa escolher um JSON a mao.
   ========================================================================== */

import { el } from './elementos.js';
import { iniciar } from './decks.js';

export function mostrarAviso(erro) {
  el.aviso.hidden = false;
  el.aviso.textContent = '';

  const titulo = document.createElement('h2');
  titulo.textContent = 'Não consegui ler o cartas.json';
  el.aviso.appendChild(titulo);

  const p1 = document.createElement('p');
  p1.innerHTML = 'O navegador bloqueia a leitura de arquivos quando a página é aberta ' +
    'com duplo clique (<code>file://</code>). Abra um terminal nesta pasta e rode:';
  el.aviso.appendChild(p1);

  const cmd = document.createElement('p');
  cmd.innerHTML = '<code>python -m http.server 8000</code>';
  el.aviso.appendChild(cmd);

  const p2 = document.createElement('p');
  p2.innerHTML = 'Depois acesse <code>http://localhost:8000</code>. ' +
    'Ou, se preferir, escolha o arquivo aqui mesmo:';
  el.aviso.appendChild(p2);

  const entrada = document.createElement('input');
  entrada.type = 'file';
  entrada.accept = '.json,application/json';
  entrada.addEventListener('change', () => {
    const arquivo = entrada.files && entrada.files[0];
    if (!arquivo) return;
    const leitor = new FileReader();
    leitor.onload = () => {
      try { iniciar(JSON.parse(leitor.result)); }
      catch (e) { alert('JSON inválido: ' + e.message); }
    };
    leitor.readAsText(arquivo, 'utf-8');
  });
  el.aviso.appendChild(entrada);

  const detalhe = document.createElement('p');
  detalhe.style.opacity = '0.6';
  detalhe.style.marginBottom = '0';
  detalhe.textContent = 'Detalhe técnico: ' + erro.message;
  el.aviso.appendChild(detalhe);
}
