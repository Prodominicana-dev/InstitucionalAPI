# InstitucionalAPI — Registro de cambios

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
