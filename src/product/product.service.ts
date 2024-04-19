import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

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
