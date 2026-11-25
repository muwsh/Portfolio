// Versão mobile: navegação por endereço (#), toque no lugar de arrastar e grades simples.
// Os caminhos das imagens são relativos a mobile/ e apontam para ../img (pasta compartilhada com o desktop).

const IMG = '../img/telas/elementos';

// ===== Projetos =====
const PROJETOS_NOMES = [
  'Revista tlgd', 'Super Mulheres ONG',
  'KitKat Sublime', 'Reglette Typeface', 'Premiações ESPM',
  'Identidade DSG LAB', 'Radar SP', 'Mimoz'
];
// Mesma ordem da lista de projetos (arte de cada carta)
const ARTE_CARTAS = ['1tlgd_carta', '2sm_carta', '3kitkat_carta', '4reglette_carta', '5premio_carta', '6dsglab_carta', '7radar_carta', '8mimoz_carta'];
const CORES = ['#3142ff', '#e0692b', '#8dc640', '#1f1f1f', '#d9bf8c', '#5a2b2b', '#2e8b57', '#c2185b'];

function slugify(t) {
  return t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
const PROJETOS = PROJETOS_NOMES.map((nome, i) => ({ nome, slug: slugify(nome), arte: ARTE_CARTAS[i], cor: CORES[i % CORES.length] }));

// Dados de cada projeto (projetos sem dados mostram placeholder)
const FICHAS = {
  'reglette-typeface': {
    cliente: 'Escola Superior de Propaganda e Marketing',
    integrantes: 'Tomás Takabayashi e Antônio Stein',
    ano: '2025-2',
    texto: [
      'Inspirada no esporte de escalada, a Reglette tem sua forma baseada em vias reais de <em>bouldering</em>, rejeitando formas suaves.',
      'Tive como objetivo criar uma fonte escalável, que trouxesse os ângulos e superfícies de pedras para cada letra.'
    ]
  }
};

// Polaroids (25) e postais (24). Os postais 12, 18, 19 e 20 são fotos horizontais: giram ao ampliar.
const POLAROIDS = Array.from({ length: 25 }, (_, i) => `${IMG}/polaroids/polaroid-${String(i + 1).padStart(2, '0')}.webp`);
const POSTAIS = Array.from({ length: 24 }, (_, i) => ({
  src: `${IMG}/postais/postal-${String(i + 1).padStart(2, '0')}.webp`,
  girar: [12, 18, 19, 20].includes(i + 1)
}));

// ===== Montagem das listas =====
const listaProjetos = document.querySelector('[data-lista-projetos]');
PROJETOS.forEach(p => {
  const a = document.createElement('a');
  a.className = 'carta-lista';
  a.href = `#projeto/${p.slug}`;
  a.setAttribute('aria-label', p.nome);
  a.innerHTML = `<img src="${IMG}/cartas_menu/${p.arte}.webp" alt="">` + `<span class="nome">${p.nome}</span>`;
  listaProjetos.appendChild(a);
});
listaProjetos.classList.add('lista-cartas');

const grade = document.querySelector('[data-grade-polaroids]');
POLAROIDS.forEach(src => {
  const b = document.createElement('button');
  b.type = 'button';
  b.innerHTML = `<img src="${src}" alt="" loading="lazy">`;
  b.addEventListener('click', () => abrirAmpliada(src, false));
  grade.appendChild(b);
});

const coluna = document.querySelector('[data-coluna-postais]');
POSTAIS.forEach(p => {
  const b = document.createElement('button');
  b.type = 'button';
  b.innerHTML = `<img src="${p.src}" alt="" loading="lazy">`;
  b.addEventListener('click', () => abrirAmpliada(p.src, p.girar));
  coluna.appendChild(b);
});

// ===== Ampliada =====
const ampliada = document.querySelector('[data-ampliada]');
const ampliadaImg = document.querySelector('[data-ampliada-img]');
function abrirAmpliada(src, girada) {
  ampliadaImg.src = src;
  ampliadaImg.classList.toggle('girada', girada);
  ampliada.hidden = false;
}
function fecharAmpliada() { ampliada.hidden = true; }
ampliada.addEventListener('click', fecharAmpliada);
document.querySelector('[data-fechar]').addEventListener('click', e => { e.stopPropagation(); fecharAmpliada(); });

// ===== Projeto =====
function preencherProjeto(slug) {
  const p = PROJETOS.find(x => x.slug === slug);
  if (!p) return false;
  const ficha = FICHAS[p.slug];
  document.querySelector('[data-projeto-titulo]').textContent = p.nome;
  document.querySelector('[data-projeto-cliente]').textContent = ficha ? ficha.cliente : '[Cliente: placeholder]';
  document.querySelector('[data-projeto-integrantes]').textContent = ficha ? ficha.integrantes : '[Integrantes: placeholder]';
  document.querySelector('[data-projeto-ano]').textContent = ficha ? ficha.ano : 'xx/xx/xxxx';
  document.querySelector('[data-projeto-texto]').innerHTML = ficha
    ? ficha.texto.map(t => `<p>${t}</p>`).join('')
    : '<p>[Texto sobre o projeto: placeholder]</p>';
  const capa = document.querySelector('[data-projeto-capa]');
  capa.style.setProperty('--capa', p.cor);
  document.getElementById('projeto').scrollTop = 0;
  return true;
}

// ===== Navegação por endereço =====
// Telas que cobrem a tela (fora da página inicial)
const TELAS = ['sobre', 'projetos', 'projeto', 'identidade', 'polaroids', 'postais'];
const SECOES_INICIO = ['lousa', 'destaques', 'mesa'];

function mostrar() {
  const hash = decodeURIComponent(location.hash.slice(1));
  const [chave, arg] = hash.split('/');
  const inicio = document.getElementById('inicio');

  // Projeto: precisa de um slug válido, senão volta à lista
  if (chave === 'projeto') {
    if (preencherProjeto(arg)) return ativar('projeto');
    return ativar('projetos', true);
  }
  if (TELAS.includes(chave)) return ativar(chave);

  // Página inicial (com ou sem âncora de seção)
  ativar(null);
  const alvo = SECOES_INICIO.includes(chave) ? document.getElementById(chave) : null;
  window.scrollTo({ top: alvo ? alvo.offsetTop : 0, behavior: 'auto' });
  inicio.classList.add('ativa');
}

function ativar(id, substituir = false) {
  document.querySelectorAll('[data-tela]').forEach(t => {
    const ativa = t.id === id;
    t.classList.toggle('ativa', ativa);
    t.setAttribute('aria-hidden', String(!ativa));
    t.inert = !ativa;
  });
  if (id) document.getElementById(id).scrollTop = 0;
  if (id === null) document.getElementById('inicio').classList.remove('ativa');
  if (substituir && location.hash !== `#${id}`) location.replace(`#${id}`);
  // Telas cheias: a página inicial fica por baixo, sem rolagem
  document.body.style.overflow = id ? 'hidden' : '';
}

// Botão voltar (X) e o botão de voltar do navegador
document.querySelectorAll('[data-voltar]').forEach(b => {
  b.addEventListener('click', () => {
    // Projeto volta para a lista de projetos; as outras telas voltam ao início
    location.hash = location.hash.startsWith('#projeto/') ? '#projetos' : '';
  });
});
window.addEventListener('hashchange', mostrar);
window.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  if (!ampliada.hidden) return fecharAmpliada();
  const voltar = document.querySelector('[data-tela].ativa [data-voltar]');
  if (voltar) voltar.click();
});

// Formulário de contato: abre o email com a mensagem pronta (sem servidor)
const EMAIL_CONTATO = 'contato.tktaka@gmail.com';
document.getElementById('formulario-contato').addEventListener('submit', e => {
  e.preventDefault();
  const dados = new FormData(e.target);
  const assunto = 'Contato pelo portfólio: ' + (dados.get('assunto') || '');
  const corpo = 'Nome: ' + (dados.get('nome') || '') + '\n\n' + (dados.get('mensagem') || '');
  window.location.href = 'mailto:' + EMAIL_CONTATO +
    '?subject=' + encodeURIComponent(assunto) + '&body=' + encodeURIComponent(corpo);
});

mostrar();
