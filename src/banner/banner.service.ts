import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Banner } from '@prisma/client';

@Injectable()
export class BannerService {
  constructor(private readonly prismaService: PrismaService) {}

  // Crear un banner. Entra al final del orden actual.
  async create(data: {
    image: string;
    title: string;
    link?: string | null;
    external?: boolean;
    locale?: string | null;
    visible?: boolean;
    created_By?: string;
  }): Promise<Banner> {
    const last = await this.prismaService.banner.findFirst({
      orderBy: { order: 'desc' },
      select: { order: true },
    });
    return this.prismaService.banner.create({
      data: { ...data, order: (last?.order ?? -1) + 1 },
    });
  }

  // Actualizar los datos de un banner
  async update(
    id: string,
    data: Partial<{
      image: string;
      title: string;
      link: string | null;
      external: boolean;
      locale: string | null;
      visible: boolean;
      order: number;
      updated_By: string;
    }>,
  ): Promise<Banner> {
    return this.prismaService.banner.update({
      where: { id },
      data: { ...data, updated_At: new Date() },
    });
  }

  // Banners que ve el publico: solo los visibles, y los del idioma pedido
  // (o los que no tienen idioma, que salen en todos).
  async findPublic(locale?: string): Promise<Banner[]> {
    return this.prismaService.banner.findMany({
      where: {
        visible: true,
        ...(locale ? { OR: [{ locale: null }, { locale }] } : {}),
      },
      orderBy: [{ order: 'asc' }, { created_At: 'asc' }],
    });
  }

  // Todos los banners, visibles u ocultos, para el admin
  async findAll(): Promise<Banner[]> {
    return this.prismaService.banner.findMany({
      orderBy: [{ order: 'asc' }, { created_At: 'asc' }],
    });
  }

  async getById(id: string): Promise<Banner | null> {
    return this.prismaService.banner.findUnique({ where: { id } });
  }

  // Eliminar un banner de forma definitiva
  async delete(id: string): Promise<Banner> {
    return this.prismaService.banner.delete({ where: { id } });
  }
}
