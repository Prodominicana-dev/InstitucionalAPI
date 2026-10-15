import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

/* Cuantas noticias pueden estar destacadas a la vez. El encabezado de Noticias
   Pro las pasa en carrusel; con mas, la primera tarda demasiado en volver. */
export const TOPE_DESTACADAS = 5;

@Injectable()
export class NewsFeaturedService {
  constructor(private readonly prismaService: PrismaService) {}

  // Obtener las noticias destacadas vigentes, aplanadas al idioma pedido.
  // El contenido traducible vive en metadata[], un objeto por idioma; el
  // front espera los campos ya resueltos (title, description...), igual que
  // en GET :lang/news. Las mas recientes primero.
  async findFeatured(lang: string): Promise<any[]> {
    const noticias = await this.prismaService.news.findMany({
      where: { featured: true, status: true },
      include: { category: true },
      orderBy: { date: 'desc' },
    });

    return noticias.map((news) => {
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
    });
  }

  // Marcar o desmarcar una noticia como destacada. Devuelve null si ya hay
  // TOPE_DESTACADAS marcadas: el controller lo traduce a 409.
  async setFeatured(id: string, featured: boolean): Promise<any> {
    if (featured) {
      const marcadas = await this.prismaService.news.count({
        where: { featured: true, id: { not: id } },
      });
      if (marcadas >= TOPE_DESTACADAS) return null;
    }

    return this.prismaService.news.update({
      where: { id },
      data: { featured, updated_At: new Date() },
    });
  }
}
