# InstitucionalAPI — Registro de cambios

## 2026-10-22 — Noticias Pro: script para volcar empleados internos al boletin

La editora pidio que los colaboradores reciban el boletin sin tener que
suscribirse. En la base no hay tabla de nomina, asi que la lista la entrega
RRHH en un CSV y este script la vuelca en `NewsletterSubscriber`.

- `importar-suscriptores.js` (raiz del repo, como `update-feedbacks.js`):
  `node importar-suscriptores.js empleados.csv` simula y
  `node importar-suscriptores.js empleados.csv --aplicar` da de alta.
- Lee CSV con coma o punto y coma, con cabecera o sin ella, y descarta el BOM
  de Excel. Busca las columnas "correo"/"email" y "nombre"/"name"; sin
  cabecera, correo en la primera columna y nombre en la segunda. No lee .xlsx.
- Normaliza el correo a minusculas y descarta duplicados e invalidos con el
  mismo `EMAIL_REGEX` de `subscriber.service.ts`.
- El alta va con `createMany` + `skipDuplicates` y no por
  `SubscriberService.create()`: ese metodo manda el correo de bienvenida, y
  estos empleados no se suscribieron. Decision del usuario.
- A quien esta dado de baja no lo reactiva, solo lo reporta. Reactivarlo seria
  devolverle un boletin que pidio no recibir.
- Idempotente: la segunda pasada inserta 0.

Verificado contra una base de usar y tirar con 7 filas sembradas (una ya
suscrita, una dada de baja, una repetida, una sin correo y una con correo
invalido): simula 2 altas, inserta 2, respeta la baja y la segunda pasada
inserta 0. El `unsubscribeToken` sale uuid de 36 caracteres.

Pendiente: ejecutarlo en produccion desde `/var/www/InstitucionalAPI`, para que
Prisma lea el `DATABASE_URL` de ese `.env`, cuando RRHH entregue el CSV.

## 2026-10-22 — Noticias Pro: la marca del correo y el titular en modo oscuro

**La marca.** El correo de bienvenida llevaba el logo de Noticias Pro en la
cabecera, pero el texto seguia diciendo Proeconomia: el remitente, el asunto,
el rotulo bajo el logo, el parrafo de confirmacion y el boton. El nombre de la
seccion es Noticias Pro desde el 2026-10-07 y el enlace /proeconomia solo
sobrevive como redireccion en el front.

- `newsletter-mail.service.ts`: el remitente pasa de `Proeconomia
  <no-reply@prodominicana.gob.do>` a `Noticias Pro <no-reply@...>` y el asunto
  a "Gracias por suscribirse al boletin de Noticias Pro".
- `newsletterWelcome.hbs`: titulo del documento, parrafo de confirmacion y
  boton ("Explorar Noticias Pro") con la marca correcta; el boton apunta ya a
  `/noticias-pro` y no a la redireccion. El rotulo bajo el logo pasa a "Boletin
  economico" en lugar de repetir la marca que el propio logo ya dice.
- `newsletter.hbs`: la plantilla de referencia tambien queda con el nombre
  nuevo.

**El titular en modo oscuro.** En Outlook movil con tema oscuro la tarjeta
blanca se invierte a gris oscuro, pero el titular conservaba el azul `#01296d`
del estilo en linea: azul oscuro sobre fondo oscuro, casi ilegible. Ahora el
correo declara `color-scheme` y `supported-color-schemes` en `light dark` y el
titular usa `#2B6CB0`, que se lee sobre el blanco original y sobre el gris que
impone el cliente.

Verificado: `tsc --noEmit` sin errores.

Pendiente: `wrapBrand()` en `newsletter-send.service.ts` arma cada edicion con
la misma tarjeta blanca y sin esas dos metas, asi que el boletin tiene todavia
el problema del modo oscuro.

## 2026-10-20 — Noticias Pro: el logo del cliente en los correos del boletin

