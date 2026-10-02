import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class NewsFeaturedService {
  constructor(private readonly prismaService: PrismaService) {}

  // Obtener la noticia destacada vigente, aplanada al idioma pedido.
  // El contenido traducible vive en metadata[], un objeto por idioma; el
  // front espera los campos ya resueltos (title, description...), igual que
  // en GET :lang/news.
  async findFeatured(lang: string): Promise<any> {
    const news = await this.prismaService.news.findFirst({
      where: { featured: true, status: true },
      include: { category: true },
    });
    if (!news) return null;

    const meta: any =
      (news.metadata as any[]).find((m: any) => m.language === lang) ??
      (news.metadata as any[])[0] ??
      {};

    // metadata trae su propia clave "category" (texto). Va primero para que
    // la relacion real, con nameEs/nameEn, sea la que quede.
    return {
      ...meta,
      id: news.id,
      cover: news.cover,
      date: news.date,
      status: news.status,
      category: news.category,
    };
  }

  // Marcar una noticia como destacada (desmarca automáticamente las demás).
  // Va en transaccion: si el update falla, el desmarcado se revierte y el sitio
  // no se queda sin destacada.
  async setFeatured(id: string, featured: boolean): Promise<any> {
    const [, news] = await this.prismaService.$transaction([
      this.prismaService.news.updateMany({
        where: featured ? { featured: true } : { id },
        data: { featured: false },
      }),
      this.prismaService.news.update({
        where: { id },
        data: { featured, updated_At: new Date() },
      }),
    ]);
    return news;
  }
}
