// Telas: uma visível por vez. Telas ocultas ficam inertes (teclado e leitor de tela não as alcançam).
const telas = [...document.querySelectorAll('[data-tela]')];

function telaValida(id) {
  return telas.some(t => t.id === id) ? id : 'mesa';
}

function mostrarTela(id, registrarHistorico = true) {
  const destino = telaValida(id);
  telas.forEach(t => {
    const ativa = t.id === destino;
    t.classList.toggle('ativa', ativa);
    t.inert = !ativa;
    t.setAttribute('aria-hidden', String(!ativa));
  });
  if (registrarHistorico && location.hash !== '#' + destino) {
    history.pushState(null, '', '#' + destino);
  }
}

document.addEventListener('click', e => {
  const ir = e.target.closest('[data-ir]');
  if (ir) mostrarTela(ir.dataset.ir);
});

// Botão voltar do navegador e links com #
window.addEventListener('popstate', () => mostrarTela(location.hash.slice(1), false));

// Lista de projetos (placeholders até os textos e imagens existirem)
const projetos = [
  'Super Mulheres ONG', 'Revista TLGD',
  'Identidade DSG LAB', '13° Mostra Estudantil', 'Reglette',
  'Embalagem KitKat Sublime', 'Mimoz', 'Radar'
];

const grid = document.querySelector('.cartas-grid');
projetos.forEach(nome => {
  const carta = document.createElement('article');
  carta.className = 'carta';
  carta.innerHTML = `<h3>${nome}</h3><p>[Resumo: placeholder]</p><p class="selos">[selos]</p>`;
  grid.appendChild(carta);
});

// Polaroids: 17 fotos, 4 por folha
// Postais: 24 cartões, sempre exibidos na vertical (horizontais giram dentro da moldura)
const polaroids = Array.from({ length: 17 }, (_, i) => `img/polaroid-${String(i + 1).padStart(2, '0')}.webp`);
const postais = Array.from({ length: 24 }, (_, i) => ({
  src: `img/postal-${String(i + 1).padStart(2, '0')}.webp`,
  orientacao: [3, 8, 19, 21].includes(i + 1) ? 'horizontal' : 'vertical' // fotos 3, 8, 19 e 21 são horizontais
}));

const POR_PAGINA = 4;   // fotos por folha
const POR_ESPELHO = 8; // duas folhas abertas lado a lado
const album = document.querySelector('[data-album]');
for (let i = 0; i < polaroids.length; i += POR_ESPELHO) {
  const espelho = document.createElement('div');
  espelho.className = 'espelho';
  for (let j = i; j < Math.min(i + POR_ESPELHO, polaroids.length); j += POR_PAGINA) {
    const pagina = document.createElement('div');
    pagina.className = 'pagina';
    polaroids.slice(j, j + POR_PAGINA).forEach((src, k) => {
      const div = document.createElement('div');
      div.className = 'polaroid';
      div.style.setProperty('--giro', ((j + k) % 3 - 1) * 1.5 + 'deg'); // leve inclinação, como em álbum real
      div.innerHTML = `<img src="${src}" alt="" loading="lazy">`;
      pagina.appendChild(div);
    });
    espelho.appendChild(pagina);
  }
  album.appendChild(espelho);
}

const binder = document.querySelector('[data-binder]');
for (let i = 0; i < postais.length; i += 2) {
  const espelho = document.createElement('div');
  espelho.className = 'espelho-postal';
  postais.slice(i, i + 2).forEach(p => {
    const div = document.createElement('div');
    div.className = `postal ${p.orientacao}`;
    div.dataset.src = p.src;
    div.innerHTML = `<div class="moldura"><img src="${p.src}" alt="" loading="lazy"></div>`;
    espelho.appendChild(div);
  });
  binder.appendChild(espelho);
}

// Livro com páginas que viram: setas, teclado e contador
function montarLivro(container, nomeTela) {
  const folhas = [...container.children];
  let atual = 0;
  const controles = document.createElement('nav');
  controles.className = 'controles';
  controles.innerHTML = `
    <button type="button" data-ant aria-label="Virar para a página anterior">‹</button>
    <span data-contador aria-live="polite"></span>
    <button type="button" data-prox aria-label="Virar para a próxima página">›</button>`;
  container.after(controles);

  const ant = controles.querySelector('[data-ant]');
  const prox = controles.querySelector('[data-prox]');
  const contador = controles.querySelector('[data-contador]');

  function virar(i) {
    const novo = Math.max(0, Math.min(folhas.length - 1, i));
    if (novo === atual && folhas[atual].classList.contains('atual')) return;
    atual = novo;
    folhas.forEach((f, k) => f.classList.toggle('atual', k === atual));
    contador.textContent = `${atual + 1} / ${folhas.length}`;
    ant.disabled = atual === 0;
    prox.disabled = atual === folhas.length - 1;
  }

  ant.addEventListener('click', () => virar(atual - 1));
  prox.addEventListener('click', () => virar(atual + 1));
  document.addEventListener('keydown', e => {
    if (!container.closest('[data-tela]').classList.contains('ativa')) return;
    if (e.key === 'ArrowRight') virar(atual + 1);
    if (e.key === 'ArrowLeft') virar(atual - 1);
  });
  virar(0);
}

montarLivro(album, 'polaroids');
montarLivro(binder, 'postais');

// Visualização ampliada: a foto aparece no sentido em que foi feita (sem girar)
const ampliada = document.querySelector('[data-ampliada]');
const ampliadaImg = document.querySelector('[data-ampliada-img]');

function abrir(src) {
  ampliadaImg.src = src;
  ampliada.hidden = false;
}

album.addEventListener('click', e => {
  const p = e.target.closest('.polaroid');
  if (p) abrir(p.querySelector('img').src);
});

binder.addEventListener('click', e => {
  const p = e.target.closest('.postal');
  if (p) abrir(p.dataset.src);
});

function fechar() { ampliada.hidden = true; }
document.querySelector('[data-fechar]').addEventListener('click', fechar);
ampliada.addEventListener('click', e => { if (e.target === ampliada) fechar(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') fechar(); });

// Inicia na tela indicada pela URL (ex.: #cartas) ou na mesa
mostrarTela(location.hash.slice(1) || 'mesa', false);
