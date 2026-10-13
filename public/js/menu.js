
const btnMenu = document.getElementById('btn-menu');
const overlay = document.getElementById('overlay');

if(window.innerWidth <= 900) document.body.classList.add('menu-fechado');

btnMenu.addEventListener('click', () => document.body.classList.toggle('menu-fechado'));
overlay.addEventListener('click', () => document.body.classList.add('menu-fechado'));

const itensNav = [...document.querySelectorAll('.sidebar .nav-item')];
const indicador = document.getElementById('nav-indicador');
const indiceAtivo = () => itensNav.findIndex(i => i.classList.contains('ativo'));
const topoDe = i => `translateY(${itensNav[i].offsetTop}px)`;

function posicionarIndicador(){
  const atual = indiceAtivo();
  if(atual < 0) return;

  const guardado = sessionStorage.getItem('navAnterior');
  const ant = guardado === null ? atual : Number(guardado);
  sessionStorage.removeItem('navAnterior');

  indicador.style.transition = 'none';
  indicador.style.transform = topoDe(itensNav[ant] ? ant : atual);
  indicador.style.opacity = 1;
  indicador.offsetHeight;
  indicador.style.transition = '';
  indicador.style.transform = topoDe(atual);
}

window.addEventListener('load', posicionarIndicador);
window.addEventListener('resize', () => {
  indicador.style.transition = 'none';
  indicador.style.transform = topoDe(indiceAtivo());
});

itensNav.forEach(item => {
  item.addEventListener('click', () => {
    if(item.classList.contains('ativo')) return;
    if(item.querySelector('a')) sessionStorage.setItem('navAnterior', indiceAtivo());
  });
});
