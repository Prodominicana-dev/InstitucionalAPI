import { Controller, Get, Param, Query, Req, Res } from '@nestjs/common';
import { NewsletterService } from './newsletter.service';

// GIF transparente 1x1 en base64
const PIXEL_GIF = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64',
);

@Controller('apiv2/newsletter')
export class NewsletterTrackingController {
  constructor(private readonly newsletterService: NewsletterService) {}

  /* Píxel de apertura — siempre responde 200 para no filtrar existencia de correos */
  @Get(':id/px/:token')
  async pixel(
    @Param('id') id: string,
    @Param('token') token: string,
    @Req() req,
    @Res() res,
  ) {
    // Registrar de forma asíncrona, no bloquea la respuesta del píxel
    this.newsletterService
      .recordOpen(id, token, req.ip, req.headers['user-agent'])
      .catch(() => null);

    res.setHeader('Content-Type', 'image/gif');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    return res.status(200).send(PIXEL_GIF);
  }

  /* Redirector de clics — valida que la URL destino sea http/https */
  @Get(':id/ln')
  async link(
    @Param('id') id: string,
    @Query('u') url: string,
    @Query('t') token: string,
    @Req() req,
    @Res() res,
  ) {
    if (!url) return res.status(400).json({ error: 'Parámetro u requerido' });

    // Prevenir redirector abierto: solo http y https
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return res.status(400).json({ error: 'URL inválida' });
    }

    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return res.status(400).json({ error: 'URL no permitida' });
    }

    // Registrar clic en segundo plano
    this.newsletterService
      .recordClick(id, url, token, req.ip, req.headers['user-agent'])
      .catch(() => null);

    return res.redirect(302, url);
  }
}
