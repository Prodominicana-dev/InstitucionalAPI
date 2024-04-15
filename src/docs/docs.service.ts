import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class DocsService {
  constructor(private readonly prismaService: PrismaService) {}

  // Crear un documento
  async createDocument(data: any) {
    try {
      return await this.prismaService.docs.create({
        data,
      });
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  }

  // Editar un documento
  async updateDocument(id: string, data: any) {
    try {
      return await this.prismaService.docs.update({
        where: { id: id },
        data: { ...data, updated_At: new Date() },
      });
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  }

  // Eliminar un documento
  async deleteDocument(id: string) {
    try {
      return await this.prismaService.docs.delete({
        where: { id: id },
      });
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  }

  // Obtener todos los documentos
  async getAllDocuments() {
    try {
      return await this.prismaService.docs.findMany();
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  }

  // Obtener un documento por id
  async getDocumentById(id: string) {
    try {
      return await this.prismaService.docs.findUnique({
        where: { id: id },
      });
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  }
}
