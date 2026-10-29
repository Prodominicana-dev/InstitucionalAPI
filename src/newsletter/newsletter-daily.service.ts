import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { NewsletterSendService } from './newsletter-send.service';

// Host publico de la API, sin el prefijo apiv2: misma convencion que
// newsletter-send.service.ts.
const SITE_URL = process.env.API_BASE_URL || 'https://prodominicana.gob.do';
const PAGINA = `${SITE_URL}/noticias-pro`;
const ZONA = 'America/Santo_Domingo';
// Marca las ediciones que crea este servicio. Sirve para encontrar la anterior
// y para no crear dos el mismo dia.
const TAG_DIARIO = 'diario';

/* Cuerpo del correo: solo lleva al apartado, donde estan todas las noticias
   del dia. Va en usted. El enlace lo reescribe el servicio de envio a la URL
   de seguimiento, asi que los clics se cuentan igual que en una edicion
   escrita a mano. */
function cuerpo(): string {
  return `<p style="margin:0 0 16px;">Buenos días,</p>
<p style="margin:0 0 24px;">Ya están disponibles las noticias económicas más recientes en Noticias Pro.</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
<tr><td align="center" bgcolor="#01296d" style="border-radius:8px;">
<a href="${PAGINA}" style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;">Ver las noticias de hoy</a>
</td></tr></table>
<p style="margin:24px 0 0;font-size:14px;">También puede entrar directamente en <a href="${PAGINA}" style="color:#2B6CB0;">prodominicana.gob.do/noticias-pro</a>.</p>`;
}

/* Fecha en hora de República Dominicana. El servidor puede estar en UTC. */
function diaRD(fecha: Date): string {
  return fecha.toLocaleDateString('es-DO', { timeZone: ZONA });
}

function fechaLarga(fecha: Date): string {
  return fecha.toLocaleDateString('es-DO', {
    timeZone: ZONA,
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

interface EstadoDiario {
  yaExisteHoy: boolean;
  desde: Date;
  noticiasNuevas: number;
  enviaria: boolean;
}

@Injectable()
export class NewsletterDailyService {
  private readonly logger = new Logger(NewsletterDailyService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly sendService: NewsletterSendService,
  ) {}

  /* De lunes a viernes a las 9:00 de la mañana, hora de RD. El fin de semana
     no se publican noticias, así que tampoco sale boletín. */
  @Cron('0 9 * * 1-5', { timeZone: ZONA })
  async enviarEdicionDiaria(): Promise<void> {
    const ahora = new Date();
    const { yaExisteHoy, desde, noticiasNuevas: nuevas } =
      await this.calcular(ahora);

    // Ya existe la edición de hoy: el cron se disparó dos veces o el proceso
    // se reinició a las 9:00. No se crea otra.
    if (yaExisteHoy) {
      this.logger.log('Edición diaria: la de hoy ya existe, no se crea otra');
      return;
    }

    // Sin noticias nuevas el correo no tiene nada que anunciar.
    if (nuevas === 0) {
      this.logger.log(
        `Edición diaria: ninguna noticia nueva desde ${desde.toISOString()}, no se envía`,
      );
      return;
    }

    // Se crea 'scheduled' con la fecha de ahora: si el proceso muere entre la
    // creación y el envío, el cron de cada 5 minutos la recoge igual.
    const newsletter = await this.prisma.newsletter.create({
      data: {
        title: `Noticias Pro — ${fechaLarga(ahora)}`,
        subject: 'Las noticias económicas de hoy en Noticias Pro',
        html: cuerpo(),
        state: 'scheduled',
        tags: [TAG_DIARIO],
        publishDate: ahora,
        scheduledSendDate: ahora,
      },
    });

    const resultado = await this.sendService.queueSend(newsletter.id);
    this.logger.log(
      `Edición diaria ${newsletter.id} (${nuevas} noticias nuevas): ${resultado.message}`,
    );
  }

  /* Qué haría el envío diario si se disparara ahora mismo, sin crear ni mandar
     nada. Lo usa el panel para comprobar que mañana va a salir. */
  async estado(): Promise<EstadoDiario> {
    return this.calcular(new Date());
  }

  private async calcular(ahora: Date): Promise<EstadoDiario> {
    const anterior = await this.prisma.newsletter.findFirst({
      where: { tags: { has: TAG_DIARIO } },
      orderBy: { created_At: 'desc' },
    });

    const yaExisteHoy = Boolean(
      anterior?.created_At && diaRD(anterior.created_At) === diaRD(ahora),
    );
    const desde =
      anterior?.created_At ?? new Date(ahora.getTime() - 24 * 60 * 60 * 1000);
    const noticiasNuevas = await this.contarNoticiasNuevas(desde);

    return {
      yaExisteHoy,
      desde,
      noticiasNuevas,
      enviaria: !yaExisteHoy && noticiasNuevas > 0,
    };
  }

  /* Noticias de Noticias Pro creadas desde la edición anterior. El apartado se
     distingue por el campo seccion dentro de metadata, igual que en
     news.service.ts; se filtra en memoria porque metadata es Json[]. */
  private async contarNoticiasNuevas(desde: Date): Promise<number> {
    const news = await this.prisma.news.findMany({
      where: { status: true, created_At: { gte: desde } },
      select: { metadata: true },
    });

    return news.filter((n: any) =>
      (n.metadata ?? []).some((m: any) => m && m.seccion),
    ).length;
  }
}
