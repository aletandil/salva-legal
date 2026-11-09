// La portada: entradas al hacer scroll, el precio que se tacha y la reserva
// del teléfono, la cabecera que gana borde al bajar, el menú del teléfono, el
// recorrido de "Cómo funciona", la sección del menú en la que estás y los
// botones del App Store.
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

  // ----- Menú del teléfono -----
  // Se cierra al elegir una sección, con Escape y al tocar afuera: es un
  // atajo, no un lugar donde quedarse.
  var botonMenu = cabecera.querySelector('.boton-menu');
  function menu(abrir) {
    cabecera.classList.toggle('abierta', abrir);
    botonMenu.setAttribute('aria-expanded', String(abrir));
  }
  if (botonMenu) {
    botonMenu.addEventListener('click', function () { menu(!cabecera.classList.contains('abierta')); });
    cabecera.querySelectorAll('.menu a').forEach(function (a) {
      a.addEventListener('click', function () { menu(false); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && cabecera.classList.contains('abierta')) { menu(false); botonMenu.focus(); }
    });
    document.addEventListener('click', function (e) {
      if (!cabecera.contains(e.target)) menu(false);
    });
  }

  // ----- Recorrido de "Cómo funciona" -----
  // Se llena según cuánto de la lista ya pasó por la mitad baja de la
  // pantalla; un paso se marca cuando la barra llega a él.
  var pasos = document.querySelector('.pasos');
  var recorrido = document.querySelector('.recorrido');
  var itemsPaso = pasos ? pasos.querySelectorAll('.paso') : [];
  var pendiente = false;
  function avanzar() {
    pendiente = false;
    var r = pasos.getBoundingClientRect();
    var avance = Math.min(1, Math.max(0, (window.innerHeight * 0.8 - r.top) / r.height));
    if (recorrido) recorrido.style.setProperty('--avance', avance.toFixed(3));
    itemsPaso.forEach(function (paso, i) {
      var p = paso.getBoundingClientRect();
      paso.classList.toggle('hecho', p.top + p.height * 0.5 < window.innerHeight * 0.8 && avance > i / itemsPaso.length);
    });
  }
  if (pasos) {
    window.addEventListener('scroll', function () {
      if (!pendiente) { pendiente = true; requestAnimationFrame(avanzar); }
    }, { passive: true });
    avanzar();
  }

  // ----- Entradas -----
  var entradas = document.querySelectorAll('[data-entrada]');
  var tachables = document.querySelectorAll('[data-tachar]');

  // Después del tachado, en el teléfono alguien reserva: sale la
  // confirmación y queda una menos.
  function tachar(el, demora) {
    setTimeout(function () {
      el.classList.add('tachado');
      var telefono = el.closest('.telefono');
      if (telefono) setTimeout(function () { telefono.classList.add('reservado'); }, 1700);
    }, demora);
  }

  // ----- Sección del menú en la que estás -----
  var enlaces = {};
  cabecera.querySelectorAll('.menu a[href^="#"]').forEach(function (a) { enlaces[a.getAttribute('href').slice(1)] = a; });

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

  var espia = new IntersectionObserver(function (vistos) {
    vistos.forEach(function (v) {
      var a = enlaces[v.target.id];
      if (!a) return;
      if (v.isIntersecting) {
        Object.keys(enlaces).forEach(function (k) { enlaces[k].removeAttribute('aria-current'); });
        a.setAttribute('aria-current', 'true');
      } else {
        a.removeAttribute('aria-current');
      }
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  Object.keys(enlaces).forEach(function (id) {
    var seccion = document.getElementById(id);
    if (seccion) espia.observe(seccion);
  });
})();
