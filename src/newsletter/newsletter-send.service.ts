import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NewsletterService } from './newsletter.service';
import { NewsletterMailService } from './newsletter-mail.service';
import { PrismaService } from '../prisma/prisma.service';

// Host publico de la API, sin el prefijo apiv2: misma convencion que
// qr-docs.controller.ts. Define a donde apuntan los enlaces de los correos ya
// enviados, asi que cambiarla despues de un envio no arregla los que salieron.
const API_BASE_URL = process.env.API_BASE_URL || 'https://prodominicana.gob.do';
const BATCH_SIZE = 25;
const BATCH_DELAY_MS = 500;

/* Reescribe los href=http/https a la URL de tracking de clics */
function rewriteLinks(html: string, nlId: string, token: string): string {
  return html.replace(/href="(https?:\/\/[^"]+)"/gi, (_, url) => {
    const encoded = encodeURIComponent(url);
    return `href="${API_BASE_URL}/apiv2/newsletter/${nlId}/ln?u=${encoded}&t=${token}"`;
  });
}

/* Inserta el píxel de apertura antes de </body> */
function insertPixel(html: string, nlId: string, token: string): string {
  const pixel = `<img src="${API_BASE_URL}/apiv2/newsletter/${nlId}/px/${token}" width="1" height="1" alt="" style="display:none">`;
  if (html.includes('</body>')) return html.replace('</body>', `${pixel}</body>`);
  return html + pixel;
}

/* Envuelve el contenido del editor en la cabecera de Noticias Pro. El editor
   solo devuelve el cuerpo del boletin, sin marca ni ancho fijo, asi que el
   correo llegaba como texto suelto a todo lo ancho. */
function wrapBrand(html: string, token: string): string {
  const logo = `${API_BASE_URL}/images/noticias-pro/logo-correo-blanco.png`;
  const baja = `${API_BASE_URL}/apiv2/newsletter-subscriber/unsubscribe/${token}`;
  return `<!doctype html><html lang="es"><body style="margin:0;padding:0;background-color:#F7F9FC;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#F7F9FC;"><tr><td align="center" style="padding:32px 16px;">
<table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width:600px;background-color:#ffffff;border-radius:16px;overflow:hidden;">
<tr><td style="background-color:#01296d;padding:28px 40px;text-align:center;">
<img src="${logo}" alt="Noticias Pro" width="220" style="max-width:220px;height:auto;">
</td></tr>
<tr><td style="padding:32px 40px;color:#4A5568;font-size:16px;line-height:1.7;">${html}</td></tr>
<tr><td style="background-color:#1A202C;padding:28px 40px;text-align:center;">
<p style="color:#CBD5E0;font-size:13px;margin:0 0 6px;">Centro de Exportación e Inversión de la República Dominicana</p>
<p style="color:#718096;font-size:12px;margin:0 0 16px;">Av. 27 de Febrero esq. Av. Gregorio Luperón, Santo Domingo, R.D.</p>
<p style="color:#718096;font-size:11px;margin:10px 0 0;border-top:1px solid #2D3748;padding-top:14px;">¿No desea recibir más este boletín? <a href="${baja}" style="color:#A0AEC0;text-decoration:underline;">Cancelar suscripción</a></p>
<p style="color:#718096;font-size:11px;margin:10px 0 0;">&copy; ${new Date().getFullYear()} ProDominicana. Todos los derechos reservados.</p>
</td></tr>
</table></td></tr></table></body></html>`;
}

/* Construye el HTML personalizado para un suscriptor */
function buildHtml(baseHtml: string, nlId: string, token: string): string {
  let html = rewriteLinks(baseHtml, nlId, token);
  html = wrapBrand(html, token);
  html = insertPixel(html, nlId, token);
  return html;
}

@Injectable()
export class NewsletterSendService {
  private readonly logger = new Logger(NewsletterSendService.name);

  constructor(
    private readonly newsletterService: NewsletterService,
    private readonly mailService: NewsletterMailService,
    private readonly prisma: PrismaService,
  ) {}

  /* Encola el envío: verifica guard, bloquea, responde de inmediato */
  async queueSend(id: string): Promise<{ queued: boolean; message: string }> {
    const newsletter = await this.newsletterService.findForSend(id);
    if (!newsletter) return { queued: false, message: 'Boletín no encontrado' };
    if (newsletter.sentAt) return { queued: false, message: 'El boletín ya fue enviado' };

    // Bloquear reenvíos fijando sentAt ahora
    await this.newsletterService.lockForSend(id);

    // Ejecutar en segundo plano sin bloquear la petición
    this._doSend(newsletter).catch((err) =>
      this.logger.error(`Error en envío en segundo plano (${id}): ${err.message}`),
    );

    return { queued: true, message: 'Envío en cola' };
  }

  /* Proceso real de envío en segundo plano */
  private async _doSend(newsletter: any): Promise<void> {
    const subscribers = await this.prisma.newsletterSubscriber.findMany({
      where: { status: true },
      select: { email: true, unsubscribeToken: true },
    });

    this.logger.log(`Enviando boletín "${newsletter.title}" a ${subscribers.length} suscriptores`);

    let sent = 0;

    for (let i = 0; i < subscribers.length; i += BATCH_SIZE) {
      const batch = subscribers.slice(i, i + BATCH_SIZE);

      const results = await Promise.allSettled(
        batch.map((sub) => {
          const personalizedHtml = buildHtml(newsletter.html, newsletter.id, sub.unsubscribeToken);
          return this.mailService.newsletterIssue(sub.email, newsletter.subject, personalizedHtml);
        }),
      );

      sent += results.filter((r) => r.status === 'fulfilled').length;
      const failed = results.filter((r) => r.status === 'rejected').length;
      if (failed > 0) this.logger.warn(`Tanda ${i / BATCH_SIZE + 1}: ${failed} errores`);

      // Pausa entre tandas, excepto la última
      if (i + BATCH_SIZE < subscribers.length) {
        await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY_MS));
      }
    }

    await this.newsletterService.markSent(newsletter.id, sent);
    this.logger.log(`Boletín "${newsletter.title}" enviado. Total: ${sent}`);
  }

  /* Cron cada 5 min: detecta boletines programados con fecha vencida */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async checkScheduled(): Promise<void> {
    const due = await this.newsletterService.findDueScheduled();
    for (const newsletter of due) {
      this.logger.log(`Cron: enviando boletín programado "${newsletter.title}"`);
      await this.queueSend(newsletter.id);
    }
  }
}
