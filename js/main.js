let zPeca = 10;
// Seções que vivem dentro de #inicio (sequência de scroll)
const SECOES_INICIO = { lousa: 'lousa', destaques: 'destaques', mesa: 'mesa', inicio: 'lousa' };
const inicio = document.getElementById('inicio');
const telas = [...document.querySelectorAll('[data-tela]')];
// Telas abertas a partir dos objetos da mesa (fundo da mesa, entrada pela direita)
const OBJETOS = ['sobre', 'cartas', 'carimbo', 'polaroids', 'postais'];
let timerFundo = null;

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
    el.classList.remove('descolado');
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
  el.style.transition = 'translate 0.9s ease-in';
  el.style.translate = `${el._ox}px ${el._oy + window.innerHeight + 200}px`;
  el._timerQueda = setTimeout(() => {
    el.hidden = true;
    el.classList.remove('caindo');
  }, 900);
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

// Dados de cada projeto para a carta (projetos sem dados mostram placeholder)
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

function mostrarTela(id, registrarHistorico = true) {
  const projeto = id.startsWith('projeto/') ? PROJETOS.find(p => p.slug === id.slice(8)) : null;
  const secao = projeto ? undefined : SECOES_INICIO[id];
  const destino = projeto ? 'projeto' : (secao ? 'inicio' : telaValida(id));
  if (projeto) {
    document.querySelector('[data-projeto-titulo]').textContent = projeto.nome;
    const ficha = FICHAS[projeto.slug];
    document.querySelector('[data-projeto-cliente]').textContent = ficha ? ficha.cliente : '[Cliente: placeholder]';
    document.querySelector('[data-projeto-integrantes]').textContent = ficha ? ficha.integrantes : '[Integrantes: placeholder]';
    document.querySelector('[data-projeto-ano]').textContent = ficha ? ficha.ano : 'xx/xx/xxxx';
    document.querySelector('[data-projeto-texto]').innerHTML = ficha
      ? ficha.texto.map(t => `<p>${t}</p>`).join('')
      : '<p>[Texto sobre o projeto: placeholder]</p>';
    document.querySelector('.capa-foto').style.setProperty('--capa', CORES[PROJETOS.indexOf(projeto) % CORES.length]);
    document.querySelector('.projeto-folhas').scrollTop = 0;
    atualizarBordasProjeto();
  }
  const anterior = document.querySelector('[data-tela].ativa');
  if (anterior && anterior.id === 'inicio' && destino !== 'inicio') {
    resetarPecas();
    // Guarda em qual seção da sequência a pessoa estava, para o botão voltar retornar a ela
    if (registrarHistorico) history.replaceState(history.state, '', '#' + secaoAtual());
  }

  // Abrir um projeto (carta) não passa pela animação de saída do objeto: a tela só faz um fade rápido
  // Abrir um projeto: a tela de onde ele vem fica parada por baixo e a carta só faz fade in (e fade out ao fechar)
  const sobProjeto = destino === 'projeto' && anterior && anterior.id !== 'projeto';
  telas.forEach(t => t.classList.remove('sob-projeto'));
  if (sobProjeto) anterior.classList.add('sob-projeto');
  const saindoPolaroids = anterior && anterior.id === 'polaroids' && destino !== 'polaroids' && !sobProjeto;
  const entrandoPolaroids = destino === 'polaroids' && !(anterior && anterior.id === 'polaroids');
  document.body.classList.toggle('menu-visivel', destino === 'inicio');
  // Ao entrar no menu de projetos, a pilha começa pela primeira carta (a de cima da lista)
  if (destino === 'cartas' && anterior && anterior.id !== 'cartas') ativarCarta(0);
  const esperaPolaroids = saindoPolaroids ? empilharPolaroids() : 0; // as fotos recolhem antes de a tela sair
  // O fundo só sai depois que as polaroids recolhem (ao sair delas para outra tela)
  const fundoVisivel = OBJETOS.includes(destino) || (destino === 'projeto' && anterior && anterior.classList.contains('de-objeto'));
  clearTimeout(timerFundo);
  if (saindoPolaroids && !fundoVisivel) {
    timerFundo = setTimeout(() => document.getElementById('fundo-objeto').classList.remove('visivel'), esperaPolaroids);
  } else {
    document.getElementById('fundo-objeto').classList.toggle('visivel', fundoVisivel);
  }
  inicio.classList.toggle('sob-objeto', OBJETOS.includes(destino));
  if (entrandoPolaroids) montarPilhaPolaroids();

  telas.forEach(t => {
    const ativa = t.id === destino;
    t.classList.toggle('ativa', ativa);
    t.inert = !ativa;
    t.setAttribute('aria-hidden', String(!ativa));
  });

  if (entrandoPolaroids) espalharPolaroids();
  document.getElementById('cartas').classList.toggle('sem-entrada', destino === 'cartas' && anterior && anterior.id === 'projeto');

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
  // Clicar fora da página (no fundo da tela) também volta, como o Esc e o botão Voltar
  const telaAtiva = document.querySelector('[data-tela].ativa');
  const fundo = telaAtiva && telaAtiva.id !== 'inicio' && (
    e.target === telaAtiva ||
    e.target.classList.contains('projeto-folhas') ||
    (e.target.classList.contains('tira-polaroids') && !arrastou)
  );
  if (fundo) {
    const voltar = telaAtiva.querySelector('[data-voltar]');
    if (voltar) voltar.click();
    return;
  }
  const ir = e.target.closest('[data-ir]');
  if (ir) { fecharGaveta(); mostrarTela(ir.dataset.ir); return; }
  const pj = e.target.closest('[data-projeto]');
  if (pj) {
    if (pj.classList.contains('carta-projeto') && !pj.classList.contains('ativa')) { ativarCarta(pj.dataset.indice); return; }
    fecharGaveta(); mostrarTela('projeto/' + pj.dataset.projeto); return;
  }
  if (e.target.closest('[data-voltar]')) {
    // Volta para a seção de onde a pessoa veio (mesa, destaques, projeto...); sem origem interna (link direto), vai à lousa
    if (history.state && history.state.interno) history.back(); else mostrarTela('lousa');
  }
});

