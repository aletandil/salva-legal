// La dirección de Salvá en el App Store, en un solo lugar para todo el
// sitio: la portada y para-comercios.html (vía portada.js convierten los
// `[data-app-store]` en links), y oferta.html, comercio.html, hoy.html,
// cuenta.html y 404.html, que en iPhone y iPad mandan el botón de bajar acá
// en vez de a Play.
//
// La de la tienda argentina: Apple redirige sola a la del país de quien la
// abre. Va por el id y no por el nombre, que Apple puede cambiar en la URL
// si cambia el título de la ficha. El id es el mismo que usa la app en
// lib/core/config/sitio.dart.
//
// Si algún día hubiera que bajarla, vaciarla alcanza: los botones de la
// portada vuelven a "Próximamente" y las páginas sueltas esconden el botón
// en iPhone en vez de mandar a una ficha que no existe.
window.SALVA_APP_STORE = 'https://apps.apple.com/ar/app/id6832731397';
