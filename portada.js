// La portada: entradas al hacer scroll, el precio que se tacha, la cabecera
// que gana borde al bajar y los botones del App Store.
//
// Nada de esto es necesario para leer la página: sin JS, todo está visible
// desde el principio (el CSS sólo esconde con `.js`), y con "reducir
// movimiento" el CSS no anima nada aunque este archivo marque las clases.
(function () {
  'use strict';

  // ----- App Store -----
  // La URL vive en un solo lugar, en el <head> de index.html. Mientras esté
  // vacía, los botones quedan como "Próximamente" y no son links.
  var appStore = (window.SALVA_APP_STORE || '').trim();
  if (/^https:\/\/apps\.apple\.com\//.test(appStore)) {
    document.querySelectorAll('[data-app-store]').forEach(function (el) {
      var a = document.createElement('a');
      a.className = el.className;
      a.href = appStore;
      a.innerHTML = el.innerHTML;
      a.querySelector('small').textContent = 'Descargalo en';
      el.replaceWith(a);
    });
  }

  // ----- Cabecera -----
  var cabecera = document.getElementById('cabecera');
  function borde() { cabecera.classList.toggle('con-borde', window.scrollY > 8); }
  window.addEventListener('scroll', borde, { passive: true });
  borde();

  // ----- Entradas -----
  var entradas = document.querySelectorAll('[data-entrada]');
  var tachables = document.querySelectorAll('[data-tachar]');

  function tachar(el, demora) {
    setTimeout(function () { el.classList.add('tachado'); }, demora);
  }

  if (!('IntersectionObserver' in window)) {
    entradas.forEach(function (el) { el.classList.add('visible'); });
    tachables.forEach(function (el) { el.classList.add('tachado'); });
    return;
  }

  var observador = new IntersectionObserver(function (vistos) {
    vistos.forEach(function (v) {
      if (!v.isIntersecting) return;
      v.target.classList.add('visible');
      observador.unobserve(v.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
  entradas.forEach(function (el) { observador.observe(el); });

  // El precio viejo se tacha cuando ya se lo vio un momento: si se tacha
  // mientras todavía está entrando, nadie llega a ver que había otro precio.
  var tachador = new IntersectionObserver(function (vistos) {
    vistos.forEach(function (v) {
      if (!v.isIntersecting) return;
      tachar(v.target, 1300);
      tachador.unobserve(v.target);
    });
  }, { threshold: 0.6 });
  tachables.forEach(function (el) { tachador.observe(el); });
})();
