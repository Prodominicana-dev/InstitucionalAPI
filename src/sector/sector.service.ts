import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class SectorService {
  constructor(private prismaService: PrismaService) {}

  // Crear sector
  async createSector(data: any) {
    try {
      return await this.prismaService.sector.create({
        data,
      });
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  }

  // Editar sector
  async updateSector(id: string, data: any) {
    try {
      return await this.prismaService.sector.update({
        where: { id },
        data: {
          ...data,
        },
      });
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  }

  // Eliminar sector por code
  async deleteSector(code: string) {
    try {
      return await this.prismaService.sector.delete({
        where: { code },
      });
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  }

  // Obtener todos los sectores
  async sectors() {
    try {
      return await this.prismaService.sector.findMany();
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  }

  // Obtener por code
  async sectorByCode(code: string) {
    try {
      return await this.prismaService.sector.findUnique({
        where: { code },
      });
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  }
}
