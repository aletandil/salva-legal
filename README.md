# salva-legal: el sitio de Salvá

Todo lo que se ve en **https://salvaapp.com.ar**: la portada, las páginas
legales y las páginas a las que llevan los links que manda la app. Es HTML,
CSS y un poco de JavaScript, sin build: lo que está en `main` es lo que se
publica.

Vive separado del repo de la app (`salva`) porque ese repo es privado y
GitHub Pages sobre un repo privado es pago. Es la **única** copia del sitio:
la app tenía una en `docs/web/` y se borró, porque estaba vieja y se podía
editar creyendo que era la web.

## Cómo se publica

- **Push a `main` → GitHub Pages lo publica.** No hay otro paso. Para
  trabajar, una rama y un merge a `main` cuando esté lista.
- `CNAME` tiene el dominio (`salvaapp.com.ar`). Si se borra, GitHub Pages
  deja de servir el dominio propio.
- `.nojekyll` hace que GitHub Pages publique `.well-known/` (sin él, Jekyll
  ignora las carpetas que empiezan con punto). No borrarlo.
- **Cloudflare** está delante: tiene el DNS del dominio y el reenvío de
  `soporte@salvaapp.com.ar`. Para las rutas `/oferta*`, `/comercio*`, `/hoy*` y `/sitemap.xml` hay
  además un Worker (código en el repo de la app, `cloudflare/compartir/`)
  que le pone a la página la vista previa de esa oferta o ese local para
  WhatsApp. Si el Worker y el proxy de Cloudflare ya están prendidos es un
  paso del dueño (punto 25 de `docs/pendientes-del-dueno.md` en la app).
- Las direcciones viejas de `aletandil.github.io/salva-legal/…` siguen
  andando: GitHub las redirige al dominio.

## Qué hay

**Marketing.** Se pueden cambiar con libertad (textos, diseño, imágenes):

| Archivo | Qué es |
|---|---|
| `index.html`, `portada.css`, `portada.js` | La portada |
| `para-comercios.html` | Todo para comercios: la promo, publicar, entregar, cobrar. Usa `portada.css` y `portada.js`. Se llama así y no `comercios.html` para no confundirse con `comercio.html` (la de un local) |
| `img/app/captura-*.webp` | Capturas de la app, de sus tests de capturas (`test/widget/capturas_del_sitio_test.dart`, con `--dart-define=CAPTURAS=<carpeta>`; salen en PNG a 786 de ancho y se pasan a webp con `cwebp`, la de 393 con `-resize 393 852`), con datos de ejemplo: una perfumería, una florería y un almacén, para que no parezca sólo comida. Cada una en claro y oscuro, a 786 y 393 de ancho |
| `404.html` | La página de "no está" |
| `estilo.css`, `fuentes/`, `img/`, íconos | Lo compartido |
| `tiendas.js` | La dirección de la ficha del App Store (`window.SALVA_APP_STORE`), en un solo lugar: la usan la portada y `para-comercios.html` (vía `portada.js`), `oferta.html`, `comercio.html`, `hoy.html`, `cuenta.html` y `404.html`. Lo único que la repite es el JSON-LD de `index.html`, que no puede leer JS, y el `href` inicial del botón del App Store en `hoy.html` y `comercio.html`, para quien no corre JS (el script lo pisa con el de acá) |
| `ofertas.js`, `ofertas.css` | Lo que comparten `hoy.html` y `comercio.html`: la tarjeta de oferta, la fila de local, los links a las tiendas con sus UTM y el pedido a la base. El HTML que arma `ofertas.js` es el mismo que arma el servidor (ver "Lo que cruza con el repo de la app") |
| `sitemap.xml`, `robots.txt` | Para buscadores |

**Legales.** Las lee Play y las linkea la app (`lib/core/config/sitio.dart`
en el repo de la app). Se puede cambiar el texto; **la ruta no**:

| Archivo | Qué es |
|---|---|
| `privacidad.html` | Política de privacidad. Si la app cambia qué datos usa, se actualiza acá y en el formulario de Seguridad de los datos de Play |
| `terminos.html` | Términos y condiciones |
| `eliminar-cuenta.html` | Cómo borrar la cuenta (Play la pide como URL pública) |

**Las que abre la app.** Cada una recibe parámetros que arma la app y salta
a la app con `salva://`. **No se les cambia la ruta, los parámetros ni la
lógica** sin cambiar la app a la vez: hay links ya mandados por WhatsApp y
por mail que las van a seguir abriendo, y teléfonos con versiones viejas de
la app. El diseño se puede tocar.

