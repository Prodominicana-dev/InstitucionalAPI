import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Event, Prisma } from '@prisma/client';

@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService) {}
  // Crear nuevo evento
  async create(data: any): Promise<any> {
    try {
      const { en, es } = data;
      const event_en = JSON.parse(en);
      const event_es = JSON.parse(es);
      const events = [event_en, event_es];
      const eventNew = {
        metadata: events,
        start_Date: data.start_Date || null,
        end_Date: data.end_Date || null,
        status: data.status || true,
        lat: data.lat || null,
        lng: data.lng || null,
        address: data.address || null,
        created_By: data.created_By || null,
        categoryId: data.categoryId,
        image: data.image || null,
        created_At: new Date(),
      };
      return await this.prisma.event.create({ data: eventNew });
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  }

  // Editar evento
  async update(id, data: any): Promise<any> {
    try {
      const oldEvent = await this.prisma.event.findUnique({ where: { id } });
      if (!oldEvent) throw new NotFoundException('Evento no encontrado');
      const { en, es } = data;
      let events = undefined;
      if (en !== undefined && es !== undefined) {
        const event_en = JSON.parse(en);
        const event_es = JSON.parse(es);
        events = [event_en, event_es];
      }
      const newData = {
        metadata: events !== undefined ? events : oldEvent.metadata,
        start_Date: data.start_Date || oldEvent.start_Date,
        end_Date: data.end_Date || oldEvent.end_Date,
        status: data.status || oldEvent.status,
        image: data.image || oldEvent.image,
        categoryId: data.categoryId || oldEvent.categoryId,
        updated_At: new Date(),
        updated_By: data.updated_By || oldEvent.updated_By,
      };
      return await this.prisma.event.update({
        where: { id },
        data: newData,
      });
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  }

  // Eliminar evento
  async delete(id: string): Promise<Event> {
    return this.prisma.event.delete({
      where: { id },
    });
  }

  // Deshabilitar evento
  async disable(id: string, data: any): Promise<Event> {
    return this.prisma.event.update({
      where: { id },
      data: {
        status: false,
        updated_By: data.updated_By,
        updated_At: new Date(),
      },
    });
  }

  // Habilitar evento
  async enable(id: string, data: any): Promise<Event> {
    return this.prisma.event.update({
      where: { id },
      data: {
        status: true,
        updated_By: data.updated_By,
        updated_At: new Date(),
      },
    });
  }

  // Obtener evento por id, pero sin lenguaje. retornar un es: con la data en español y en: con la data en ingles
  async findOneById(id: string): Promise<any> {
    try {
      const event = await this.prisma.event.findUnique({
        where: { id },
      });

      if (!event) throw new NotFoundException('Noticia no encontrada');
      const es = event.metadata
        .filter((m: any) => m.language === 'es')
        .flatMap((filteredNews: any) => ({
          ...filteredNews,
        }));

      const en = event.metadata
        .filter((m: any) => m.language === 'en')
        .flatMap((filteredNews: any) => ({
          ...filteredNews,
        }));
      const data = {
        id: event.id,
        image: event.image,
        status: event.status,
        start_Date: event.start_Date,
        end_Date: event.end_Date,
        address: event.address,
        categoryId: event.categoryId,
        lat: event.lat,
        lng: event.lng,

        es: es[0],
        en: en[0],
      };
      return data;
    } catch (error) {
      throw new Error(error);
    }
  }

  // Obtener todos los eventos por idioma
  async findAllEnable(lang: string): Promise<Event[]> {
    const events = await this.prisma.event.findMany({
      orderBy: { start_Date: 'asc' },
    });

    return events.flatMap((e: Event) => {
      return e.metadata
        .filter((m: any) => m.language === lang)
        .map((filteredEvent: any) => ({
          id: e.id,
          image: e.image,
          address: e.address,
          latitude: e.lat,
          longitude: e.lng,
          start_Date: e.start_Date,
          end_Date: e.end_Date,
          status: e.status,
          ...filteredEvent,
        }));
    });
  }

  // Obtener evento por id
  async findOne(id: string, lang: string): Promise<any> {
    const event = await this.prisma.event.findUnique({
      where: { id },
    });
    if (!event) throw new NotFoundException('Evento no encontrado');
    return event.metadata
      .filter((e: any) => e.language === lang)
      .map((eventData: any) => ({
        id: event.id,
        image: event.image,
        address: event.address,
        latitude: event.lat,
        longitude: event.lng,
        start_Date: event.start_Date,
        end_Date: event.end_Date,
        status: event.status,
        ...eventData,
      }));
  }
}
