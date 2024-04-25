import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { IsNotEmpty } from 'class-validator';

@Injectable()
export class ProductService {
  constructor(private prismaService: PrismaService) {}

  // Crear un nuevo producto
  async createProduct(data: any) {
    try {
      return await this.prismaService.product.create({
        data,
      });
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  }

  // Editar un producto
  async updateProduct(id: string, data: any) {
    try {
      return await this.prismaService.product.update({
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

  // Eliminar un producto
  async deleteProduct(code: string) {
    try {
      return await this.prismaService.product.delete({
        where: { code },
      });
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  }

  // Obtener todos los productos
  async products() {
    try {
      return await this.prismaService.product.findMany();
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  }

  async exportedProducts(lang: string) {
    try {
      return await this.prismaService.product.groupBy({
        where: {
          company: {
            some: {},
          },
          AND: [
            lang === 'es'
              ? { alias: { not: null } }
              : { aliasEn: { not: null } },
          ],
        },
        by: [lang === 'es' ? 'alias' : 'aliasEn'],
        orderBy: [lang === 'es' ? { alias: 'asc' } : { aliasEn: 'asc' }],
      });
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  }

  // Obtener por code
  async productByCode(code: string) {
    try {
      return await this.prismaService.product.findUnique({
        where: { code },
      });
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  }
}
