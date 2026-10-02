import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNewsletterDto, UpdateNewsletterDto } from './dto/newsletter.dto';
import sanitizeHtml from 'sanitize-html';

// Opciones de sanitización: permite formato de editor enriquecido, bloquea scripts y manejadores de eventos
const SANITIZE_OPTS: sanitizeHtml.IOptions = {
  allowedTags: [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'hr',
    'strong', 'b', 'em', 'i', 'u', 'strike', 's', 'del',
    'ul', 'ol', 'li', 'blockquote', 'pre', 'code',
    'a', 'img', 'figure', 'figcaption',
    'div', 'span', 'section', 'article', 'header', 'footer',
    'table', 'thead', 'tbody', 'tr', 'th', 'td', 'caption',
  ],
  allowedAttributes: {
    a: ['href', 'name', 'target', 'rel'],
    img: ['src', 'alt', 'width', 'height', 'style'],
    '*': ['class', 'style', 'id'],
    table: ['cellpadding', 'cellspacing', 'border', 'width', 'align'],
    td: ['colspan', 'rowspan', 'width', 'align', 'valign'],
    th: ['colspan', 'rowspan', 'width', 'align', 'valign'],
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  // Bloquea href con javascript:
  allowedSchemesByTag: { a: ['http', 'https', 'mailto'] },
};

@Injectable()
export class NewsletterService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateNewsletterDto) {
    try {
      return await this.prisma.newsletter.create({
        data: {
          ...dto,
          html: sanitizeHtml(dto.html, SANITIZE_OPTS),
          publishDate: dto.publishDate ? new Date(dto.publishDate) : undefined,
          scheduledSendDate: dto.scheduledSendDate
            ? new Date(dto.scheduledSendDate)
            : undefined,
        },
      });
    } catch (error) {
      throw new HttpException(
        error.message || 'Error al crear el boletín',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async update(id: string, dto: UpdateNewsletterDto) {
    try {
      return await this.prisma.newsletter.update({
        where: { id },
        data: {
          ...dto,
          html: dto.html ? sanitizeHtml(dto.html, SANITIZE_OPTS) : undefined,
          publishDate: dto.publishDate ? new Date(dto.publishDate) : undefined,
          // Distinguir "no viene" de "viene vacio": sin esto, mandar null para
          // quitar la programacion se traducia a undefined y la fecha se
          // quedaba puesta para siempre.
          scheduledSendDate:
            dto.scheduledSendDate === undefined
              ? undefined
              : dto.scheduledSendDate
                ? new Date(dto.scheduledSendDate)
                : null,
          updated_At: new Date(),
        },
      });
    } catch (error) {
      throw new HttpException(
        error.message || 'Error al actualizar el boletín',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /* Lista pública: solo published y sent */
  async findAll() {
    return this.prisma.newsletter.findMany({
      where: { state: { in: ['published', 'sent'] }, status: true },
      orderBy: { publishDate: 'desc' },
      select: {
        id: true, title: true, titleEn: true, subject: true,
        state: true, cover: true, tags: true, publishDate: true,
        sentAt: true, totalSent: true, totalOpened: true, totalClicks: true,
        created_At: true,
      },
    });
  }

  /* Lista admin: todos */
  async findAllAdmin() {
    return this.prisma.newsletter.findMany({
      orderBy: { created_At: 'desc' },
    });
  }

  /* Detalle público: 404 si no está published/sent */
  async findOne(id: string) {
    const item = await this.prisma.newsletter.findUnique({ where: { id } });
    if (!item || !['published', 'sent'].includes(item.state) || !item.status) {
      throw new HttpException('Boletín no encontrado', HttpStatus.NOT_FOUND);
    }
    return item;
  }

  async remove(id: string) {
    try {
      return await this.prisma.newsletter.delete({ where: { id } });
    } catch (error) {
      throw new HttpException(
        'Error al eliminar el boletín',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /* Stats: devuelve contadores y últimas aperturas/clics */
  async getStats(id: string) {
    const newsletter = await this.prisma.newsletter.findUnique({
      where: { id },
      select: {
        id: true, title: true, totalSent: true, totalOpened: true,
        totalClicks: true, sentAt: true, state: true,
      },
    });
    if (!newsletter) {
      throw new HttpException('Boletín no encontrado', HttpStatus.NOT_FOUND);
    }
    return newsletter;
  }

  /* Para el servicio de envío */
  async findForSend(id: string) {
    return this.prisma.newsletter.findUnique({ where: { id } });
  }

  /* Bloquea un reenvío inmediato fijando sentAt */
  async lockForSend(id: string) {
    return this.prisma.newsletter.update({
      where: { id },
      data: { sentAt: new Date() },
    });
  }

  /* Marca el boletín como enviado al terminar el proceso en segundo plano */
  async markSent(id: string, totalSent: number) {
    return this.prisma.newsletter.update({
      where: { id },
      data: { state: 'sent', totalSent, updated_At: new Date() },
    });
  }

  /* Cron: busca scheduledSendDate vencido y aún no enviado */
  async findDueScheduled() {
    return this.prisma.newsletter.findMany({
      where: {
        state: 'scheduled',
        scheduledSendDate: { lte: new Date() },
        sentAt: null,
      },
    });
  }

  /* Registrar apertura */
  async recordOpen(newsletterId: string, token?: string, ip?: string, ua?: string) {
    const subscriber = token
      ? await this.prisma.newsletterSubscriber.findUnique({
          where: { unsubscribeToken: token },
        })
      : null;

    await this.prisma.newsletterOpen.create({
      data: {
        newsletterId,
        subscriberId: subscriber?.id ?? null,
        ipAddress: ip ?? null,
        userAgent: ua ?? null,
      },
    });

    if (subscriber) {
      await this.prisma.newsletter.update({
        where: { id: newsletterId },
        data: { totalOpened: { increment: 1 } },
      });
    }
  }

  /* Registrar clic */
  async recordClick(newsletterId: string, url: string, token?: string, ip?: string, ua?: string) {
    const subscriber = token
      ? await this.prisma.newsletterSubscriber.findUnique({
          where: { unsubscribeToken: token },
        })
      : null;

    await this.prisma.newsletterClick.create({
      data: {
        newsletterId,
        url,
        subscriberId: subscriber?.id ?? null,
        ipAddress: ip ?? null,
        userAgent: ua ?? null,
      },
    });

    if (subscriber) {
      await this.prisma.newsletter.update({
        where: { id: newsletterId },
        data: { totalClicks: { increment: 1 } },
      });
    }
  }
}
