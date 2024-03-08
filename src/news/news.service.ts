import { Injectable } from '@nestjs/common';
import { News, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

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
      return await this.prisma.news.create({
        data: { metadata: news, image: data.image },
      });
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
        metadata: news !== undefined ? news : oldNews.metadata,
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
      // return la metadata que coincida con el idioma
      return news.metadata
        .filter((m: any) => m.language === lang)
        .map((filteredNews: any) => ({
          id: news.id,
          image: news.image,
          status: news.status,
          ...filteredNews,
        }));
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
      });

      return news.flatMap((n: News) => {
        return n.metadata
          .filter((m: any) => m.language === lang)
          .map((filteredNews: any) => ({
            id: n.id,
            image: n.image,
            status: n.status,
            ...filteredNews,
          }));
      });
    } catch (error) {
      throw new Error(error);
    }
  }

  // Obtener noticia por id, pero sin lenguaje. retornar un es: con la data en español y en: con la data en ingles
  async findOneById(id: string): Promise<any> {
    try {
      const news = await this.prisma.news.findUnique({
        where: { id },
      });

      if (!news) throw new Error('Noticia no encontrada');
      const es = news.metadata
        .filter((m: any) => m.language === 'es')
        .flatMap((filteredNews: any) => ({
          ...filteredNews,
        }));

      const en = news.metadata
        .filter((m: any) => m.language === 'en')
        .flatMap((filteredNews: any) => ({
          ...filteredNews,
        }));
      const data = {
        id: news.id,
        image: news.image,
        status: news.status,
        es: es[0],
        en: en[0],
      };
      return data;
    } catch (error) {
      throw new Error(error);
    }
  }

  // Obtener todas las categorias de noticias, dependiendo el idioma
  async getCategories(): Promise<any> {
    try {
      const news = await this.prisma.news.findMany({});

      const es = news.flatMap((n: News) => {
        return n.metadata
          .filter((m: any) => m.language === 'es')
          .map((filteredNews: any) => ({
            category: filteredNews.category,
          }));
      });

      const en = news.flatMap((n: News) => {
        return n.metadata
          .filter((m: any) => m.language === 'en')
          .map((filteredNews: any) => ({
            category: filteredNews.category,
          }));
      });

      return { es, en };
    } catch (error) {
      throw new Error(error);
    }
  }
}
