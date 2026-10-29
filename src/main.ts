// dotenv primero: los imports se ejecutan en orden y hay modulos que leen
// process.env al cargarse, no dentro de bootstrap (mail.module.ts arma el
// transporte SMTP ahi mismo). Antes AppModule se cargaba sin el .env leido.
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { json, urlencoded } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: true, // Permite todos los orígenes en desarrollo
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'user_id', 'Accept'],
    exposedHeaders: ['Content-Type'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });
  app.use(json({ limit: '200mb' }));
  app.use(urlencoded({ limit: '200mb', extended: true }));
  await app.listen(process.env.PORT || 3001, '0.0.0.0');
}
bootstrap();