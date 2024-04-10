import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ExportService {
  constructor(private prismaService: PrismaService) {}

  // Crear un nuevo exportador
  async createExporter(data: any) {
    try {
      return await this.prismaService.company.create({
        data,
      });
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  }

  // Editar un exportador
  async updateExporter(id: string, data: any) {
    try {
      return await this.prismaService.company.update({
        where: { rnc: id },
        data: {
          ...data,
          updated_At: new Date(),
        },
      });
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  }

  // Eliminar un exportador
  async deleteExporter(rnc: string) {
    try {
      return await this.prismaService.company.delete({
        where: { rnc },
      });
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  }

  // Obtener todos los exportadores
  async exporters() {
    try {
      return await this.prismaService.company.findMany();
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  }

  // Obtener los mejores exportadores (ordenados de mayor a menor por el fob)
  async topExporters() {
    try {
      return await this.prismaService.company.findMany({
        orderBy: {
          fob: 'desc',
        },
      });
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  }

  // Obtener un exportador por su RNC
  async exporter(rnc: string) {
    try {
      return await this.prismaService.company.findUnique({
        where: { rnc },
      });
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  }
}
