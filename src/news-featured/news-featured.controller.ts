import {
  Query,
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Res,
} from '@nestjs/common';
import { NewsFeaturedService } from './news-featured.service';
import { validateUser } from 'src/validation/validation';
import { Response } from 'express';

const CryptoJS = require('crypto-js');

// IMPORTANTE: este controller debe registrarse ANTES que NewsModule en app.module.ts
// para que GET apiv2/news/featured no sea capturado por el param :id del NewsController.
@Controller('apiv2/')
export class NewsFeaturedController {
  constructor(private readonly newsFeaturedService: NewsFeaturedService) {}

  // Obtener la noticia destacada vigente (sin autenticación)
  @Get('news/featured')
  async getFeatured(@Res() res: Response, @Query('lang') lang = 'es') {
    try {
      const news = await this.newsFeaturedService.findFeatured(lang);
      return res.status(200).json(news);
    } catch (error) {
      return res.status(500).json({ error });
    }
  }

  // Marcar o desmarcar una noticia como destacada
  @Patch('news/:id/featured')
  async setFeatured(
    @Param('id') id: string,
    @Body() body: { featured: boolean },
    @Res() res: Response,
  ) {
    try {
      const _id = res.req.headers.authorization;
      // Sin cabecera, decrypt lanza y caeria al catch como 500: eso es 401.
      if (!_id) return res.status(401).json({ error: 'Unauthorized' });
      const idBytes = CryptoJS.AES.decrypt(_id, process.env.CRYPTO_KEY);
      const idDecrypted = idBytes.toString(CryptoJS.enc.Utf8);
      const auth0Token = await validateUser(idDecrypted, 'create:news');
      if (!auth0Token) return res.status(401).json({ error: 'Unauthorized' });
      const news = await this.newsFeaturedService.setFeatured(id, body.featured);
      return res.status(200).json(news);
    } catch (error) {
      return res.status(500).json({ error });
    }
  }
}