// A rolagem entre lousa, destaques e mesa é a rolagem nativa do navegador (contínua, com a inércia do trackpad).

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

// Bordas da página de projeto: o escurecimento some do lado em que não há mais o que rolar
const folhasProjeto = document.querySelector('.projeto-folhas');
const telaProjeto = document.getElementById('projeto');
function atualizarBordasProjeto() {
  const fim = folhasProjeto.scrollHeight - folhasProjeto.clientHeight;
  telaProjeto.classList.toggle('sem-topo', folhasProjeto.scrollTop < 8);
  telaProjeto.classList.toggle('sem-fim', folhasProjeto.scrollTop > fim - 8);
}
folhasProjeto.addEventListener('scroll', atualizarBordasProjeto);

// Botão voltar do navegador
window.addEventListener('popstate', () => mostrarTela(location.hash.slice(1) || 'lousa', false));

// Lista de projetos (placeholders até os textos e imagens existirem)
const projetos = [
  'Super Mulheres ONG', 'Revista tlgd_',
  'Identidade DSG LAB', 'Premiações ESPM', 'Reglette Typeface',
  'KitKat Sublime', 'Mimoz', 'Radar'
];

// Cada projeto tem endereço próprio: #projeto/<slug>
function slugify(t) {
  return t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
const PROJETOS = projetos.map(nome => ({ nome, slug: slugify(nome) }));

const nomesEl = document.querySelector('.nomes ul');
const pilhaEl = document.querySelector('.pilha');
const CORES = ['#3142ff', '#e0692b', '#8dc640', '#1f1f1f', '#d9bf8c', '#5a2b2b', '#2e8b57', '#c2185b'];
PROJETOS.forEach((p, i) => {
  const li = document.createElement('li');
  li.innerHTML = `<button type="button" class="nome-projeto" data-projeto="${p.slug}" data-indice="${i}">${p.nome}</button>`;
  nomesEl.appendChild(li);

  // Cartas empilhadas com leve desalinhamento; a do nome sob o mouse vai para a frente
  const carta = document.createElement('button');
  carta.type = 'button';
  carta.className = 'carta-projeto';
  carta.dataset.projeto = p.slug;
  carta.dataset.indice = i;
  carta.style.setProperty('--capa', CORES[i % CORES.length]);
  carta.setAttribute('aria-label', p.nome);
  carta.innerHTML = `<span class="selos" aria-hidden="true"><i></i><i></i></span><span class="capa" aria-hidden="true"></span>`;
  pilhaEl.appendChild(carta);
});

// Pilha: a carta da frente é a atual; as anteriores aparecem em cima e as seguintes embaixo.
// Sem dar a volta: a primeira não mostra nada em cima e a última não mostra nada embaixo.
const cartasEl = [...pilhaEl.querySelectorAll('.carta-projeto')];
let cartaAtual = 0;
function ativarCarta(indice) {
  cartaAtual = Math.max(0, Math.min(cartasEl.length - 1, Number(indice)));
  cartasEl.forEach((c, k) => {
    const off = k - cartaAtual, dist = Math.abs(off);
    c.classList.toggle('ativa', off === 0);
    const giro = off === 0 ? -1.5 : (k % 2 ? 2.5 : -2.5); // cada carta inclina um pouco
    c.style.transform = `translateY(${off * 38}px) rotate(${giro}deg) scale(${1 - dist * 0.07})`;
    c.style.zIndex = 100 - dist;
    c.style.opacity = dist > 2 ? '0' : '1';
    c.style.pointerEvents = dist > 2 ? 'none' : '';
  });
}
let ultimoGiro = 0;
pilhaEl.addEventListener('wheel', e => {
  e.preventDefault(); // a roda troca a carta, sem rolar a página
  const agora = Date.now();
  if (agora - ultimoGiro < 280 || e.deltaY === 0) return; // um passo por vez
  ultimoGiro = agora;
  ativarCarta(cartaAtual + Math.sign(e.deltaY));
}, { passive: false });
ativarCarta(0);

// Passar o mouse (ou focar) num nome da lista traz a carta correspondente para a frente
nomesEl.addEventListener('mouseover', e => {
  const nome = e.target.closest('.nome-projeto');
  if (nome) ativarCarta(nome.dataset.indice);
});
nomesEl.addEventListener('focusin', e => {
  const nome = e.target.closest('.nome-projeto');
  if (nome) ativarCarta(nome.dataset.indice);
});

// Polaroids: 17 fotos em tira horizontal
// Postais: 24 cartões, sempre exibidos na vertical (horizontais giram dentro da moldura)
const polaroids = Array.from({ length: 17 }, (_, i) => `img/polaroid-${String(i + 1).padStart(2, '0')}.webp`);
const postais = Array.from({ length: 24 }, (_, i) => ({
  src: `img/postal-${String(i + 1).padStart(2, '0')}.webp`,
  orientacao: [3, 8, 19, 21].includes(i + 1) ? 'horizontal' : 'vertical' // fotos 3, 8, 19 e 21 são horizontais
}));

const tira = document.querySelector('[data-tira]');
polaroids.forEach((src, i) => {
  const div = document.createElement('div');
  div.className = 'polaroid';
  div.style.setProperty('--giro', ((i % 3) - 1) * 1.5 + 'deg'); // leve inclinação, como fotos coladas
  div.innerHTML = `<img src="${src}" alt="" loading="lazy" draggable="false">`;
  tira.appendChild(div);
});
// Roda do mouse percorre a tira na horizontal
tira.addEventListener('wheel', e => {
  e.preventDefault();
  tira.scrollLeft += e.deltaX || e.deltaY;
}, { passive: false });
// Clicar e arrastar move a tira para os lados; soltar depois de arrastar não abre a foto
let arrasto = null, arrastou = false;
tira.addEventListener('pointerdown', e => {
  if (e.button !== 0) return;
  arrasto = { x: e.clientX, esquerda: tira.scrollLeft };
  arrastou = false;
  tira.classList.add('arrastando');
});
document.addEventListener('pointermove', e => {
  if (!arrasto) return;
  const dx = e.clientX - arrasto.x;
  if (Math.abs(dx) > 5) arrastou = true;
  tira.scrollLeft = arrasto.esquerda - dx;
});
document.addEventListener('pointerup', () => {
  if (!arrasto) return;
  arrasto = null;
  tira.classList.remove('arrastando');
});
tira.addEventListener('dragstart', e => e.preventDefault());

// Polaroids. A tela desliza da direita com duas pilhas paradas na direita; depois as fotos saem
// das pilhas para a posição final, uma a uma, da esquerda para a direita. Só entram na animação
// as fotos que aparecem na primeira tela (mesmo as cortadas na borda); as que exigem rolagem ficam
// de fora e só aparecem quando as outras se espalham. Ao fechar, o caminho é o inverso e a tela
// sai pela direita junto com as pilhas.
const polaroidEls = () => [...tira.querySelectorAll('.polaroid')];
const telaPolaroids = document.getElementById('polaroids');
const ATRASO_ESPALHAR = 450, PASSO_ESPALHAR = 40, DURACAO_ESPALHAR = 420;
const PASSO_EMPILHAR = 15, DURACAO_EMPILHAR = 300;
let timersPolaroids = [];
let animadasPolaroids = [];
function limparTimers() {
  timersPolaroids.forEach(clearTimeout);
  timersPolaroids = [];
}
// Mede as fotos na posição final (relativas à tela, então não dependem do deslizamento)
// e define, para cada foto animada, o destino da pilha (de cima ou de baixo) e a ordem de saída
function calcularPilhas() {
  const W = window.innerWidth, H = window.innerHeight;
  const tr = telaPolaroids.getBoundingClientRect();
  animadasPolaroids = [];
  polaroidEls().forEach(el => {
    el.style.transition = 'none';
    el.classList.remove('em-pilha');
    void el.offsetWidth;
    const r = el.getBoundingClientRect();
    el.style.transition = '';
    const cx = r.left - tr.left + r.width / 2, cy = r.top - tr.top + r.height / 2;
    el._cx = cx; el._cy = cy;
    el.dataset.animada = r.left - tr.left < W ? '1' : '';
    if (el.dataset.animada) animadasPolaroids.push(el);
  });
  const total = animadasPolaroids.length;
  animadasPolaroids.forEach((el, idx) => {
    const linha = idx % 2;               // 0 = pilha de cima, 1 = pilha de baixo
    const k = Math.floor(idx / 2);       // posição na pilha (0 = a mais à esquerda, no topo)
    const pilhaX = W * 0.86;             // pilhas paradas à direita
    const pilhaY = linha ? H * 0.7 : H * 0.3;
    el.style.setProperty('--x1', (pilhaX - el._cx) + 'px');
    el.style.setProperty('--y1', (pilhaY - el._cy) + 'px');
    el.style.setProperty('--pgiro', ((idx * 37) % 9 - 4) + 'deg');
    el.style.zIndex = total - k;
  });
}
function montarPilhaPolaroids() {
  limparTimers();
  telaPolaroids.style.transition = '';
  tira.scrollLeft = 0;
  calcularPilhas();
  polaroidEls().forEach(el => {
    el.style.transition = 'none';
    el.classList.toggle('sem-animacao', !el.dataset.animada);
    el.classList.toggle('em-pilha', !!el.dataset.animada);
    void el.offsetWidth;
    el.style.transition = '';
  });
}
// Depois que a tela chega, as fotos saem das pilhas para a posição final (as que estavam fora aparecem junto)
function espalharPolaroids() {
  limparTimers();
  timersPolaroids.push(setTimeout(() => {
    animadasPolaroids.forEach((el, i) => {
      el.style.transitionDuration = DURACAO_ESPALHAR + 'ms';
      el.style.transitionDelay = (i * PASSO_ESPALHAR) + 'ms';
      el.classList.remove('em-pilha');
      timersPolaroids.push(setTimeout(() => {
        el.style.transitionDelay = '';
        el.style.transitionDuration = '';
        el.style.zIndex = '';
      }, i * PASSO_ESPALHAR + DURACAO_ESPALHAR + 50));
    });
    polaroidEls().filter(el => !el.dataset.animada).forEach(el => el.classList.remove('sem-animacao'));
  }, ATRASO_ESPALHAR));
}
// Saída: as fotos voltam às pilhas (da última para a primeira); a tela sai depois, junto com as pilhas
function empilharPolaroids() {
  limparTimers();
  calcularPilhas();
  const n = animadasPolaroids.length;
  animadasPolaroids.forEach((el, i) => {
    el.style.transitionDuration = DURACAO_EMPILHAR + 'ms';
    el.style.transitionDelay = ((n - 1 - i) * PASSO_EMPILHAR) + 'ms';
    el.classList.add('em-pilha');
  });
  polaroidEls().filter(el => !el.dataset.animada).forEach(el => el.classList.add('sem-animacao'));
  const espera = (n - 1) * PASSO_EMPILHAR + DURACAO_EMPILHAR + 50;
  telaPolaroids.style.transition = `transform 520ms cubic-bezier(0.2, 0.7, 0.2, 1) ${espera}ms, visibility 0s linear ${espera + 520}ms`;
  return espera;
}

const binder = document.querySelector('[data-binder]');
for (let i = 0; i < postais.length; i += 2) {
  const espelho = document.createElement('div');
  espelho.className = 'espelho-postal';
  postais.slice(i, i + 2).forEach(p => {
    const div = document.createElement('div');
    div.className = `postal ${p.orientacao}`;
    div.dataset.src = p.src;
    div.innerHTML = `<div class="moldura"><img src="${p.src}" alt=""></div>`;
    espelho.appendChild(div);
  });
  binder.appendChild(espelho);
}

// Livro com páginas que viram: setas, teclado e contador
// Seta lateral (só o desenho da seta, sem círculo)
function criarSeta(classe, rotulo, caminho) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = `seta ${classe}`;
  b.setAttribute('aria-label', rotulo);
  b.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${caminho}"/></svg>`;
  return b;
}

