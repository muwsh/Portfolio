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

// Polaroids: 16 fotos, 4 por página
// Postais: 12 cartões. Orientação: 'horizontal' ou 'vertical' (ajustar quando as fotos chegarem)
const polaroids = Array.from({ length: 16 }, (_, i) => `img/polaroid-${String(i + 1).padStart(2, '0')}.webp`);
const postais = Array.from({ length: 12 }, (_, i) => ({
  src: `img/postal-${String(i + 1).padStart(2, '0')}.webp`,
  orientacao: i % 3 === 0 ? 'horizontal' : 'vertical' // placeholder
}));

const POR_PAGINA = 4;
const album = document.querySelector('[data-album]');
for (let i = 0; i < polaroids.length; i += POR_PAGINA) {
  const pagina = document.createElement('div');
  pagina.className = 'pagina';
  polaroids.slice(i, i + POR_PAGINA).forEach(src => {
    const div = document.createElement('div');
    div.className = 'polaroid';
    div.innerHTML = `<img src="${src}" alt="" loading="lazy">`;
    pagina.appendChild(div);
  });
  album.appendChild(pagina);
}

const binder = document.querySelector('[data-binder]');
postais.forEach(p => {
  const div = document.createElement('div');
  div.className = `postal ${p.orientacao}`;
  div.dataset.src = p.src;
  div.innerHTML = `<div class="moldura"><img src="${p.src}" alt="" loading="lazy"></div>`;
  binder.appendChild(div);
});

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