| Página | Quién la abre | Qué hace |
|---|---|---|
| `oferta.html?id=…` | Link de "Compartir oferta" | Muestra la oferta y lleva a la app, a Play o, en iPhone, al App Store |
| `comercio.html?id=…` | Link de un local y el QR del cartel | Muestra el local con sus ofertas abiertas y lleva a la app, a Play o al App Store |
| `hoy.html?ciudad=…` y `/hoy/<ciudad>` | "Compartir las ofertas de hoy" (el slug de la ciudad); `/hoy/tandil` es la dirección para la bio de Instagram y la prensa, que resuelve el Worker | Muestra las ofertas vigentes y los locales de la ciudad y lleva a la app, a Play o al App Store. `/hoy` solo, la lista de ciudades |
| `retiro.html#…` | "Retira otra persona" | Muestra el código y el QR de una compra |
| `equipo.html#…` | Invitación al equipo de un local | Abre la app con la invitación |
| `cuenta.html?tipo=…` | Links de los mails de cuenta (Supabase) | Dice si la cuenta quedó confirmada o la contraseña cambiada y abre la app |
| `volver.html` | Vuelta de Mercado Pago después de pagar | Pasa la consulta a `salva://pago` |
| `vinculado.html` | Vuelta de vincular Mercado Pago | Le pasa el resultado a la app |

Las que no tienen nada que mostrar a un buscador llevan `noindex`; `robots.txt`
explica por qué no se bloquean ahí.

`oferta.html`, `hoy.html`, `comercio.html` (vía `ofertas.js`) y `retiro.html` leen de Supabase con la URL del proyecto y la
clave **pública**: lo que se puede leer con ella lo decide la base. Nunca va
acá la `service_role`.

**No tocar:**

- `img/generica/`: copia de las fotos de ejemplo de la app
  (`assets/images/generica/` en el repo de la app). Cuando una oferta usa
  una, la vista previa del link (Edge Function `compartir`) la baja de acá
  por su nombre. Si la app suma o renombra una, se copia también acá; sin
  ella, la tarjeta sale con el arte del rubro.
- `.well-known/assetlinks.json`: la huella de la firma de Play para que
  Android abra los links en la app (App Links) y recupere la sesión en un
  teléfono nuevo. Un error acá y los links abren el navegador.
- `img/logo-mail.png`: el logo de los mails de cuenta. Las plantillas de
  Supabase (`supabase/templates/` en la app) lo cargan de
  `https://salvaapp.com.ar/img/logo-mail.png`; moverlo o renombrarlo rompe el
  logo de todos los mails, también de los que ya están en las bandejas.
- `compartir.jpg`: la vista previa genérica de los links; la Edge Function
  `compartir` de la app la nombra por su dirección.

## Previsualizar en la compu

```bash
python3 -m http.server 8000
```

y abrir <http://localhost:8000>. Las páginas que abre la app necesitan sus
parámetros (por ejemplo `oferta.html?id=<id de una oferta publicada>`) y
leen de la base de producción.

## Lo que cruza con el repo de la app

- **`oferta.html`, `comercio.html`, `hoy.html` y `ofertas.js` tienen una copia** en la app, en
  `supabase/functions/compartir/testdata/`, para los tests que comprueban que
  la vista previa y la lista se inyectan bien en las páginas de verdad, y que
  `ofertas.js` arma exactamente el mismo HTML que `contenido.ts` (la función
  `compartir`). Si cambian acá, hay que volver a copiarlas allá.
- **Indexación (1880 en la app).** Google lee lo que llega en el HTML: el
  Worker pone entre las marcas `<!-- contenido -->` de `hoy.html` y
  `comercio.html` la lista ya armada, la dirección canónica y el JSON-LD
  (`ItemList`, `Product`/`Offer`, `LocalBusiness`). Las marcas no se borran.
  Las rutas de estas páginas van con `/` adelante (`/estilo.css`): la misma
  página se sirve como `/hoy/tandil`.
- **`sitemap.xml`** tiene las páginas fijas; el Worker le suma al servirlo
  cada ciudad (`/hoy/<slug>`) y cada local, desde la base.
- El archivo de Universal Links de iOS (`apple-app-site-association`) está
  preparado en la app, en `docs/ios/`, esperando el Team ID. Cuando se
  publique va en `.well-known/`, sin extensión.

## Pendiente de decisión

`terminos.html` dice que Salvá cobra una **comisión del 15 %** por venta, y
la app también habla de comisión. El dueño todavía no definió el modelo
comercial (comisión por venta, plan mensual o los dos): la portada, a
propósito, no promete ninguno. Si se decide otra cosa, cambian los términos
y la app juntos.

Lo que sí está decidido es la promo de lanzamiento: los primeros 2 meses de
cada local, desde que se aprueba, sin comisión (en la app, la migración
1240). La portada y `para-comercios.html` la dicen, sin el porcentaje de
después: 2 meses desde que se aprueba el local, sin comisión de Salvá también
en lo cobrado en el mostrador, y Mercado Pago cobra lo suyo aparte. El código
no tiene fecha límite para sumarse, así que el sitio no promete ninguna.

Las funciones nuevas que cuenta el sitio (mapa, alertas, "Mis productos",
"Por vencer", modo mostrador, "Tu año salvando"…) están en la app; antes de
publicar el sitio, que la versión de la app que las trae y sus migraciones
estén en producción.