function montarLivro(container, nomeTela) {
  const folhas = [...container.children];
  let atual = 0;
  const DURACAO_MIN = 260, DURACAO_MAX = 620;

  const contadorNav = document.createElement('nav');
  contadorNav.className = 'controles';
  contadorNav.innerHTML = '<span data-contador aria-live="polite"></span>';
  container.after(contadorNav);
  const contador = contadorNav.querySelector('[data-contador]');

  // Setas nas laterais do livro: aparecem quando o mouse passa pela faixa de cada lado
  const ant = criarSeta('seta-ant', 'Página anterior', 'M15 5 8 12l7 7');
  const prox = criarSeta('seta-prox', 'Próxima página', 'M9 5l7 7-7 7');
  container.append(ant, prox);

  // As setas ficam encostadas nas bordas do álbum (a altura segue o binder, centralizada)
  function posicionarSetas() {
    const sp = folhas[atual].getBoundingClientRect();
    const base = container.getBoundingClientRect();
    const folga = 6;
    ant.style.left = (sp.left - base.left - ant.offsetWidth - folga) + 'px';
    ant.style.right = 'auto';
    prox.style.left = (sp.right - base.left + folga) + 'px';
    prox.style.right = 'auto';
  }

  let virada = null; // virada em andamento
  const alvo = () => (virada ? virada.alvo : atual);

  function mostrar(novo) {
    atual = novo;
    folhas.forEach((f, k) => f.classList.toggle('atual', k === atual));
    contador.textContent = `${atual + 1} / ${folhas.length}`;
    ant.classList.toggle('fim', atual === 0);
    prox.classList.toggle('fim', atual === folhas.length - 1);
    posicionarSetas();
  }

  function caixa(x, w, h, classes) {
    const d = document.createElement('div');
    d.className = classes;
    d.style.left = x + 'px';
    d.style.width = w + 'px';
    d.style.height = h + 'px';
    return d;
  }
  // Metade da página: o postal copiado, centralizado no papel
  function metade(postal) {
    const papel = document.createElement('div');
    papel.className = 'pagina-virada';
    papel.appendChild(postal.cloneNode(true));
    return papel;
  }
  const reflexo = () => {
    const d = document.createElement('div');
    d.className = 'reflexo';
    return d;
  };

  // A folha rígida gira em torno da lombada. dir 1 = a metade direita vai para a esquerda; -1 = o contrário
  function prepararVirada(dir, novo) {
    const antigo = folhas[atual], destino = folhas[novo];
    const [pe, pd] = [antigo.children[0], antigo.children[1]];
    const [de, dd] = [destino.children[0], destino.children[1]];
    const sp = antigo.getBoundingClientRect();
    const base = container.getBoundingClientRect();
    const w = sp.width / 2, h = sp.height;

    const overlay = document.createElement('div');
    overlay.className = 'virada';
    overlay.style.cssText = `left:${sp.left - base.left}px;top:${sp.top - base.top}px;width:${sp.width}px;height:${h}px`;
    // Por baixo da folha: a metade que fica e a metade que chega
    const esq = caixa(0, w, h, 'virada-caixa esq');
    esq.appendChild(metade(dir === 1 ? pe : de));
    const dirc = caixa(w, w, h, 'virada-caixa dir');
    dirc.appendChild(metade(dir === 1 ? dd : pd));
    // A folha: frente (página que sai) e verso (página que chega)
    const folha = document.createElement('div');
    folha.className = 'folha-virada';
    folha.style.cssText = `left:${dir === 1 ? w : 0}px;width:${w}px;height:${h}px;transform-origin:${dir === 1 ? 'left' : 'right'} center`;
    folha.classList.add(dir === 1 ? 'folha-dir' : 'folha-esq');
    const frente = document.createElement('div');
    frente.className = 'face frente';
    frente.append(metade(dir === 1 ? pd : pe), reflexo());
    const verso = document.createElement('div');
    verso.className = 'face verso';
    verso.append(metade(dir === 1 ? de : dd), reflexo());
    folha.append(frente, verso);
    // A divisória do meio continua visível por cima das metades e por baixo da folha
    const lombada = document.createElement('div');
    lombada.className = 'virada-lombada';
    overlay.append(esq, dirc, lombada, folha);
    container.appendChild(overlay);

    const v = { alvo: novo, dir, theta: 0, frame: 0, overlay, concluido: false };
    v.definir = theta => {
      v.theta = theta;
      folha.style.transform = `rotateY(${dir === 1 ? -theta : theta}deg)`;
      overlay.style.setProperty('--brilho', (Math.sin(theta * Math.PI / 180) * 0.45).toFixed(3));
    };
    v.concluir = completo => {
      if (v.concluido) return;
      v.concluido = true;
      cancelAnimationFrame(v.frame);
      overlay.remove();
      if (virada === v) virada = null;
      if (completo) mostrar(novo);
    };
    v.definir(0);
    return v;
  }

  // Termina o giro de onde ele está até 0 (volta) ou 180 (completa)
  function animar(v, para, completo) {
    cancelAnimationFrame(v.frame);
    const de = v.theta;
    const dur = Math.min(DURACAO_MAX, Math.max(DURACAO_MIN, Math.abs(para - de) / 180 * DURACAO_MAX));
    const t0 = performance.now();
    const passo = agora => {
      const k = Math.min(1, (agora - t0) / dur);
      v.definir(de + (para - de) * (1 - Math.pow(1 - k, 3)));
      if (k < 1) v.frame = requestAnimationFrame(passo);
      else v.concluir(completo);
    };
    v.frame = requestAnimationFrame(passo);
  }

  function virar(i) {
    if (virada) virada.concluir(true); // uma virada nova conclui a que estava em andamento
    const novo = Math.max(0, Math.min(folhas.length - 1, i));
    if (novo === atual) return;
    if (container.dataset.livro === undefined) {
      mostrar(novo);
      return;
    }
    virada = prepararVirada(novo > atual ? 1 : -1, novo);
    animar(virada, 180, true);
  }

  // Arrastar: a folha acompanha o ponteiro pela lombada
  let arrasto = null;
  let suprimirClique = false;
  const localX = e => e.clientX - container.getBoundingClientRect().left;
  const medidas = () => {
    const sp = folhas[atual].getBoundingClientRect();
    const base = container.getBoundingClientRect();
    return { w: sp.width / 2, meio: sp.left - base.left + sp.width / 2 };
  };

  container.addEventListener('pointerdown', e => {
    if (e.button !== 0 || virada || container.dataset.livro === undefined) return;
    if (e.target.closest('.seta')) return;
    const m = medidas();
    const dir = localX(e) >= m.meio ? 1 : -1;
    const novo = atual + dir;
    if (novo < 0 || novo > folhas.length - 1) return;
    arrasto = { id: e.pointerId, dir, novo, x0: e.clientX, y0: e.clientY, movido: false, v: null, vel: 0, ultimo: { x: e.clientX, t: e.timeStamp } };
  });

  container.addEventListener('pointermove', e => {
    if (!arrasto || e.pointerId !== arrasto.id) return;
    if (!arrasto.movido) {
      if (Math.hypot(e.clientX - arrasto.x0, e.clientY - arrasto.y0) < 6) return;
      arrasto.movido = true;
      container.setPointerCapture(e.pointerId);
      virada = prepararVirada(arrasto.dir, arrasto.novo);
      arrasto.v = virada;
    }
    const m = medidas();
    const x = localX(e);
    // Ângulo da folha = o ângulo cujo cosseno dá a posição do ponteiro: a borda segue a mão
    const c = arrasto.dir === 1 ? (x - m.meio) / m.w : (m.meio - x) / m.w;
    arrasto.v.definir(Math.acos(Math.max(-1, Math.min(1, c))) * 180 / Math.PI);
    const dt = e.timeStamp - arrasto.ultimo.t;
    if (dt > 0) arrasto.vel = (e.clientX - arrasto.ultimo.x) / dt;
    arrasto.ultimo = { x: e.clientX, t: e.timeStamp };
  });

  const soltar = e => {
    if (!arrasto || e.pointerId !== arrasto.id) return;
    const a = arrasto;
    arrasto = null;
    if (!a.movido) return; // foi um clique: segue normal (ampliar o postal)
    suprimirClique = true;
    setTimeout(() => { suprimirClique = false; }, 0);
    const theta = a.v.theta;
    const rapido = (a.dir === 1 ? a.vel < -1.0 : a.vel > 1.0) && theta > 10;
    const completar = theta > 90 || rapido;
    animar(a.v, completar ? 180 : 0, completar);
  };
  container.addEventListener('pointerup', soltar);
  container.addEventListener('pointercancel', soltar);
  container.addEventListener('click', e => {
    if (suprimirClique) {
      e.stopPropagation();
      e.preventDefault();
    }
  }, true);

  ant.addEventListener('pointerenter', posicionarSetas);
  prox.addEventListener('pointerenter', posicionarSetas);
  window.addEventListener('resize', posicionarSetas);
  ant.addEventListener('click', () => virar(alvo() - 1));
  prox.addEventListener('click', () => virar(alvo() + 1));
  document.addEventListener('keydown', e => {
    if (!container.closest('[data-tela]').classList.contains('ativa')) return;
    if (e.key === 'ArrowRight') virar(alvo() + 1);
    if (e.key === 'ArrowLeft') virar(alvo() - 1);
  });
  mostrar(0);
}
binder.dataset.livro = '';
montarLivro(binder, 'postais');

