// Navegação entre telas
function mostrarTela(id) {
  document.querySelectorAll('[data-tela]').forEach(t => t.classList.toggle('ativa', t.id === id));
}

document.addEventListener('click', e => {
  const ir = e.target.closest('[data-ir]');
  if (ir) mostrarTela(ir.dataset.ir);
});

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

// Polaroids: 16 fotos (placeholders), 4 por página
// Postais: 12 cartões, orientação guardada para girar a miniatura
const polaroids = Array.from({ length: 16 }, (_, i) => `img/polaroid-${String(i + 1).padStart(2, '0')}.webp`);
const postais = Array.from({ length: 12 }, (_, i) => ({
  src: `img/postal-${String(i + 1).padStart(2, '0')}.webp`,
  orientacao: i % 3 === 0 ? 'horizontal' : 'vertical' // placeholder; ajuste na ficha
}));

const album = document.querySelector('[data-album]');
polaroids.forEach(src => {
  const div = document.createElement('div');
  div.className = 'polaroid';
  div.innerHTML = `<img src="${src}" alt="" loading="lazy">`;
  album.appendChild(div);
});

const binder = document.querySelector('[data-binder]');
postais.forEach(p => {
  const div = document.createElement('div');
  div.className = `postal ${p.orientacao}`;
  div.dataset.src = p.src;
  div.dataset.orientacao = p.orientacao;
  div.innerHTML = `<img src="${p.src}" alt="" loading="lazy">`;
  binder.appendChild(div);
});

// Visualização ampliada: a foto horizontal volta ao sentido correto
const ampliada = document.querySelector('[data-ampliada]');
const ampliadaImg = document.querySelector('[data-ampliada-img]');

function abrir(src, horizontal = false) {
  ampliadaImg.src = src;
  ampliadaImg.style.transform = horizontal ? 'rotate(-90deg)' : '';
  ampliada.hidden = false;
}

document.querySelector('[data-album]').addEventListener('click', e => {
  const p = e.target.closest('.polaroid');
  if (p) abrir(p.querySelector('img').src);
});

document.querySelector('[data-binder]').addEventListener('click', e => {
  const p = e.target.closest('.postal');
  if (p) abrir(p.dataset.src, p.dataset.orientacao === 'horizontal');
});

document.querySelector('[data-fechar]').addEventListener('click', () => { ampliada.hidden = true; });
ampliada.addEventListener('click', e => { if (e.target === ampliada) ampliada.hidden = true; });
document.addEventListener('keydown', e => { if (e.key === 'Escape') ampliada.hidden = true; });
