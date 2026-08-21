import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';

// Orden de la agenda: primero el orden manual del admin, luego por fecha mas cercana
const scheduleOrderBy: Prisma.ScheduleOrderByWithRelationInput[] = [
  { order: { sort: 'asc', nulls: 'last' } },
  { date: 'asc' },
];

@Injectable()
export class ScheduleService {
  constructor(private prisma: PrismaService) {}

  // Numerar las agendas que aun no tienen orden manual, por fecha ascendente.
  // Evita mezclar filas con orden y filas en null: en esa mezcla una agenda
  // recien creada se colaria al tope de la lista.
  private async backfillOrder() {
    const pending = await this.prisma.schedule.findMany({
      where: { order: null },
      orderBy: { date: 'asc' },
      select: { id: true },
    });
    if (pending.length === 0) return;
    const last = await this.prisma.schedule.findFirst({
      where: { order: { not: null } },
      orderBy: { order: 'desc' },
      select: { order: true },
    });
    let next = last?.order ?? 0;
    await this.prisma.$transaction(
      pending.map((s) =>
        this.prisma.schedule.update({
          where: { id: s.id },
          data: { order: ++next },
        }),
      ),
    );
  }

  // Crear un nuevo schedule
  async create(data: any) {
    try {
      await this.backfillOrder();
      const last = await this.prisma.schedule.findFirst({
        orderBy: { order: 'desc' },
        select: { order: true },
      });
      return await this.prisma.schedule.create({
        data: { ...data, order: (last?.order ?? 0) + 1 },
      });
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  }

  // Editar un schedule
  async update(id: string, data: any) {
    try {
      return await this.prisma.schedule.update({
        where: { id: id },
        data: { ...data, updated_At: new Date() },
      });
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  }

  // Eliminar un schedule
  async delete(id: string) {
    try {
      return await this.prisma.schedule.delete({
        where: { id: id },
      });
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  }

  // Obtener los proximos schedules para el home
  async getAll() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return await this.prisma.schedule.findMany({
        where: { status: true, date: { gte: today } },
        take: 4,
        orderBy: scheduleOrderBy,
      });
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  }

  // Obtener toda la agenda vigente (pagina "ver mas"): lo mismo que el home
  // pero sin limite, porque puede haber mas eventos futuros de los que caben.
  async getAllPublic() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return await this.prisma.schedule.findMany({
        where: { status: true, date: { gte: today } },
        orderBy: scheduleOrderBy,
      });
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  }

  // Obtener todos los schedules sin filtrar (panel de administracion)
  async getAllAdmin() {
    try {
      return await this.prisma.schedule.findMany({
        orderBy: scheduleOrderBy,
      });
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  }

  // Guardar el orden manual definido por el admin
  async reorder(items: { id: string; order: number }[]) {
    try {
      return await this.prisma.$transaction(
        items.map((item) =>
          this.prisma.schedule.update({
            where: { id: item.id },
            data: { order: item.order, updated_At: new Date() },
          }),
        ),
      );
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  }

  // Obtener un schedule por id
  async getById(id: string) {
    try {
      return await this.prisma.schedule.findUnique({
        where: { id: id },
      });
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  }
}