// Visualização ampliada: a foto aparece no sentido em que foi feita (sem girar)
const ampliada = document.querySelector('[data-ampliada]');
const ampliadaImg = document.querySelector('[data-ampliada-img]');

// Foto ampliada: inclina no sentido do mouse, sem efeito de brilho
const INCLINACAO = 5;
ampliadaImg.addEventListener('pointermove', e => {
  const nx = Math.max(-1, Math.min(1, (e.clientX - window.innerWidth / 2) / (ampliadaImg.offsetWidth / 2)));
  const ny = Math.max(-1, Math.min(1, (e.clientY - window.innerHeight / 2) / (ampliadaImg.offsetHeight / 2)));
  ampliadaImg.style.transform = `perspective(1100px) rotateX(${-ny * INCLINACAO}deg) rotateY(${nx * INCLINACAO}deg) scale(1.01)`;
});
ampliadaImg.addEventListener('pointerleave', () => { ampliadaImg.style.transform = ''; });

function abrir(src) {
  ampliadaImg.src = src;
  ampliada.hidden = false;
}

tira.addEventListener('click', e => {
  if (arrastou) return;
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
// Esc: fecha a ampliação; depois a aba lateral; depois volta da tela atual (igual ao botão Voltar)
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  if (!ampliada.hidden) { fechar(); return; }
  if (document.querySelector('.gaveta.aberta')) { fecharGaveta(); return; }
  const voltar = document.querySelector('[data-tela].ativa [data-voltar]');
  if (voltar) voltar.click();
});


