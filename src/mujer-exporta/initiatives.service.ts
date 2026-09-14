import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { MeInitiative } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { SubscribersService } from './subscribers.service';

@Injectable()
export class InitiativesService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
    private subscribersService: SubscribersService,
  ) {}

  /* Crear iniciativa */
  async create(data: any, sendNotifications: boolean = true): Promise<MeInitiative> {
    try {
      const es = typeof data.es === 'string' ? JSON.parse(data.es) : data.es;
      const en = data.en ? (typeof data.en === 'string' ? JSON.parse(data.en) : data.en) : null;
      const tags = data.tags ? (typeof data.tags === 'string' ? JSON.parse(data.tags) : data.tags) : [];

      const initiative = await this.prisma.meInitiative.create({
        data: {
          ruta: data.ruta,
          subtema: data.subtema,
          tipo: data.tipo,
          autor: data.autor,
          url: data.url,
          publicoObjetivo: data.publicoObjetivo,
          priorizacion: data.priorizacion,
          nivel: data.nivel,
          tags,
          es,
          en,
          startDate: data.startDate ? new Date(data.startDate) : null,
          endDate: data.endDate ? new Date(data.endDate) : null,
          created_By: data.created_By,
        },
      });

      // Enviar notificaciones a suscriptores si la iniciativa está activa
      if (sendNotifications && initiative.status) {
        // Ejecutar en background para no bloquear la respuesta
        this.sendNotificationsToSubscribers(initiative).catch(err => {
          console.error('Error al enviar notificaciones:', err);
        });
      }

      return initiative;
    } catch (error) {
      throw new HttpException(
        error.message || 'Error al crear la iniciativa',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /* Enviar notificaciones a todos los suscriptores activos */
  private async sendNotificationsToSubscribers(initiative: MeInitiative): Promise<void> {
    try {
      const subscribers = await this.subscribersService.getActiveSubscribers();

      if (subscribers.length === 0) {
        console.log('ME: No hay suscriptores activos para notificar');
        return;
      }

      const esMetadata = initiative.es as { title?: string; description?: string };

      const result = await this.mailService.meNewInitiative(subscribers, {
        title: esMetadata.title || 'Nueva iniciativa',
        description: esMetadata.description || '',
        ruta: initiative.ruta,
        tipo: initiative.tipo,
        autor: initiative.autor,
        url: initiative.url,
        endDate: initiative.endDate,
      });

      console.log(`ME: Notificaciones enviadas a ${result.sent} suscriptores`);
    } catch (error) {
      console.error('ME: Error al enviar notificaciones:', error);
    }
  }

  /* Editar iniciativa */
  async update(id: string, data: any): Promise<MeInitiative> {
    try {
      const existing = await this.prisma.meInitiative.findUnique({ where: { id } });
      if (!existing) {
        throw new HttpException('Iniciativa no encontrada', HttpStatus.NOT_FOUND);
      }

      const updateData: any = {
        updated_At: new Date(),
        updated_By: data.updated_By,
      };

      if (data.ruta !== undefined) updateData.ruta = data.ruta;
      if (data.subtema !== undefined) updateData.subtema = data.subtema;
      if (data.tipo !== undefined) updateData.tipo = data.tipo;
      if (data.autor !== undefined) updateData.autor = data.autor;
      if (data.url !== undefined) updateData.url = data.url;
      if (data.publicoObjetivo !== undefined) updateData.publicoObjetivo = data.publicoObjetivo;
      if (data.priorizacion !== undefined) updateData.priorizacion = data.priorizacion;
      if (data.nivel !== undefined) updateData.nivel = data.nivel;
      if (data.status !== undefined) updateData.status = data.status;
      if (data.startDate !== undefined) updateData.startDate = data.startDate ? new Date(data.startDate) : null;
      if (data.endDate !== undefined) updateData.endDate = data.endDate ? new Date(data.endDate) : null;

      if (data.tags !== undefined) {
        updateData.tags = typeof data.tags === 'string' ? JSON.parse(data.tags) : data.tags;
      }
      if (data.es !== undefined) {
        updateData.es = typeof data.es === 'string' ? JSON.parse(data.es) : data.es;
      }
      if (data.en !== undefined) {
        updateData.en = typeof data.en === 'string' ? JSON.parse(data.en) : data.en;
      }

      return await this.prisma.meInitiative.update({
        where: { id },
        data: updateData,
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        error.message || 'Error al actualizar la iniciativa',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /* Eliminar iniciativa */
  async delete(id: string): Promise<MeInitiative> {
    try {
      return await this.prisma.meInitiative.delete({ where: { id } });
    } catch (error) {
      throw new HttpException('Error al eliminar la iniciativa', HttpStatus.BAD_REQUEST);
    }
  }

  /* Habilitar iniciativa */
  async enable(id: string): Promise<MeInitiative> {
    try {
      return await this.prisma.meInitiative.update({
        where: { id },
        data: { status: true, updated_At: new Date() },
      });
    } catch (error) {
      throw new HttpException('Error al activar la iniciativa', HttpStatus.BAD_REQUEST);
    }
  }

  /* Deshabilitar iniciativa */
  async disable(id: string): Promise<MeInitiative> {
    try {
      return await this.prisma.meInitiative.update({
        where: { id },
        data: { status: false, updated_At: new Date() },
      });
    } catch (error) {
      throw new HttpException('Error al desactivar la iniciativa', HttpStatus.BAD_REQUEST);
    }
  }

  /* Obtener iniciativa por ID */
  async findOne(id: string): Promise<MeInitiative> {
    try {
      const initiative = await this.prisma.meInitiative.findUnique({ where: { id } });
      if (!initiative) {
        throw new HttpException('Iniciativa no encontrada', HttpStatus.NOT_FOUND);
      }
      return initiative;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException('Error al obtener la iniciativa', HttpStatus.BAD_REQUEST);
    }
  }

  /* Obtener todas las iniciativas (Admin) */
  async findAllAdmin(): Promise<MeInitiative[]> {
    try {
      return await this.prisma.meInitiative.findMany({
        orderBy: { created_At: 'desc' },
      });
    } catch (error) {
      throw new HttpException('Error al obtener las iniciativas', HttpStatus.BAD_REQUEST);
    }
  }

  /* Obtener iniciativas públicas (filtradas por status y vigencia) */
  async findAllPublic(lang: string): Promise<any[]> {
    try {
      const now = new Date();

      const initiatives = await this.prisma.meInitiative.findMany({
        where: {
          status: true,
          OR: [
            { endDate: null },
            { endDate: { gte: now } },
          ],
        },
        orderBy: { created_At: 'desc' },
      });

      // Formatear para el frontend
      return initiatives.map((i) => {
        const metadata = lang === 'en' && i.en ? i.en : i.es;
        return {
          id: i.id,
          ruta: i.ruta,
          subtema: i.subtema,
          tipo: i.tipo,
          autor: i.autor,
          url: i.url,
          publicoObjetivo: i.publicoObjetivo,
          priorizacion: i.priorizacion,
          nivel: i.nivel,
          tags: i.tags,
          startDate: i.startDate,
          endDate: i.endDate,
          ...(metadata as object),
        };
      });
    } catch (error) {
      throw new HttpException('Error al obtener las iniciativas', HttpStatus.BAD_REQUEST);
    }
  }
}
