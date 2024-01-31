import { Injectable } from '@nestjs/common';
import { News, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

interface News_Metadata {
  language: string;
  title: string;
  description: string;
}

@Injectable()
export class NewsService {
  constructor(private prisma: PrismaService) {}

  /* Crear noticia */
  async create(data: any): Promise<any> {
    try {
      const { en, es } = data;
      const news_en = JSON.parse(en);
      const news_es = JSON.parse(es);
      const news = [news_en, news_es];
      return await this.prisma.news.create({ data: { news_metadata: news } });
    } catch (error) {
      throw new Error(error);
    }
  }

  /* Editar noticia */
  async update(id: string, data: any): Promise<any> {
    try {
      const oldNews = await this.prisma.news.findUnique({ where: { id } });
      if (!oldNews) throw new Error('Noticia no encontrada');
      const { en, es } = data;
      let news = undefined;
      if (en !== undefined && es !== undefined) {
        const news_en = JSON.parse(en);
        const news_es = JSON.parse(es);
        news = [news_en, news_es];
      }
      const newData: Prisma.NewsUpdateInput = {
        news_metadata: news !== undefined ? news : oldNews.news_metadata,
        image: data.image || oldNews.image,
        updated_At: new Date(),
        status: data.status || oldNews.status,
      };

      return await this.prisma.news.update({
        where: { id },
        data: newData,
      });
    } catch (error) {
      throw new Error(error);
    }
  }

  /* Eliminar noticia */
  async delete(id: string): Promise<News> {
    try {
      return this.prisma.news.delete({
        where: { id },
      });
    } catch (error) {
      throw new Error(error);
    }
  }

  /* Deshabilitar una noticia */
  async disable(id: string): Promise<News> {
    try {
      return this.prisma.news.update({
        where: { id },
        data: { status: false },
      });
    } catch (error) {
      throw new Error(error);
    }
  }

  /* Habilitar una noticia */
  async enable(id: string): Promise<News> {
    try {
      return this.prisma.news.update({
        where: { id },
        data: { status: true },
      });
    } catch (error) {
      throw new Error(error);
    }
  }

  /* Buscar noticia por id */
  async findOne(id: string, lang: string): Promise<any> {
    try {
      const news = await this.prisma.news.findUnique({
        where: { id },
      });

      if (!news) throw new Error('Noticia no encontrada');
      // return la news_metadata que coincida con el idioma
      return news.news_metadata.find((n: any) => n.language === lang);
    } catch (error) {
      throw new Error(error);
    }
  }

  /* Todas las noticias */
  async findAll(lang: string): Promise<any> {
    try {
      const news = await this.prisma.news.findMany({
        orderBy: {
          created_At: 'desc',
        },
        where: {
          status: true,
        },
      });

      return news.flatMap((n: News) => {
        return n.news_metadata
          .filter((m: any) => m.language === lang)
          .map((filteredNews: any) => ({
            id: n.id,
            status: n.status,
            ...filteredNews,
          }));
      });
    } catch (error) {
      throw new Error(error);
    }
  }

  // Obtener todas las categorias de noticias, dependiendo el idioma
  async getCategories(lang: string): Promise<any> {
    try {
      const news = await this.prisma.news.findMany({
        where: { status: true },
      });

      const categories = news.flatMap((n: News) => {
        return n.news_metadata
          .filter((m: any) => m.language === lang)
          .map((filteredNews: any) => ({
            category: filteredNews.category,
          }));
      });

      return categories;
    } catch (error) {
      throw new Error(error);
    }
  }
}
