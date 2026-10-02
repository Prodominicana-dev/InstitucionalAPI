import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

const FROM = 'Proeconomía <no-reply@prodominicana.gob.do>';

/* Host publico de la API, sin el prefijo apiv2: misma convencion que
   qr-docs.controller.ts. */
function unsubscribeUrl(token: string): string {
  const base = process.env.API_BASE_URL || 'https://prodominicana.gob.do';
  return `${base}/apiv2/newsletter-subscriber/unsubscribe/${token}`;
}

@Injectable()
export class NewsletterMailService {
  private readonly logger = new Logger(NewsletterMailService.name);

  constructor(private readonly mailerService: MailerService) {}

  /* Correo de bienvenida al nuevo suscriptor del boletín */
  async newsletterWelcome(email: string, name: string, token: string): Promise<void> {
    try {
      await this.mailerService.sendMail({
        from: FROM,
        to: email,
        subject: 'Gracias por suscribirse al boletín de Proeconomía',
        template: './newsletterWelcome',
        context: {
          name: name ?? email,
          unsubscribeUrl: unsubscribeUrl(token),
          year: new Date().getFullYear(),
        },
      });
    } catch (error) {
      this.logger.error(`Error al enviar bienvenida a ${email}: ${error.message}`);
    }
  }

  /* Envía una edición del boletín. El html ya viene personalizado con el píxel
     y los enlaces reescritos, por eso va directo y no como plantilla: el
     contenido del boletín puede traer llaves dobles y romper Handlebars. */
  async newsletterIssue(email: string, subject: string, html: string): Promise<void> {
    await this.mailerService.sendMail({ from: FROM, to: email, subject, html });
  }
}
