import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NewsletterMailService } from '../newsletter/newsletter-mail.service';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

@Injectable()
export class SubscriberService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: NewsletterMailService,
  ) {}

  /* Alta de suscriptor. Reactiva si estaba dado de baja, 409 si ya está activo */
  async create(data: { email: string; name?: string }) {
    if (!data.email || !EMAIL_REGEX.test(data.email)) {
      throw new HttpException('Formato de email inválido', HttpStatus.BAD_REQUEST);
    }

    const existing = await this.prisma.newsletterSubscriber.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      if (!existing.status) {
        // Reactivar suscriptor dado de baja
        const reactivated = await this.prisma.newsletterSubscriber.update({
          where: { id: existing.id },
          data: {
            status: true,
            name: data.name ?? existing.name,
            unsubscribed_At: null,
            unsubscribeReason: null,
          },
        });
        await this.mailService.newsletterWelcome(
          reactivated.email,
          reactivated.name,
          reactivated.unsubscribeToken,
        );
        return reactivated;
      }

      throw new HttpException(
        'Este correo electrónico ya está registrado',
        HttpStatus.CONFLICT,
      );
    }

    const subscriber = await this.prisma.newsletterSubscriber.create({
      data: { email: data.email, name: data.name },
    });

    await this.mailService.newsletterWelcome(
      subscriber.email,
      subscriber.name,
      subscriber.unsubscribeToken,
    );

    return subscriber;
  }

  /* Baja por token — idempotente: si ya estaba dado de baja responde éxito */
  async unsubscribeByToken(token: string) {
    const subscriber = await this.prisma.newsletterSubscriber.findUnique({
      where: { unsubscribeToken: token },
    });

    if (!subscriber) {
      throw new HttpException('Token de cancelación inválido', HttpStatus.NOT_FOUND);
    }

    if (!subscriber.status) {
      return { success: true, message: 'La suscripción ya estaba cancelada' };
    }

    await this.prisma.newsletterSubscriber.update({
      where: { id: subscriber.id },
      data: { status: false, unsubscribed_At: new Date() },
    });

    return { success: true, message: 'Suscripción cancelada exitosamente' };
  }

  /* Lista admin con búsqueda opcional */
  async findAll(search?: string) {
    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' as const } },
        { email: { contains: search, mode: 'insensitive' as const } },
      ];
    }
    return this.prisma.newsletterSubscriber.findMany({
      where,
      orderBy: { created_At: 'desc' },
    });
  }

  /* CSV con BOM UTF-8 para compatibilidad con Excel */
  async exportToCsv(): Promise<string> {
    const rows = await this.prisma.newsletterSubscriber.findMany({
      orderBy: { created_At: 'desc' },
    });

    const headers = ['ID', 'Nombre', 'Email', 'Estado', 'Fecha de Registro', 'Fecha de Baja'];
    const lines = [headers.join(',')];

    for (const s of rows) {
      lines.push(
        [
          s.id,
          s.name ? `"${s.name.replace(/"/g, '""')}"` : '',
          s.email,
          s.status ? 'Activo' : 'Cancelado',
          s.created_At.toISOString(),
          s.unsubscribed_At ? s.unsubscribed_At.toISOString() : '',
        ].join(','),
      );
    }

    return lines.join('\n');
  }

  /* Eliminar suscriptor (admin) */
  async remove(id: string) {
    try {
      return await this.prisma.newsletterSubscriber.delete({ where: { id } });
    } catch (error) {
      throw new HttpException('Error al eliminar el suscriptor', HttpStatus.BAD_REQUEST);
    }
  }
}