// Lousa: nada é selecionado ao arrastar (texto, QR code ou fundo)
document.getElementById('lousa').addEventListener('selectstart', e => e.preventDefault());
document.getElementById('lousa').addEventListener('dragstart', e => e.preventDefault());

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
  botaoMenu.classList.add('aberto');
  botaoMenu.setAttribute('aria-expanded', 'true');
  gaveta.querySelector('li button').focus();
}
function fecharGaveta() {
  gaveta.classList.remove('aberta');
  botaoMenu.classList.remove('aberto');
  botaoMenu.setAttribute('aria-expanded', 'false');
}
// O botão do menu abre e fecha a barra; enquanto ela está aberta, ele vira um X e acompanha a barra
botaoMenu.addEventListener('click', () => (gaveta.classList.contains('aberta') ? fecharGaveta() : abrirGaveta()));

// Botão "Voltar ao topo": fica disponível assim que a mesa rola, e sobe a mesa rapidamente até o início
const DURACAO_TOPO = 450;
document.querySelector('[data-voltar-topo]').addEventListener('click', () => {
  const origem = inicio.scrollTop;
  const t0 = performance.now();
  const passo = agora => {
    const k = Math.min(1, (agora - t0) / DURACAO_TOPO);
    inicio.scrollTop = origem * (1 - (1 - Math.pow(1 - k, 3)));
    if (k < 1) requestAnimationFrame(passo);
  };
  requestAnimationFrame(passo);
});
inicio.addEventListener('scroll', () => {
  document.getElementById('mesa').classList.toggle('rolada', inicio.scrollTop > 40);
});
// Revela a seta quando o mouse chega perto da borda de baixo, no centro (a área de clique continua só a seta)
const mesaEl = document.getElementById('mesa');
document.addEventListener('pointermove', e => {
  const perto = e.clientY > window.innerHeight - 200 && Math.abs(e.clientX - window.innerWidth / 2) < 220;
  mesaEl.classList.toggle('revelar', perto);
});
document.documentElement.addEventListener('pointerleave', () => mesaEl.classList.remove('revelar'));
document.addEventListener('keydown', e => {
});


