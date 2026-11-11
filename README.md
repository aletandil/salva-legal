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
  `soporte@salvaapp.com.ar`. Para las rutas `/oferta*`, `/comercio*` y `/hoy*` hay
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
| `404.html` | La página de "no está" |
| `estilo.css`, `fuentes/`, `img/`, íconos | Lo compartido |
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
| `oferta.html?id=…` | Link de "Compartir oferta" | Muestra la oferta y lleva a la app o a Play |
| `comercio.html?id=…` | Link de un local y el QR del cartel | Muestra el local y lleva a la app o a Play |
| `hoy.html?ciudad=…` | "Compartir las ofertas de hoy" (el slug de la ciudad) | Muestra las ofertas vigentes de la ciudad y lleva a la app o a Play |
| `retiro.html#…` | "Retira otra persona" | Muestra el código y el QR de una compra |
| `equipo.html#…` | Invitación al equipo de un local | Abre la app con la invitación |
| `cuenta.html?tipo=…` | Links de los mails de cuenta (Supabase) | Dice si la cuenta quedó confirmada o la contraseña cambiada y abre la app |
| `volver.html` | Vuelta de Mercado Pago después de pagar | Pasa la consulta a `salva://pago` |
| `vinculado.html` | Vuelta de vincular Mercado Pago | Le pasa el resultado a la app |

Las que no tienen nada que mostrar a un buscador llevan `noindex`; `robots.txt`
explica por qué no se bloquean ahí.

`oferta.html`, `hoy.html` y `retiro.html` leen de Supabase con la URL del proyecto y la
clave **pública**: lo que se puede leer con ella lo decide la base. Nunca va
acá la `service_role`.

**No tocar:**

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

- **`oferta.html`, `comercio.html` y `hoy.html` tienen una copia** en la app, en
  `supabase/functions/compartir/testdata/`, para el test que comprueba que
  la vista previa se inyecta bien en las páginas de verdad. Si cambian acá,
  hay que volver a copiarlas allá.
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
1240). La portada la dice, sin el porcentaje de después.