**Correo de bienvenida.** `newsletterWelcome.hbs` pintaba el logo institucional
de ProDominicana en la cabecera azul, forzado a blanco con un filtro CSS. Ahora
pinta el logo de Noticias Pro en su version blanca,
`https://prodominicana.gob.do/images/noticias-pro/logo-correo-blanco.png`, en
PNG y no en SVG porque muchos clientes de correo no pintan SVG. La linea
"Boletin de Proeconomia" y el resto del correo no se tocan.

**Cada edicion del boletin.** El HTML que guarda el editor del panel es solo el
cuerpo: sin marca, sin ancho fijo y sin fondo, asi que la edicion llegaba como
texto suelto a todo lo ancho de la ventana. `newsletter-send.service.ts` lo
envuelve ahora en `wrapBrand()`: tarjeta de 600 px, cabecera azul `#01296d` con
el logo y el cuerpo dentro. El envoltorio se aplica despues de reescribir los
enlaces de seguimiento y antes de insertar el pixel de apertura, para que el
pixel siga entrando antes de `</body>`.

Verificado: `tsc --noEmit` sin errores y los dos correos pintados en el
navegador.

**Cada edicion lleva ya su enlace de baja.** Hasta ahora solo lo llevaba el
correo de bienvenida, que ademas promete "el enlace al pie de cada edicion del
boletin": el pie no existia. `wrapBrand()` recibe el token del suscriptor y
cierra el correo con el mismo pie oscuro del correo de bienvenida —direccion,
"Cancelar suscripcion" y el aviso de derechos—, apuntando a
`${API_BASE_URL}/apiv2/newsletter-subscriber/unsubscribe/<token>`.

El envoltorio se aplica **despues** de `rewriteLinks()`, asi que el enlace de
baja no pasa por el seguimiento de clics: se abre directo contra la API y no
cuenta como clic en la edicion.

## 2026-10-15 — Hasta cinco noticias destacadas

El encabezado de Noticias Pro pasa a ser un carrusel, asi que la destacada deja
de ser unica.

- `news-featured.service.ts`: `findFeatured` devuelve el arreglo de destacadas,
  ya aplanadas al idioma pedido y ordenadas por fecha descendente, en lugar de
  una sola noticia. `setFeatured` deja de desmarcar las demas y en su lugar
  comprueba el tope `TOPE_DESTACADAS` (5): si ya estan todas marcadas, devuelve
  `null` sin tocar nada.
- `news-featured.controller.ts`: ese `null` se traduce en **409** con el mensaje
  `Ya hay 5 noticias destacadas`, que el panel muestra tal cual. El resto del
  controlador no cambia: `GET apiv2/news/featured` sigue siendo publico y el
  `PATCH apiv2/news/:id/featured` sigue exigiendo `create:news`.

⚠️ `GET apiv2/news/featured` ahora responde un arreglo. Solo lo consume la
pagina de Noticias Pro, que ya esta preparada para los dos formatos, pero el
front conviene desplegarlo junto con la API.

Verificado contra la base de desarrollo: `npx tsc --noEmit` sin errores y el
endpoint devolviendo las cinco destacadas en el orden esperado.
## 2026-10-12 — Fuera el indicador de Flete maritimo

Se quita por decision suya: no hay fuente publica gratuita, asi que era el unico
que exigia carga manual permanente.

- `prisma/sql/proeconomia.sql`: la siembra ya no inserta la fila `freight`. Asi
  no reaparece al correr el script en otro entorno.
- `prisma/sql/proeconomia_vigencia.sql`: fuera el `UPDATE` que le ponia
  `maxAgeHours = 168`.
- Comentario de `economic-indicator.service.ts` al dia.

La fila de produccion **se queda**, por decision suya: no se borra nada. Quien
deja de pintarla es el front, que filtra esa clave en `IndicatorsRow.tsx`. Aqui
solo se quita de la siembra, para que no reaparezca en un entorno nuevo.