// Sobre mim: o quadrado de foto (placeholder) troca de cor sozinho a cada 3 s e também ao clicar
const cores = ['#1c2fd1', '#d7312b', '#f2b632', '#2e9e5b', '#7a3fb0'];
const botaoFoto = document.querySelector('[data-trocar-cor]');
let corAtual = 0, temporizadorFoto;
function trocarCor() {
  corAtual = (corAtual + 1) % cores.length;
  botaoFoto.style.setProperty('--cor', cores[corAtual]);
}
function iniciarTrocaAutomatica() {
  clearInterval(temporizadorFoto);
  temporizadorFoto = setInterval(trocarCor, 3000);
}
botaoFoto.style.setProperty('--cor', cores[corAtual]);
iniciarTrocaAutomatica();
botaoFoto.addEventListener('click', () => { trocarCor(); iniciarTrocaAutomatica(); });

// Adesivos da lousa (exceto o QR code): ao pressionar, o adesivo se levanta do fundo; ao soltar, volta
const pecasDescolaveis = [...document.querySelectorAll('[data-peca]')].filter(el => !el.querySelector('.qr-peca'));
pecasDescolaveis.forEach(el => {
  el.addEventListener('pointerdown', e => { if (e.button === 0) el.classList.add('descolado'); });
});
const colarAdesivos = () => pecasDescolaveis.forEach(el => el.classList.remove('descolado'));
document.addEventListener('pointerup', colarAdesivos);
document.addEventListener('pointercancel', colarAdesivos);

// Setas laterais da página de polaroids: rolam a tira e aparecem ao passar o mouse
(() => {
  const tela = document.getElementById('polaroids');
  const tira = tela.querySelector('[data-tira]');
  const esquerda = criarSeta('seta-ant', 'Polaroids anteriores', 'M15 5 8 12l7 7');
  const direita = criarSeta('seta-prox', 'Próximas polaroids', 'M9 5l7 7-7 7');
  tela.append(esquerda, direita);
  const atualizar = () => {
    const max = tira.scrollWidth - tira.clientWidth;
    esquerda.classList.toggle('fim', tira.scrollLeft <= 2);
    direita.classList.toggle('fim', tira.scrollLeft >= max - 2);
  };
  const passo = () => tira.clientWidth * 0.8;
  esquerda.addEventListener('click', () => tira.scrollBy({ left: -passo(), behavior: 'smooth' }));
  direita.addEventListener('click', () => tira.scrollBy({ left: passo(), behavior: 'smooth' }));
  esquerda.addEventListener('pointerenter', atualizar);
  direita.addEventListener('pointerenter', atualizar);
  tira.addEventListener('scroll', atualizar, { passive: true });
  window.addEventListener('resize', atualizar);
  atualizar();
})();
