import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma, NewsCategory } from '@prisma/client';

@Injectable()
export class NewsCategoryService {
  constructor(private prisma: PrismaService) {}

  // Crear una categoría de noticia
  async createNewsCategory(data: any): Promise<NewsCategory> {
    try {
      return await this.prisma.newsCategory.create({
        data,
      });
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  // Editar una categoría de noticia
  async updateNewsCategory(id: string, data: any): Promise<NewsCategory> {
    try {
      const newsCategory = await this.prisma.newsCategory.findUnique({
        where: { id },
      });
      if (!newsCategory)
        throw new NotFoundException('Categoría de noticia no encontrada');
      return await this.prisma.newsCategory.update({
        where: { id },
        data,
      });
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  // Obtener todas las categorías de noticias
  async getNewsCategories(): Promise<NewsCategory[]> {
    try {
      return await this.prisma.newsCategory.findMany({});
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  // Obtener una categoría de noticia por id
  async getNewsCategoryById(id: string): Promise<NewsCategory> {
    try {
      return await this.prisma.newsCategory.findUnique({
        where: { id },
      });
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  // Eliminar una categoría de noticia
  async deleteNewsCategory(id: string): Promise<NewsCategory> {
    try {
      const newsCategory = await this.prisma.newsCategory.findUnique({
        where: { id },
      });
      if (!newsCategory)
        throw new NotFoundException('Categoría de noticia no encontrada');
      return await this.prisma.newsCategory.delete({
        where: { id },
      });
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }
}
