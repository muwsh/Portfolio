let zPeca = 10;
// Seções que vivem dentro de #inicio (sequência de scroll)
const SECOES_INICIO = { lousa: 'lousa', destaques: 'destaques', mesa: 'mesa', inicio: 'lousa' };
const inicio = document.getElementById('inicio');
const telas = [...document.querySelectorAll('[data-tela]')];

function telaValida(id) {
  return telas.some(t => t.id === id) ? id : 'inicio';
}

// Sair da lousa e voltar faz as peças retornarem à posição original
function resetarPecas() {
  document.querySelectorAll('[data-peca]').forEach(el => {
    clearTimeout(el._timerQueda);
    el.hidden = false;
    el.classList.remove('caindo');
    el.style.transition = '';
    el.style.translate = '';
    el.style.zIndex = '';
    el.dataset.arrastou = '';
    el._ox = 0; el._oy = 0;
  });
}

// Objetos soltos fora da cortiça caem da lousa e saem da tela
const cortica = document.querySelector('.cortica-peca');
function estaFora(el) {
  const r = el.getBoundingClientRect();
  const c = cortica.getBoundingClientRect();
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  return cx < c.left || cx > c.right || cy < c.top || cy > c.bottom;
}
function cair(el) {
  el.classList.add('caindo');
  el.style.transition = 'translate 1.1s ease-in';
  el.style.translate = `${el._ox}px ${el._oy + window.innerHeight + 200}px`;
  el._timerQueda = setTimeout(() => {
    el.hidden = true;
    el.classList.remove('caindo');
  }, 1100);
}
// Pega um objeto no meio da queda: ele para onde está e volta a ser arrastável
function congelar(el) {
  clearTimeout(el._timerQueda);
  const [x, y] = getComputedStyle(el).translate.split(' ').map(parseFloat);
  el.style.transition = '';
  el.style.translate = `${x}px ${y}px`;
  el._ox = x; el._oy = y;
  el.classList.remove('caindo');
}

// Seção da sequência inicial (lousa, destaques ou mesa) que está visível agora
function secaoAtual() {
  const ids = ['lousa', 'destaques', 'mesa'];
  return ids.reduce((melhor, id) =>
    Math.abs(document.getElementById(id).offsetTop - inicio.scrollTop) <
    Math.abs(document.getElementById(melhor).offsetTop - inicio.scrollTop) ? id : melhor, 'lousa');
}

function mostrarTela(id, registrarHistorico = true) {
  const projeto = id.startsWith('projeto/') ? PROJETOS.find(p => p.slug === id.slice(8)) : null;
  const secao = projeto ? undefined : SECOES_INICIO[id];
  const destino = projeto ? 'projeto' : (secao ? 'inicio' : telaValida(id));
  if (projeto) document.querySelector('[data-projeto-titulo]').textContent = projeto.nome;
  const anterior = document.querySelector('[data-tela].ativa');
  if (anterior && anterior.id === 'inicio' && destino !== 'inicio') {
    resetarPecas();
    // Guarda em qual seção da sequência a pessoa estava, para o botão voltar retornar a ela
    if (registrarHistorico) history.replaceState(history.state, '', '#' + secaoAtual());
  }

  telas.forEach(t => {
    const ativa = t.id === destino;
    t.classList.toggle('ativa', ativa);
    t.inert = !ativa;
    t.setAttribute('aria-hidden', String(!ativa));
  });

  if (destino === 'inicio') {
    const alvo = document.getElementById(secao || 'lousa');
    inicio.scrollTop = alvo.offsetTop;
  }

  const hash = projeto ? id : (secao ? (secao === 'inicio' ? 'lousa' : id) : destino);
  if (registrarHistorico && location.hash !== '#' + hash) {
    history.pushState({ interno: true }, '', '#' + hash);
  }
}

document.addEventListener('click', e => {
  const ir = e.target.closest('[data-ir]');
  if (ir) { fecharGaveta(); mostrarTela(ir.dataset.ir); return; }
  const pj = e.target.closest('[data-projeto]');
  if (pj) { fecharGaveta(); mostrarTela('projeto/' + pj.dataset.projeto); return; }
  if (e.target.closest('[data-voltar]')) {
    // Volta para a seção de onde a pessoa veio (mesa, destaques, projeto...); sem origem interna (link direto), vai à lousa
    if (history.state && history.state.interno) history.back(); else mostrarTela('lousa');
  }
});

