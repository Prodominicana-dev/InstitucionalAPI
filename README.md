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

- `/chatbot/ied-country` — IED por país y año
- `/chatbot/ied-sector` — IED por sector y año
- `/chatbot/exports-country` — Exportaciones por país y año
- `/chatbot/exports-product` — Exportaciones por producto y año

## Soporte y contacto

- Autor: ProDominicana
- Website: [https://nestjs.com](https://nestjs.com/)
- Twitter: [@nestframework](https://twitter.com/nestframework)

## Licencia

MIT