import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { NewspaperCover } from '@prisma/client';

@Injectable()
export class NewspaperCoverService {
  constructor(private readonly prismaService: PrismaService) {}

  // Crear una portada de periódico
  async create(data: {
    media: string;
    link?: string;
    date?: any;
    created_By?: string;
    image: string;
  }): Promise<NewspaperCover> {
    return this.prismaService.newspaperCover.create({ data });
  }

  // Actualizar una portada
  async update(
    id: string,
    data: Partial<{
      media: string;
      link: string;
      date: any;
      updated_By: string;
      image: string;
    }>,
  ): Promise<NewspaperCover> {
    return this.prismaService.newspaperCover.update({
      where: { id },
      data: { ...data, updated_At: new Date() },
    });
  }

  // Obtener portadas activas, ordenadas por fecha descendente
  async findAll(limit?: number): Promise<NewspaperCover[]> {
    return this.prismaService.newspaperCover.findMany({
      where: { status: true },
      orderBy: { date: 'desc' },
      ...(limit ? { take: limit } : {}),
    });
  }

  // Obtener una portada por id
  async getById(id: string): Promise<NewspaperCover | null> {
    return this.prismaService.newspaperCover.findUnique({ where: { id } });
  }

  // Eliminar una portada
  async delete(id: string): Promise<NewspaperCover> {
    return this.prismaService.newspaperCover.delete({ where: { id } });
  }
}
