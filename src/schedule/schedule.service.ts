import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ScheduleService {
  constructor(private prisma: PrismaService) {}

  // Crear un nuevo schedule
  async create(data: any) {
    try {
      return await this.prisma.schedule.create({
        data,
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

  // Obtener todos los schedules
  async getAll() {
    try {
      return await this.prisma.schedule.findMany({
        take: 4,
        orderBy: { date: 'desc' },
      });
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
