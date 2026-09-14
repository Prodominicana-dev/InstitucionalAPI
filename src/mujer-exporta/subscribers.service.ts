import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { MeSubscriber } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';

@Injectable()
export class SubscribersService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  /* Crear suscriptor */
  async create(data: any): Promise<MeSubscriber> {
    try {
      // Verificar si ya existe el email
      const existing = await this.prisma.meSubscriber.findUnique({
        where: { email: data.email },
      });

      if (existing) {
        // Si existe pero está cancelado, reactivarlo
        if (!existing.status) {
          const reactivated = await this.prisma.meSubscriber.update({
            where: { email: data.email },
            data: {
              status: true,
              name: data.name,
              company: data.company,
              phone: data.phone,
              sector: data.sector,
              unsubscribed_At: null,
            },
          });

          // Enviar correo de bienvenida
          await this.mailService.meWelcome(reactivated.email, reactivated.name);

          return reactivated;
        }

        throw new HttpException(
          'Este correo electrónico ya está registrado',
          HttpStatus.CONFLICT,
        );
      }

      const subscriber = await this.prisma.meSubscriber.create({
        data: {
          name: data.name,
          email: data.email,
          company: data.company,
          phone: data.phone,
          sector: data.sector,
        },
      });

      // Enviar correo de bienvenida
      await this.mailService.meWelcome(subscriber.email, subscriber.name);

      return subscriber;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        error.message || 'Error al registrar el suscriptor',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /* Cancelar suscripción por token (público) */
  async unsubscribeByToken(token: string): Promise<{ success: boolean; message: string }> {
    try {
      const subscriber = await this.prisma.meSubscriber.findUnique({
        where: { unsubscribeToken: token },
      });

      if (!subscriber) {
        throw new HttpException('Token de cancelación inválido', HttpStatus.NOT_FOUND);
      }

      if (!subscriber.status) {
        return { success: true, message: 'La suscripción ya estaba cancelada' };
      }

      await this.prisma.meSubscriber.update({
        where: { id: subscriber.id },
        data: {
          status: false,
          unsubscribed_At: new Date(),
        },
      });

      // Enviar correo de confirmación de cancelación
      await this.mailService.meUnsubscribe(subscriber.email, subscriber.name);

      return { success: true, message: 'Suscripción cancelada exitosamente' };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException('Error al cancelar la suscripción', HttpStatus.BAD_REQUEST);
    }
  }

  /* Eliminar suscriptor (admin) */
  async delete(id: string): Promise<MeSubscriber> {
    try {
      return await this.prisma.meSubscriber.delete({ where: { id } });
    } catch (error) {
      throw new HttpException('Error al eliminar el suscriptor', HttpStatus.BAD_REQUEST);
    }
  }

  /* Obtener todos los suscriptores (Admin) */
  async findAll(search?: string): Promise<MeSubscriber[]> {
    try {
      const where: any = {};

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' as const } },
          { email: { contains: search, mode: 'insensitive' as const } },
          { company: { contains: search, mode: 'insensitive' as const } },
          { sector: { contains: search, mode: 'insensitive' as const } },
        ];
      }

      return await this.prisma.meSubscriber.findMany({
        where,
        orderBy: { created_At: 'desc' },
      });
    } catch (error) {
      throw new HttpException('Error al obtener los suscriptores', HttpStatus.BAD_REQUEST);
    }
  }

  /* Obtener suscriptores activos para enviar notificaciones */
  async getActiveSubscribers(): Promise<Array<{ email: string; name: string; unsubscribeToken: string }>> {
    try {
      return await this.prisma.meSubscriber.findMany({
        where: { status: true },
        select: {
          email: true,
          name: true,
          unsubscribeToken: true,
        },
      });
    } catch (error) {
      throw new HttpException('Error al obtener suscriptores activos', HttpStatus.BAD_REQUEST);
    }
  }

  /* Exportar suscriptores a CSV */
  async exportToCsv(): Promise<string> {
    try {
      const subscribers = await this.prisma.meSubscriber.findMany({
        orderBy: { created_At: 'desc' },
      });

      // Crear cabeceras CSV
      const headers = ['ID', 'Nombre', 'Email', 'Empresa', 'Teléfono', 'Sector', 'Estado', 'Fecha de Registro', 'Fecha de Cancelación'];
      const csvRows = [headers.join(',')];

      // Agregar filas de datos
      for (const sub of subscribers) {
        const row = [
          sub.id,
          `"${sub.name.replace(/"/g, '""')}"`,
          sub.email,
          sub.company ? `"${sub.company.replace(/"/g, '""')}"` : '',
          sub.phone || '',
          sub.sector ? `"${sub.sector.replace(/"/g, '""')}"` : '',
          sub.status ? 'Activo' : 'Cancelado',
          sub.created_At.toISOString(),
          sub.unsubscribed_At ? sub.unsubscribed_At.toISOString() : '',
        ];
        csvRows.push(row.join(','));
      }

      return csvRows.join('\n');
    } catch (error) {
      throw new HttpException('Error al exportar los suscriptores', HttpStatus.BAD_REQUEST);
    }
  }

  /* Obtener estadísticas */
  async getStats(): Promise<any> {
    try {
      const total = await this.prisma.meSubscriber.count();
      const active = await this.prisma.meSubscriber.count({ where: { status: true } });
      const inactive = await this.prisma.meSubscriber.count({ where: { status: false } });

      // Suscriptores de los últimos 30 días
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const lastMonth = await this.prisma.meSubscriber.count({
        where: {
          created_At: { gte: thirtyDaysAgo },
          status: true,
        },
      });

      return { total, active, inactive, lastMonth };
    } catch (error) {
      throw new HttpException('Error al obtener estadísticas', HttpStatus.BAD_REQUEST);
    }
  }
}
