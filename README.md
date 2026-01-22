<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="200" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://coveralls.io/github/nestjs/nest?branch=master" target="_blank"><img src="https://coveralls.io/repos/github/nestjs/nest/badge.svg?branch=master#9" alt="Coverage" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->


---

## Descripción

InstitucionalAPI es una aplicación backend desarrollada con NestJS y TypeScript. Permite consultar datos económicos y comerciales, como inversión extranjera directa y exportaciones, desde diferentes fuentes de datos SQL.

## Características

- Consulta de inversión extranjera directa por país, sector y año.
- Consulta de exportaciones por país y producto.
- Respuestas en formato HTML listas para integración con chatbots o aplicaciones web.
- Integración con múltiples bases de datos usando TypeORM.

## Instalación

```bash
npm install
```

## Ejecución

```bash
# Desarrollo
npm run start

# Modo watch
npm run start:dev

# Producción
npm run start:prod
```

## Pruebas

```bash
# Pruebas unitarias
npm run test

# Pruebas end-to-end
npm run test:e2e

# Cobertura de pruebas
npm run test:cov
```

## Variables de entorno

Este proyecto utiliza variables de entorno para la configuración de las conexiones a bases de datos y otros parámetros sensibles.  
**Asegúrate de definir tus variables de entorno de forma segura y nunca compartirlas públicamente ni subirlas al repositorio.**

## Endpoints principales

### Chatbot
- `/chatbot/ied-country` — IED por país y año
- `/chatbot/ied-sector` — IED por sector y año
- `/chatbot/exports-country` — Exportaciones por país y año
- `/chatbot/exports-product` — Exportaciones por producto y año

### Correos electrónicos
- `POST /apiv2/mail/contact` — Enviar formulario de contacto
- `POST /apiv2/mail/complaint` — Enviar denuncia
- `POST /apiv2/mail/servicesform` — Solicitar servicio
- `POST /apiv2/mail/feedback` — Enviar feedback (guarda en BD y notifica por email)

### Feedback
- `POST /apiv2/feedback` — Crear feedback (solo guarda en BD)
- `GET /apiv2/feedback/public` — Ver feedbacks públicos aprobados
- `GET /apiv2/feedback/admin/all` — Todos los feedbacks (admin)
- `GET /apiv2/feedback/admin/pending` — Feedbacks pendientes (admin)
- `PATCH /apiv2/feedback/admin/:id/approve` — Aprobar feedback (admin)
- `PATCH /apiv2/feedback/admin/:id/reject` — Rechazar feedback (admin)

## Sistema de Notificaciones de Feedback

### Descripción
El servicio de feedback envía correos electrónicos automáticos a los responsables cuando se recibe un nuevo feedback a través del endpoint `/apiv2/mail/feedback`.

### Configuración de correos responsables

Los correos de los responsables están configurados en `src/mail/mail.controller.ts`:

```typescript
const responsibleEmails = [
  'gestiondecalidad@prodominicana.gob.do',
  // Puedes agregar más correos aquí
];
```

### Funcionamiento

Cuando se envía un feedback mediante `POST /apiv2/mail/feedback`:

1. Se guarda el feedback en la base de datos
2. Se genera un código único de identificación
3. Se envían correos en paralelo a todos los responsables configurados

### Contenido del correo

El correo de notificación incluye:
- ✅ Código de feedback único
- ✅ Información del remitente (nombre y email)
- ✅ Calificación con estrellas (si existe)
- ✅ Tipo de servicio (si existe)
- ✅ Mensaje completo
- ✅ Fecha y hora de recepción
- ✅ Botón de acceso directo al panel de administración
- ✅ Footer con logo y redes sociales de ProDominicana

### Template de correo

El template HTML se encuentra en: `src/mail/templates/newFeedback.hbs`

### Arquitectura

El sistema de feedback sigue la misma arquitectura que los otros formularios (contact, complaint, servicesform):

```
Frontend → POST /apiv2/mail/feedback
         ↓
MailController.feedback()
         ↓
1. FeedbackService.create() → Guarda en BD
2. MailService.feedback() → Envía emails a responsables
```

### Manejo de errores

Si el envío de correo falla:
- ✅ Se registra el error en los logs
- ✅ El feedback se guarda correctamente aunque el correo falle

## Soporte y contacto

- Autor: ProDominicana
- Website: [https://nestjs.com](https://nestjs.com/)
- Twitter: [@nestframework](https://twitter.com/nestframework)

## Licencia

MIT