## 2026-10-12 — Euro y petroleo automaticos; el dolar pasa a compra y venta

Los cuatro indicadores de Noticias Pro llevaban en `0.00` desde que se sembraron
el 8-oct, con `updated_At` en nulo: nadie les habia escrito nunca, ni a mano ni
por codigo. En pantalla eso sale como "No disponible", que es lo que el equipo
reporto como "los commodities no funcionan".

**Euro** (`exchange-rate.service.ts`). El Banco Central SI publica euro, aunque
no en el endpoint del dolar: esta en la serie de tasas convertibles que alimenta
su pagina de historico.

    POST /Home/GetAllConvertibleExchangeRates
    {"FilterFrequency":"Diario","FilterCurrencies":[8],
     "FromDate":"...","ToDate":"...","SortBy":"ExchangeRateDate","SortOrder":"desc"}

`FilterCurrencies: [8]` es EURO; los codigos los da `POST /Home/GetExchangeCurrencies`.
⚠️ `SortOrder` **no se aplica**: la respuesta viene siempre ascendente, asi que el
dato vigente es el ultimo del arreglo, no el primero. Se pide una ventana de 15
dias porque el Banco Central publica con retraso y no publica fines de semana.

**Petroleo WTI** (`oil-price.service.ts`, nuevo). Del grafico publico de Yahoo
Finance, `CL=F`. ⚠️ Sin `user-agent` de navegador responde **429**.

**Dolar: ahora compra y venta**, en un solo valor con el formato `61.12 / 61.82`
y la nota "Compra / Venta". El modelo guarda un string, asi que no hizo falta
tocar el esquema ni el front.

⚠️ **Y cambia de fuente: ahora se lee de la PORTADA del sitio**, no de
`GetActualExchangeRate`. Ese endpoint responde **200 con el cuerpo vacio** cuando
se le llama desde Node, y responde bien al mismo tiempo desde `curl`. Se probaron
cookies, content-type, user-agent, x-requested-with, referer, accept-encoding,
HTTP/1.1 y HTTP/2, conexion sin keep-alive, `node:https` en vez de `fetch`, token
antiforgery y las dos paginas del sitio: ninguna cosa lo cambia. La portada si se
lee desde Node y trae las dos cifras rotuladas
(`<small>Compra</small><h5>61.1168</h5>`). Por eso tambien se dejo de depender de
sus cookies de sesion, que no hacian falta.

**El flete maritimo sigue manual**: no hay fuente publica gratuita (FBX y Drewry
son de pago). Se carga desde el panel.

Verificado contra la base local, con los cuatro en `0.00` antes de arrancar:
`nest build` 0, y tras el arranque `usd = 61.12 / 61.82`, `eur = 68.49`,
`oil = 93.71`, los tres con `stale: false` en `GET /apiv2/economic-indicator`.
`freight` queda en `0.00` y `stale: true`, como se espera.

⚠️ Los valores caducan a las 24 horas (`maxAgeHours`), asi que el cron de 4 horas
los mantiene vivos solos; el flete seguira venciendose cada dia hasta que alguien
lo teclee.

## 2026-10-12 — El anterior/siguiente ya no cruza entre Noticias y Noticias Pro

`getPrevNextNews` (`GET /apiv2/:lang/news/prnxt/:id`) recorria la lista completa,
asi que desde el detalle de una noticia institucional se podia llegar a una de
Noticias Pro y al contrario. Era el ultimo cruce que quedaba entre los dos
apartados; estaba anotado como pendiente en el registro del front del 8-oct.

Ahora se filtra la lista al mismo apartado que la noticia actual antes de buscar
el vecino, por el campo `seccion`, igual que hacen las dos paginas publicas.
Sin cambios de esquema ni de contrato: la respuesta sigue siendo
`{prev: {id, title}, next: {id, title}}`.