// Ao rolar a sequência inicial, a URL acompanha a seção visível
let timerScroll, ultimaSecao = 'lousa';
inicio.addEventListener('scroll', () => {
  clearTimeout(timerScroll);
  timerScroll = setTimeout(() => {
    const atual = secaoAtual();
    // Voltar à lousa pela rolagem devolve as peças à posição original
    if (atual === 'lousa' && ultimaSecao !== 'lousa') resetarPecas();
    ultimaSecao = atual;
    if (inicio.classList.contains('ativa') && location.hash !== '#' + atual) {
      history.replaceState(history.state, '', '#' + atual);
    }
  }, 150);
});

// Botão voltar do navegador
window.addEventListener('popstate', () => mostrarTela(location.hash.slice(1) || 'lousa', false));

// Lista de projetos (placeholders até os textos e imagens existirem)
const projetos = [
  'Super Mulheres ONG', 'Revista TLGD',
  'Identidade DSG LAB', '13° Mostra Estudantil', 'Reglette',
  'Embalagem KitKat Sublime', 'Mimoz', 'Radar'
];

// Cada projeto tem endereço próprio: #projeto/<slug>
function slugify(t) {
  return t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
const PROJETOS = projetos.map(nome => ({ nome, slug: slugify(nome) }));

const grid = document.querySelector('.cartas-grid');
PROJETOS.forEach(({ nome, slug }) => {
  const carta = document.createElement('article');
  carta.className = 'carta';
  carta.innerHTML = `<h3><button type="button" class="link-projeto" data-projeto="${slug}">${nome}</button></h3><p>[Resumo: placeholder]</p><p class="selos">[selos]</p>`;
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


// Peças da lousa: arrastar move; ao soltar fora da cortiça, a peça cai e sai da tela
document.querySelectorAll('[data-peca]').forEach(el => {
  let ptr = null, x0 = 0, y0 = 0, dx = 0, dy = 0, arrastou = false;
  el._ox = 0; el._oy = 0;

  // Movimento e soltura são ouvidos no documento: o arrasto não se perde se o ponteiro for rápido
  const mover = e => {
    if (ptr !== e.pointerId) return;
    dx = e.clientX - x0; dy = e.clientY - y0;
    if (!arrastou && Math.hypot(dx, dy) > 6) {
      arrastou = true;
      el.classList.add('arrastando');
      el.style.zIndex = ++zPeca;
    }
    if (arrastou) el.style.translate = `${el._ox + dx}px ${el._oy + dy}px`;
  };
  const soltar = e => {
    if (ptr !== e.pointerId) return;
    document.removeEventListener('pointermove', mover);
    document.removeEventListener('pointerup', soltar);
    document.removeEventListener('pointercancel', soltar);
    if (arrastou) { el._ox += dx; el._oy += dy; el.dataset.arrastou = '1'; }
    // Qualquer objeto solto fora da cortiça continua caindo (inclusive um que foi pego no ar)
    if (estaFora(el)) cair(el);
    el.classList.remove('arrastando');
    ptr = null;
  };

  el.addEventListener('pointerdown', e => {
    if (el.classList.contains('caindo')) congelar(el);
    ptr = e.pointerId; x0 = e.clientX; y0 = e.clientY; dx = dy = 0; arrastou = false;
    document.addEventListener('pointermove', mover);
    document.addEventListener('pointerup', soltar);
    document.addEventListener('pointercancel', soltar);
  });
  el.addEventListener('dragstart', e => e.preventDefault()); // impede arrastar a imagem do QR

  // Um arrastar não deve disparar o link do QR code
  el.addEventListener('click', e => {
    if (el.dataset.arrastou === '1') {
      el.dataset.arrastou = '';
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  }, true);
});

// Inicia na tela indicada pela URL ou na lousa
mostrarTela(location.hash.slice(1) || 'lousa', false);

// Aba lateral com os objetos da mesa
const gaveta = document.getElementById('gaveta');
const botaoMenu = document.querySelector('[data-abrir-gaveta]');
function abrirGaveta() {
  gaveta.classList.add('aberta');
  botaoMenu.setAttribute('aria-expanded', 'true');
  gaveta.querySelector('li button').focus();
}
function fecharGaveta() {
  gaveta.classList.remove('aberta');
  botaoMenu.setAttribute('aria-expanded', 'false');
}
botaoMenu.addEventListener('click', abrirGaveta);
document.querySelector('[data-fechar-gaveta]').addEventListener('click', fecharGaveta);
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') fecharGaveta();
});
