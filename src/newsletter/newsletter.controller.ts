import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Res,
} from '@nestjs/common';
import { NewsletterService } from './newsletter.service';
import { NewsletterSendService } from './newsletter-send.service';
import { CreateNewsletterDto, UpdateNewsletterDto } from './dto/newsletter.dto';
import { validateUser } from 'src/validation/validation';
const CryptoJS = require('crypto-js');

@Controller('apiv2/newsletter')
export class NewsletterController {
  constructor(
    private readonly newsletterService: NewsletterService,
    private readonly sendService: NewsletterSendService,
  ) {}

  /* Admin: todos los boletines. DEBE declararse antes de :id */
  @Get('admin')
  async findAllAdmin(@Res() res) {
    try {
      const _id = res.req.headers.authorization;
      // Sin cabecera, decrypt lanza y caeria al catch como 500: eso es 401.
      if (!_id) return res.status(401).json({ error: 'Unauthorized' });
      const idBytes = CryptoJS.AES.decrypt(_id, process.env.CRYPTO_KEY);
      const idDecrypted = idBytes.toString(CryptoJS.enc.Utf8);
      const auth0Token = await validateUser(idDecrypted, 'create:news');
      if (!auth0Token) return res.status(401).json({ error: 'Unauthorized' });
      const items = await this.newsletterService.findAllAdmin();
      return res.status(200).json(items);
    } catch (error) {
      return res.status(500).json({ error });
    }
  }

  /* Público: solo published y sent */
  @Get()
  async findAll(@Res() res) {
    try {
      const items = await this.newsletterService.findAll();
      return res.status(200).json(items);
    } catch (error) {
      return res.status(500).json({ error });
    }
  }

  /* Público: detalle — 404 si no está published/sent */
  @Get(':id')
  async findOne(@Param('id') id: string, @Res() res) {
    try {
      const item = await this.newsletterService.findOne(id);
      return res.status(200).json(item);
    } catch (error) {
      return res.status(error.status || 404).json({ error: error.message });
    }
  }

  @Post()
  async create(@Body() dto: CreateNewsletterDto, @Res() res) {
    try {
      const _id = res.req.headers.authorization;
      // Sin cabecera, decrypt lanza y caeria al catch como 500: eso es 401.
      if (!_id) return res.status(401).json({ error: 'Unauthorized' });
      const idBytes = CryptoJS.AES.decrypt(_id, process.env.CRYPTO_KEY);
      const idDecrypted = idBytes.toString(CryptoJS.enc.Utf8);
      const auth0Token = await validateUser(idDecrypted, 'create:news');
      if (!auth0Token) return res.status(401).json({ error: 'Unauthorized' });
      const item = await this.newsletterService.create(dto);
      return res.status(201).json(item);
    } catch (error) {
      return res.status(error.status || 500).json({ error: error.message });
    }
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateNewsletterDto, @Res() res) {
    try {
      const _id = res.req.headers.authorization;
      // Sin cabecera, decrypt lanza y caeria al catch como 500: eso es 401.
      if (!_id) return res.status(401).json({ error: 'Unauthorized' });
      const idBytes = CryptoJS.AES.decrypt(_id, process.env.CRYPTO_KEY);
      const idDecrypted = idBytes.toString(CryptoJS.enc.Utf8);
      const auth0Token = await validateUser(idDecrypted, 'create:news');
      if (!auth0Token) return res.status(401).json({ error: 'Unauthorized' });
      const item = await this.newsletterService.update(id, dto);
      return res.status(200).json(item);
    } catch (error) {
      return res.status(error.status || 500).json({ error: error.message });
    }
  }

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
      await this.newsletterService.remove(id);
      return res.status(200).json({ deleted: true });
    } catch (error) {
      return res.status(error.status || 500).json({ error: error.message });
    }
  }

  /* Encola el envío inmediatamente y responde sin esperar */
  @Post(':id/send')
  async send(@Param('id') id: string, @Res() res) {
    try {
      const _id = res.req.headers.authorization;
      // Sin cabecera, decrypt lanza y caeria al catch como 500: eso es 401.
      if (!_id) return res.status(401).json({ error: 'Unauthorized' });
      const idBytes = CryptoJS.AES.decrypt(_id, process.env.CRYPTO_KEY);
      const idDecrypted = idBytes.toString(CryptoJS.enc.Utf8);
      const auth0Token = await validateUser(idDecrypted, 'create:news');
      if (!auth0Token) return res.status(401).json({ error: 'Unauthorized' });
      const result = await this.sendService.queueSend(id);
      return res.status(result.queued ? 202 : 409).json(result);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  @Get(':id/stats')
  async stats(@Param('id') id: string, @Res() res) {
    try {
      const _id = res.req.headers.authorization;
      // Sin cabecera, decrypt lanza y caeria al catch como 500: eso es 401.
      if (!_id) return res.status(401).json({ error: 'Unauthorized' });
      const idBytes = CryptoJS.AES.decrypt(_id, process.env.CRYPTO_KEY);
      const idDecrypted = idBytes.toString(CryptoJS.enc.Utf8);
      const auth0Token = await validateUser(idDecrypted, 'create:news');
      if (!auth0Token) return res.status(401).json({ error: 'Unauthorized' });
      const stats = await this.newsletterService.getStats(id);
      return res.status(200).json(stats);
    } catch (error) {
      return res.status(error.status || 500).json({ error: error.message });
    }
  }
}