Verificado: `prisma generate` + `nest build` 0.

## 2026-10-08 (noche) — Tasa del dolar desde el Banco Central

`src/economic-indicator/exchange-rate.service.ts`: trabajo programado que
actualiza solo el indicador `usd`. Cada 4 horas y una vez al arrancar.

- **Via sin credenciales**, la que usa por dentro su propia pagina de tasas:
  `POST https://www.bancentral.gov.do/Home/GetActualExchangeRate`.
  ⚠️ Hay que pedir antes `/SectorExterno/HistoricoTasas` para recoger sus
  cookies de sesion: sin ellas responde **200 con el cuerpo vacio**.
  El otro host, `api.bancentral.gov.do`, SI exige credenciales.
- Toma la **tasa de venta**. Solo el dolar: el euro no sale por esta via y se
  sigue cargando a mano.
- **Si falla, no borra nada.** Deja el valor anterior y lo registra. Pasada su
  vigencia, el indicador se marca desactualizado solo, que es lo que se quiere.
- No es una API publicada, es la trastienda de una web: el dia que la cambien,
  dejara de traer datos. Por eso no se le da mas confianza de la que merece.

⛔ **No funciona todavia en produccion.** El FortiGate de la institucion tiene
`bancentral.gov.do` **bloqueado por categoria** (devuelve su "Fortiguard SDNS
Blocked Page"); desde el servidor, `curl` recibe un reset y Node da
`ECONNRESET`. Comprobado el 8-oct. El codigo queda listo y empezara a funcionar
el dia que redes abra esa salida, sin tocar nada.

## 2026-10-08 — Portadas diarias: sección

- `NewspaperCover` recibe la columna opcional `section`, que guarda la clave de
  la sección de Noticias Pro a la que pertenece la portada (`exportación`,
  `inversión`, `internacional`, `finanzas`). Sin valor, la portada sale en
  todas las secciones.
- Pasa por el DTO, el servicio y el controlador, en crear y en editar.
- SQL aditivo e idempotente en `prisma/sql/proeconomia_seccion_portadas.sql`.
  **Hay que correrlo en cada base antes de desplegar**, porque este repo no
  versiona `prisma/migrations`.

El enlace de la noticia **no** tocó la API: viaja dentro de `metadata` y
`findAll`/`findOneById` ya devuelven ese objeto entero.

Verificado: `nest build` 0.

## 2026-10-01 — Proeconomía / Radar Económico

Apartado nuevo bajo el menú Novedades de prodominicana.gob.do: boletín con
suscriptores y métricas propias, portadas diarias de periódicos, indicadores
del ticker económico y marca de noticia destacada.

Regla aplicada en todo el trabajo: **no se modifica código existente**. Se reusa
importando. Los archivos existentes que aparecen abajo solo reciben inserciones.

### Base de datos

`prisma/schema.prisma` (aditivo, 95 líneas):

- `Newsletter` — boletín. Un solo campo de contenido (`html`); en el proyecto de
  origen `content` y `html_content` guardaban lo mismo byte a byte.
- `NewsletterSubscriber` — lista propia, separada de `MeSubscriber` (Mujer
  Exporta): son dos públicos con consentimientos distintos.
- `NewsletterOpen`, `NewsletterClick` — métricas. Al enviar por el SMTP interno
  no hay proveedor que las reporte.
- `NewspaperCover`, `EconomicIndicator`.
- `News` gana `featured Boolean? @default(false)`.

`prisma/sql/proeconomia.sql` — **el repo no versiona `prisma/migrations`**, así
que el esquema se aplica a mano por base de datos, igual que `schedule_order.sql`:

    psql "$DATABASE_URL" -f prisma/sql/proeconomia.sql

Es aditivo e idempotente. Siembra las 4 filas del ticker con `ON CONFLICT DO
NOTHING`. Verificado: dos pasadas seguidas sin error y los indicadores siguen
siendo 4, no 8. **Hay que correrlo en pruebas y producción ANTES de desplegar.**

### Módulos nuevos

| Módulo | Qué hace |
|---|---|
| `src/newsletter/` | CRUD del boletín, envío en tandas de 25, cron cada 5 min para los programados, píxel de apertura y redirector de clics |
| `src/newsletter-subscriber/` | alta pública, baja 1-click por token, lista admin con buscador, exportación a CSV |
| `src/newspaper-cover/` | portadas diarias con subida de imagen |
| `src/economic-indicator/` | las 4 filas del ticker, solo se editan |
| `src/news-featured/` | noticia destacada, en módulo aparte para no tocar `src/news/` |

Plantillas nuevas en `src/mail/templates/`: `newsletterWelcome.hbs` y
`newsletter.hbs`.

El correo **reusa la infraestructura que ya existía**: `MailModule` pasa a
exportar `MailerModule` (una línea insertada en su array `exports`) y el boletín
inyecta `MailerService`. No hay transporter propio ni se repite la configuración
SMTP.

### Decisiones

- **Sin Mailchimp.** El correo sale por el SMTP interno, como el de Mujer Exporta.
  Por eso las métricas se cuentan aquí y no las reporta un proveedor.
- **Sin HMAC.** La baja usa `unsubscribeToken` UUID por suscriptor, el mismo
  patrón de `MeSubscriber`. En el proyecto de origen el HMAC estaba roto de punta
  a punta: el envío emitía `*|UNIQID|*` y el verificador esperaba otra cosa.
- Auth `create:news` en todos los mutadores, con el patrón inline de
  `src/section/section.controller.ts`. No se copió el de `gallery`, que lo tiene
  comentado.
- HTML del boletín sanitizado **al guardar**, no al renderizar.
- `setFeatured` va en transacción: un id inválido no puede dejar el sitio sin
  ninguna noticia destacada.
- El redirector de clics valida que el destino sea http/https, para no quedar
  como redirector abierto.
- `NewsFeaturedModule` se registra **antes que `NewsModule`** en `app.module.ts`:
  si no, el `GET news/:id` de noticias captura la ruta `news/featured`.
- `ScheduleModule` de `@nestjs/schedule` entra con alias `NestScheduleModule`,
  porque ya existe uno propio para la agenda.

### Archivos existentes tocados (solo inserciones)

- `prisma/schema.prisma` — los modelos nuevos
- `src/app.module.ts` — 13 líneas: los imports y las entradas del array
- `src/mail/mail.module.ts` — una línea: `exports: [MailService, MailerModule]`
- `package.json` / locks — `@nestjs/schedule`, `sanitize-html`

### Variables de entorno

**Ninguna nueva.** Se reusa `API_BASE_URL`, que ya existe y ya está configurada en
producción, con la misma convención de `src/qr-docs/qr-docs.controller.ts`: es el
host **sin** el prefijo `/apiv2`, que el código concatena. Por defecto
`https://prodominicana.gob.do`.

De ella salen el enlace de baja, el píxel de apertura y el redirector de clics
que viajan dentro de los correos.

⚠️ **Cambiarla después de un envío no arregla los correos que ya salieron.**

### Verificación hecha

- `npx prisma validate` — correcto
- `prisma/sql/proeconomia.sql` corrido dos veces contra la base local — idempotente
- `npx nest build` — exit 0
- `jest subscriber.service.spec --runInBand` — 6/6 pasan

### Pendiente

- Envío real a 2-3 correos propios: abrir el correo, pulsar el enlace de baja y
  comprobar que la apertura y un clic quedan contados.
- Programar un boletín y confirmar que el cron lo envía **una sola vez**.
- El modal del boletín no tiene campo de portada: `POST /newsletter` no define
  subida de imagen aunque el modelo tiene `cover`.
