import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  Res,
} from '@nestjs/common';
import { SubscriberService } from './subscriber.service';
import { validateUser } from 'src/validation/validation';
const CryptoJS = require('crypto-js');

@Controller('apiv2/newsletter-subscriber')
export class SubscriberController {
  constructor(private readonly subscriberService: SubscriberService) {}

  /* Público: alta de suscriptor */
  @Post()
  async create(@Body() body: any, @Res() res) {
    try {
      const subscriber = await this.subscriberService.create(body);
      return res.status(201).json(subscriber);
    } catch (error) {
      return res.status(error.status || 500).json({ error: error.message });
    }
  }

  /* Público: baja 1-click desde el enlace del correo */
  @Get('unsubscribe/:token')
  async unsubscribe(@Param('token') token: string, @Res() res) {
    try {
      const result = await this.subscriberService.unsubscribeByToken(token);
      return res.status(200).json(result);
    } catch (error) {
      return res.status(error.status || 500).json({ error: error.message });
    }
  }

  /* Admin: exportar CSV con BOM UTF-8. DEBE declararse antes de /:id */
  @Get('export')
  async exportCsv(@Res() res) {
    try {
      const _id = res.req.headers.authorization;
      // Sin cabecera, decrypt lanza y caeria al catch como 500: eso es 401.
      if (!_id) return res.status(401).json({ error: 'Unauthorized' });
      const idBytes = CryptoJS.AES.decrypt(_id, process.env.CRYPTO_KEY);
      const idDecrypted = idBytes.toString(CryptoJS.enc.Utf8);
      const auth0Token = await validateUser(idDecrypted, 'create:news');
      if (!auth0Token) return res.status(401).json({ error: 'Unauthorized' });

      const csv = await this.subscriberService.exportToCsv();
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="suscriptores-boletin.csv"',
      );
      return res.status(200).send('﻿' + csv);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  /* Admin: lista de suscriptores con búsqueda opcional */
  @Get()
  async findAll(@Query('search') search: string, @Res() res) {
    try {
      const _id = res.req.headers.authorization;
      // Sin cabecera, decrypt lanza y caeria al catch como 500: eso es 401.
      if (!_id) return res.status(401).json({ error: 'Unauthorized' });
      const idBytes = CryptoJS.AES.decrypt(_id, process.env.CRYPTO_KEY);
      const idDecrypted = idBytes.toString(CryptoJS.enc.Utf8);
      const auth0Token = await validateUser(idDecrypted, 'create:news');
      if (!auth0Token) return res.status(401).json({ error: 'Unauthorized' });
      const subscribers = await this.subscriberService.findAll(search);
      return res.status(200).json(subscribers);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  /* Admin: eliminar suscriptor */
  @Delete(':id')
  async remove(@Param('id') id: string, @Res() res) {
    try {
      const _id = res.req.headers.authorization;
      // Sin cabecera, decrypt lanza y caeria al catch como 500: eso es 401.
      if (!_id) return res.status(401).json({ error: 'Unauthorized' });
      const idBytes = CryptoJS.AES.decrypt(_id, process.env.CRYPTO_KEY);
      const idDecrypted = idBytes.toString(CryptoJS.enc.Utf8);
      const auth0Token = await validateUser(idDecrypted, 'create:news');
      if (!auth0Token) return res.status(401).json({ error: 'Unauthorized' });
      await this.subscriberService.remove(id);
      return res.status(200).json({ deleted: true });
    } catch (error) {
      return res.status(error.status || 500).json({ error: error.message });
    }
  }
}
