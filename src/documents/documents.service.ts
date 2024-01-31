import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma, Documents } from '@prisma/client';

@Injectable()
export class DocumentsService {
  constructor(private readonly prismaService: PrismaService) {}

  /* Crear un nuevo documento para una seccion o subseccion*/
  async create(data: any): Promise<Documents> {
    try {
      return this.prismaService.documents.create({ data });
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  /* Editar un documento una seccion o subseccion*/
  async update(id: string, data: any): Promise<Documents> {
    try {
      return this.prismaService.documents.update({
        where: { id },
        data,
      });
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  /* Obtener todos los documentos de una seccion o subseccion*/
  async getAllDocuments(): Promise<Documents[]> {
    try {
      return this.prismaService.documents.findMany({
        include: {
          section: true,
          subsection: true,
        },
        orderBy: [
          { date: 'desc' },
          { sectionId: 'asc' },
          { subsectionId: 'asc' },
        ],
      });
    } catch (error) {
      throw error;
    }
  }

  /* Obtener todos los documentos de una misma seccion o subseccion */
  async getDocumentsBySectionOrSubsection(
    sectionId: string,
    subsectionId: string,
  ): Promise<Documents[]> {
    try {
      return this.prismaService.documents.findMany({
        where: {
          OR: [
            {
              sectionId,
            },
            {
              subsectionId,
            },
          ],
        },
        include: {
          section: true,
          subsection: true,
        },
      });
    } catch (error) {
      throw error;
    }
  }

  /* Obtener registro por ID */
  async getById(id: string): Promise<Documents> {
    try {
      return this.prismaService.documents.findUnique({
        where: { id },
        include: { section: true, subsection: true },
      });
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  /* Borrar un documento */
  async delete(id: string): Promise<Documents> {
    try {
      return this.prismaService.documents.delete({
        where: { id },
      });
    } catch (error) {
      throw error;
    }
  }
}
