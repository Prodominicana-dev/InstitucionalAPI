import { Injectable } from '@nestjs/common';
import { News, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NewsService {
  constructor(private prisma: PrismaService) {}

  /* Crear noticia */
  async create(data: any): Promise<any> {
    try {
      const { en, es, date, images } = data;
      const news_en = JSON.parse(en);
      const news_es = JSON.parse(es);
      const imagesr = JSON.parse(images);
      const news = [news_en, news_es];
      return await this.prisma.news.create({
        data: {
          metadata: news,
          cover: data.cover,
          images: imagesr,
          date,
          created_By: data.created_By,
          categoryId: data.categoryId,
        },
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
      const { en, es, images } = data;
      let news = undefined;
      if (en !== undefined && es !== undefined) {
        const news_en = JSON.parse(en);
        const news_es = JSON.parse(es);
        news = [news_en, news_es];
      }
      const imagesr = JSON.parse(images);
      const newData = {
        metadata: news !== undefined ? news : oldNews.metadata,
        cover: data.cover || oldNews.cover,
        images: imagesr,
        updated_By: data.updated_By,
        updated_At: new Date(),
        status: data.status || oldNews.status,
        date: data.date || oldNews.date,
        categoryId: data.categoryId || oldNews.categoryId,
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
        include: { category: true },
      });

      if (!news) throw new Error('Noticia no encontrada');
      // return la metadata que coincida con el idioma
      return news.metadata
        .filter((m: any) => m.language === lang)
        .map((filteredNews: any) => ({
          id: news.id,
          cover: news.cover,
          status: news.status,
          date: news.date,
          category: news.category,
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
          date: 'desc',
        },
        include: {
          category: true,
        },
      });

      return news.flatMap((n: any) => {
        return n.metadata
          .filter((m: any) => m.language === lang)
          .map((filteredNews: any) => ({
            id: n.id,
            cover: n.cover,
            status: n.status,
            date: n.date,
            images: n.images,
            category: n.category,
            ...filteredNews,
          }));
      });
    } catch (error) {
      throw new Error(error);
    }
  }

  /* Obtener las últimas 2 noticias */
  async findLastTwo(lang: string): Promise<any> {
    try {
      const news = await this.prisma.news.findMany({
        orderBy: {
          date: 'desc',
        },
        include: {
          category: true,
        },
        take: 2, // Obtener solo las últimas 2 noticias
      });

      return news.flatMap((n: any) => {
        return n.metadata
          .filter((m: any) => m.language === lang)
          .map((filteredNews: any) => ({
            id: n.id,
            cover: n.cover,
            status: n.status,
            date: n.date,
            images: n.images,
            category: n.category,
            ...filteredNews,
          }));
      });
    } catch (error) {
      throw new Error(error);
    }
  }

  // Obtener los id y title de noticia previa y la siguiente a la noticia actual
  async getPrevNextNews(id: string, lang: string): Promise<any> {
    const news = await this.findAll(lang);
    const index = news.findIndex((n: any) => n.id === id);
    const prev = news[index + 1] || null;
    const next = news[index - 1] || null;
    return {
      prev: {
        id: prev ? prev.id : null,
        title: prev ? prev.title : null,
      },
      next: {
        id: next ? next.id : null,
        title: next ? next.title : null,
      },
    };
  }

  // Obtener noticia por id, pero sin lenguaje. retornar un es: con la data en español y en: con la data en ingles
  async findOneById(id: string): Promise<any> {
    try {
      const news = await this.prisma.news.findUnique({
        where: { id },
        include: { category: true },
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
        cover: news.cover,
        status: news.status,
        date: news.date,
        images: news.images,
        category: news.category,
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
