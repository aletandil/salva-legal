// Lo que comparten hoy.html y comercio.html: cómo se dibuja una oferta y un
// local, los links a las tiendas y el pedido a la base.
//
// El HTML de las listas lo arma también, del lado del servidor, la Edge
// Function `compartir` (supabase/functions/compartir/contenido.ts en el
// repo de la app), y el Worker de Cloudflare lo pone en la página antes de
// que llegue: así Google lee las ofertas sin correr JavaScript, y quien
// abre el link las ve sin esperar. Este archivo arma exactamente el mismo
// HTML para cuando la página llega sin él (el Worker no contestó, o se
// abre desde la compu sin Cloudflare). Hay una copia en la app, en
// `supabase/functions/compartir/testdata/`, y un test que compara las dos
// salidas: si se cambia acá, se copia allá.
//
// Se arma texto y no nodos para poder comparar. Todo lo que viene de la
// base pasa por `escapar`: el título y el nombre del local los escribe el
// comercio.
(function (global) {
  'use strict';

  var ZONA = 'America/Argentina/Buenos_Aires';
  var DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  var PAQUETE = 'com.oportia.salva';

  function escapar(t) {
    return String(t)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function capital(t) { return t.charAt(0).toUpperCase() + t.slice(1); }

  // A la argentina, como en la app: "$ 4.000", y con centavos si los tiene
  // ("$ 2.999,50"). Igual que `plata` de la función (vista.ts): redondear
  // acá hacía que la lista dijera "$ 3.000" y la oferta, en la app y en la
  // vista previa, "$ 2.999,50". Se cuenta en centavos enteros para que
  // 0,1 + 0,2 no deje un ",30000001". Los puntos a mano: no todos los
  // navegadores traen `es-AR`.
  function plata(n) {
    var centavos = Math.round(Number(n == null ? 0 : n) * 100);
    var abs = Math.abs(centavos);
    var miles = String(Math.floor(abs / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    var resto = abs % 100;
    var numero = resto === 0 ? miles : miles + ',' + (resto < 10 ? '0' : '') + resto;
    return (centavos < 0 ? '-' : '') + '$ ' + numero;
  }

  // Por kilo (1150), el precio del kilo con "/kg", como la app.
  function precioDe(o, campo) {
    var gramos = Number(o.gramos || 0);
    if (o.vende_por === 'kilo' && gramos > 0) return plata(Number(o[campo] || 0) * 1000 / gramos) + '/kg';
    return plata(o[campo]);
  }

  // La hora en Tandil, sin depender del idioma del navegador.
  function enTandil(iso) {
    var p = {};
    new Intl.DateTimeFormat('en-US', {
      timeZone: ZONA, year: 'numeric', month: 'numeric', day: 'numeric',
      hour: '2-digit', minute: '2-digit', hourCycle: 'h23', weekday: 'short'
    }).formatToParts(new Date(iso)).forEach(function (x) { p[x.type] = x.value; });
    var semana = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.weekday);
    return { dia: DIAS[semana], fecha: p.day + '/' + p.month, hora: p.hour + ':' + p.minute };
  }

  // "hoy", "mañana" o "el viernes 21/11".
  function cuando(iso, ahora) {
    var d = enTandil(iso);
    if (d.fecha === enTandil(ahora.toISOString()).fecha) return 'hoy';
    if (d.fecha === enTandil(new Date(ahora.getTime() + 864e5).toISOString()).fecha) return 'mañana';
    return 'el ' + d.dia + ' ' + d.fecha;
  }

  // Si cierra de madrugada, el día de antes: un local que cierra a la 1
  // cierra "el sábado", como en la app.
  function retiro(o, ahora) {
    if (!o.retiro_desde || !o.retiro_hasta) return null;
    var desde = new Date(o.retiro_desde), hasta = o.retiro_hasta, t;
    if (o.retiro_en_horario_del_local) {
      var pared = Number(enTandil(hasta).hora.slice(0, 2)) < 6
        ? new Date(new Date(hasta).getTime() - 6 * 3600000).toISOString()
        : hasta;
      t = 'en el horario del local, hasta ' + cuando(pared, ahora);
    } else if (desde <= ahora) {
      t = 'hasta ' + cuando(hasta, ahora) + ' a las ' + enTandil(hasta).hora;
    } else if (cuando(o.retiro_desde, ahora) === cuando(hasta, ahora)) {
      t = cuando(o.retiro_desde, ahora) + ' de ' + enTandil(o.retiro_desde).hora + ' a ' + enTandil(hasta).hora;
    } else {
      t = cuando(o.retiro_desde, ahora) + ' ' + enTandil(o.retiro_desde).hora + ' a ' +
        cuando(hasta, ahora) + ' ' + enTandil(hasta).hora;
    }
    return capital(t);
  }

  function cuantas(n) { return n === 1 ? '1 oferta' : n + ' ofertas'; }
  function inicial(nombre) { return (String(nombre).trim().charAt(0) || 'S').toUpperCase(); }

  // Las fotos de ejemplo de la app tienen copia en img/generica/.
  function fotoDeEjemplo(sitio, archivo) {
    return archivo && /^[a-z0-9_]{1,40}\.jpg$/.test(archivo) ? sitio + '/img/generica/' + archivo : null;
  }

  function tarjetaDeOferta(o, sitio, ahora, fotoPublica) {
    var agotada = o.agotada === true;
    var ejemplo = fotoDeEjemplo(sitio, o.foto_ilustrativa);
    var foto = o.foto && fotoPublica(o.foto)
      ? o.foto
      : ejemplo || (o.foto_del_comercio && fotoPublica(o.foto_del_comercio) ? o.foto_del_comercio : null);
    var p = [];
    p.push('<li class="oferta' + (agotada ? ' agotada' : '') + '">');
    p.push('<a href="/oferta.html?id=' + escapar(o.id || '') + '">');
    p.push('<div class="foto">');
    p.push(foto
      ? '<img src="' + escapar(foto) + '" alt="" loading="lazy">'
      : '<div class="rubro">' + escapar(o.rubro || 'Salvá') + '</div>');
    if (foto && foto === ejemplo) p.push('<span class="ilustrativa">Foto ilustrativa</span>');
    if ((o.descuento || 0) > 0 && !agotada) p.push('<span class="descuento">&minus;' + o.descuento + '%</span>');
    p.push('</div>');
    p.push('<div class="cuerpo">');
    p.push('<h3>' + escapar(o.titulo || '') + '</h3>');
    p.push('<p class="local">' + escapar(o.comercio || '') + (o.direccion ? ' · ' + escapar(o.direccion) : '') + '</p>');
    p.push('<div class="precios"><span class="precio">' + escapar(precioDe(o, 'precio')) + '</span>');
    if (Number(o.precio_original) > Number(o.precio)) {
      p.push('<span class="antes">' + escapar(precioDe(o, 'precio_original')) + '</span>');
    }
    p.push('</div>');
    var r = retiro(o, ahora);
    if (r) p.push('<span class="retiro">' + escapar(r) + '</span>');
    var quedan = Number(o.quedan || 0);
    p.push('<p class="estado">' + (agotada ? 'Agotada por ahora' : quedan === 1 ? 'Queda 1' : 'Quedan ' + quedan) + '</p>');
    p.push('</div></a></li>');
    return p.join('');
  }

  function filaDeLocal(l, fotoPublica) {
    var avatar = l.foto && fotoPublica(l.foto)
      ? '<img class="avatar" src="' + escapar(l.foto) + '" alt="" loading="lazy">'
      : '<span class="avatar" aria-hidden="true">' + escapar(inicial(l.nombre)) + '</span>';
    var detalle = [l.rubro, l.direccion].filter(Boolean).join(' · ');
    return '<li><a href="/comercio.html?id=' + escapar(l.id) + '">' + avatar +
      '<span class="datos"><strong>' + escapar(l.nombre) + '</strong>' +
      (detalle ? '<span class="tenue">' + escapar(detalle) + '</span>' : '') +
      '</span>' +
      (l.ofertas > 0 ? '<span class="cuantas">' + escapar(cuantas(l.ofertas)) + '</span>' : '') +
      '</a></li>';
  }

  function contenidoDeCiudad(fila, sitio, ahora, fotoPublica) {
    var c = fila.ciudad;
    var t = enTandil(ahora.toISOString());
    var hoy = capital(t.dia + ' ' + t.fecha);
    var html = ['<div class="servido" data-ciudad="' + escapar(c.slug) + '">'];
    if (!c.disponible) {
      html.push(
        '<header class="portada"><p class="antetitulo">Próximamente</p>' +
        '<h1>Salvá está por llegar a ' + escapar(c.nombre) + '</h1>' +
        '<p class="resumen">Anotate en la app y te avisamos el día que abre. Cuantos más se ' +
        'anoten, antes llegamos.</p></header>',
        '</div>');
      return html.join('\n');
    }
    var n = Number(fila.total) || 0;
    var locales = fila.locales || [];
    var desde = n > 0 && fila.precio_desde != null ? plata(fila.precio_desde) : null;
    // "de 2 locales": los que tienen algo en la lista, como la vista previa.
    var conOfertas = {};
    fila.ofertas.forEach(function (o) { conOfertas[o.comercio_id] = true; });
    var k = Object.keys(conOfertas).length;
    var resumen = n > 0
      ? capital(cuantas(n)) + ' de ' + (k === 1 ? '1 local' : k + ' locales') +
        (desde ? ', desde ' + desde : '') + '. Reservá en la app y retirá en el local.'
      : 'Los comercios publican lo que tiene vencimiento, casi siempre cerca del cierre.';
    html.push(
      '<header class="portada"><p class="antetitulo">' + escapar(hoy) + '</p>' +
      '<h1>Las ofertas de hoy en ' + escapar(c.nombre) + '</h1>' +
      '<p class="resumen">' + escapar(resumen) + '</p></header>');
    html.push('<section class="seccion" aria-labelledby="t-ofertas">');
    html.push('<h2 id="t-ofertas">Para reservar hoy</h2>');
    if (fila.ofertas.length) {
      html.push('<ul class="grilla">' + fila.ofertas.map(function (o) {
        return tarjetaDeOferta(o, sitio, ahora, fotoPublica);
      }).join('\n') + '</ul>');
      if (n > fila.ofertas.length) html.push('<p class="nota">Hay ' + (n - fila.ofertas.length) + ' más en la app.</p>');
    } else {
      html.push(
        '<div class="tarjeta vacia"><p><strong>Hoy todavía no hay ofertas en ' + escapar(c.nombre) + '.</strong></p>' +
        '<p>Los comercios publican lo que les queda casi siempre cerca del cierre. Volvé a mirar ' +
        'más tarde, o bajá la app y seguí a tus locales: te avisamos cuando publican.</p></div>');
    }
    html.push('</section>');
    if (locales.length) {
      html.push(
        '<section class="seccion" aria-labelledby="t-locales">' +
        '<h2 id="t-locales">Los locales de ' + escapar(c.nombre) + ' en Salvá</h2>' +
        '<ul class="locales">' + locales.map(function (l) { return filaDeLocal(l, fotoPublica); }).join('\n') + '</ul>' +
        '</section>');
    }
    html.push('</div>');
    return html.join('\n');
  }

  function contenidoDelLocal(fila, sitio, ahora, fotoPublica) {
    var l = fila.local;
    var avatar = l.foto && fotoPublica(l.foto)
      ? '<img class="avatar grande" src="' + escapar(l.foto) + '" alt="">'
      : '<span class="avatar grande" aria-hidden="true">' + escapar(inicial(l.nombre)) + '</span>';
    var disponibles = fila.ofertas.filter(function (o) { return !o.agotada; }).length;
    var html = ['<div class="servido" data-local="' + escapar(l.id) + '">'];
    html.push(
      '<header class="portada local">' + avatar + '<div>' +
      (l.rubro ? '<p class="antetitulo">' + escapar(l.rubro) + '</p>' : '') +
      '<h1>' + escapar(l.nombre) + '</h1>' +
      '<p class="resumen">' + (l.direccion ? escapar(l.direccion) + ' · ' : '') +
      escapar(disponibles > 0 ? capital(cuantas(disponibles)) + ' para reservar ahora' : 'Está en Salvá') + '</p>' +
      '</div></header>');
    html.push('<section class="seccion" aria-labelledby="t-ofertas">');
    html.push('<h2 id="t-ofertas">Sus ofertas</h2>');
    if (fila.ofertas.length) {
      html.push('<ul class="grilla">' + fila.ofertas.map(function (o) {
        return tarjetaDeOferta(o, sitio, ahora, fotoPublica);
      }).join('\n') + '</ul>');
    } else {
      html.push(
        '<div class="tarjeta vacia"><p><strong>Ahora no tiene ofertas abiertas.</strong></p>' +
        '<p>Publica en Salvá lo que tiene vencimiento, a precio rebajado. Seguilo en la app y ' +
        'te avisamos apenas publica: lo reservás, lo pagás y lo retirás en el local.</p></div>');
    }
    html.push('</section>');
    html.push(
      '<p class="otra"><a href="/hoy/' + escapar(fila.ciudad.slug) + '">Mirá todas las ofertas de hoy en ' +
      escapar(fila.ciudad.nombre) + '</a></p>');
    html.push('</div>');
    return html.join('\n');
  }

  // ---------------------------------------------------------------- tiendas

  // Lo que va en el referrer de Play: Play lo guarda con la instalación y
  // la app lo lee al abrir por primera vez (de dónde vino quien instaló).
  //
  // `utm_source=sitio` y `utm_medium` la página (`hoy` o `comercio`),
  // con la ciudad o el local en `utm_content`. Si el link que trajo a la
  // persona ya traía su `utm_source` —el de la bio de Instagram, el de una
  // nota— se respeta ése, y su `utm_campaign`: es el dato más fino. Y si
  // trae `codigo` (el de invitación de quien lo compartió), va como
  // `utm_source=invitacion`, igual que oferta.html: es lo que busca la app
  // para precompletar "¿Te invitó alguien?". Todo lo de afuera, sólo con
  // la forma esperada.
  function referrer(medio, contenido, consulta) {
    var q = new URLSearchParams(consulta || '');
    var codigo = (q.get('codigo') || '').trim().toUpperCase();
    var fuente = (q.get('utm_source') || '').trim().toLowerCase();
    var campana = (q.get('utm_campaign') || '').trim().toLowerCase();
    var partes = /^[A-Z0-9]{8}$/.test(codigo)
      ? ['utm_source=invitacion', 'codigo=' + codigo]
      : ['utm_source=' + (/^[a-z0-9_.-]{1,40}$/.test(fuente) ? fuente : 'sitio')];
    partes.push('utm_medium=' + medio);
    if (contenido) partes.push('utm_content=' + encodeURIComponent(contenido));
    if (/^[a-z0-9_.-]{1,60}$/.test(campana)) partes.push('utm_campaign=' + campana);
    return partes.join('&');
  }

  function play(medio, contenido, consulta) {
    return 'https://play.google.com/store/apps/details?id=' + PAQUETE +
      '&referrer=' + encodeURIComponent(referrer(medio, contenido, consulta));
  }

  // `salva://<camino>` abre la app; en Android por `intent:`, que si no la
  // tiene manda a Play (con el mismo referrer).
  function abrirLaApp(camino, linkAPlay, android) {
    return android
      ? 'intent://' + camino + '#Intent;scheme=salva;package=' + PAQUETE +
        ';S.browser_fallback_url=' + encodeURIComponent(linkAPlay) + ';end'
      : 'salva://' + camino;
  }

  // ---------------------------------------------------------------- la base

  // La URL y la clave pública del proyecto. La clave es pública por
  // diseño: lo que se puede leer con ella lo decide la base, y las
  // funciones que llaman estas páginas sólo devuelven lo que la app
  // muestra sin cuenta.
  var API = {
    url: 'https://jjlrlfykiqheiliyeuwk.supabase.co',
    clave: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqbHJsZnlraXFoZWlsaXlldXdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkxMzIzODQsImV4cCI6MjEwNDcwODM4NH0.7XpWeksD6BIPe0T02g6Qr5_be008a-Rfq4Z2E6TTxG0'
  };
  // Para probar contra la base local, como oferta.html:
  // `?api=http://127.0.0.1:54321&key=<anon local>`. Sólo direcciones locales.
  if (global.location) {
    var q = new URLSearchParams(global.location.search);
    if (/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(q.get('api') || '') && q.get('key')) {
      API.url = q.get('api');
      API.clave = q.get('key');
    }
  }

  function rpc(nombre, parametros) {
    return fetch(API.url + '/rest/v1/rpc/' + nombre, {
      method: 'POST',
      headers: {
        'apikey': API.clave, 'Authorization': 'Bearer ' + API.clave, 'Content-Type': 'application/json'
      },
      body: JSON.stringify(parametros)
    }).then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); });
  }

  function leer(tabla, consulta) {
    return fetch(API.url + '/rest/v1/' + tabla + '?' + consulta, {
      headers: { 'apikey': API.clave, 'Authorization': 'Bearer ' + API.clave }
    }).then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); });
  }

  // Sólo fotos de nuestro Storage: una `img` con cualquier dirección es un
  // rastreador servido desde acá.
  function fotoPublica(url) {
    return !!url && url.indexOf(API.url + '/storage/v1/object/public/') === 0 &&
      !/%(2e|2f|5c)|\.\.|[?#]/i.test(url.slice(API.url.length));
  }

  global.SalvaOfertas = {
    escapar: escapar,
    plata: plata,
    precioDe: precioDe,
    fotoDeEjemplo: fotoDeEjemplo,
    cuando: cuando,
    retiro: retiro,
    tarjetaDeOferta: tarjetaDeOferta,
    filaDeLocal: filaDeLocal,
    contenidoDeCiudad: contenidoDeCiudad,
    contenidoDelLocal: contenidoDelLocal,
    referrer: referrer,
    play: play,
    abrirLaApp: abrirLaApp,
    rpc: rpc,
    leer: leer,
    fotoPublica: fotoPublica,
    IOS: !!global.navigator && (/iPhone|iPad|iPod/i.test(global.navigator.userAgent) ||
      (/Macintosh/i.test(global.navigator.userAgent) && global.navigator.maxTouchPoints > 1)),
    ANDROID: !!global.navigator && /Android/i.test(global.navigator.userAgent)
  };
})(typeof window !== 'undefined' ? window : globalThis);
