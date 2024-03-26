import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma, Section } from '@prisma/client';
import { DocumentsService } from 'src/documents/documents.service';
import { rimraf } from 'rimraf';
const fs = require('fs');
const path = require('path');

@Injectable()
export class SectionService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly documentsService: DocumentsService,
  ) {}

  /* Crear una nueva sección */
  async create(data: Prisma.SectionCreateInput): Promise<Section> {
    try {
      return this.prismaService.section.create({ data });
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  /* Editar una sección */
  async update(id: string, data: any): Promise<Section> {
    try {
      console.log(data);
      const section = await this.getById(id);

      /* Si el tipo de seccion es documento y se cambia de tipo  */
      if (data.type !== 'document' && section.type === 'document') {
        section.type = data.type;
        if (section.documents.length > 0) {
          const documents = section.documents;
          documents.forEach(async (document) => {
            const imagePath = path.join(
              process.cwd(),
              `public/${document.path}`,
            );
            if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
            await this.prismaService.documents.delete({
              where: { id: document.id },
            });
          });
        }
        const pathFolder = path.join(process.cwd(), `public/docs/${id}`);
        if (fs.existsSync(pathFolder)) rimraf(pathFolder);
        section.description = '';
        console.log('cambie el tipo');
      }
      /* Si el tipo de seccion es url y se cambia de tipo  */
      if (data.type !== 'url' && section.type === 'url') {
        section.type = data.type;
        section.url = '';
      }

      const newData: Prisma.SectionUpdateInput = {
        name: data.name ? data.name : section.name,
        description: data.description ? data.description : section.description,
        priority: data.priority ? data.priority : section.priority,
        status: data.status ? data.status : section.status,
        type: data.type,
        url: data.url ? data.url : section.url,
      };
      console.log(data);
      console.log(section);
      return this.prismaService.section.update({
        where: { id },
        data: newData,
      });
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  /* Obtener todas las secciones con todos los datos */
  async getAllSections(): Promise<any[]> {
    try {
      const sections = await this.prismaService.section.findMany({
        orderBy: [{ status: 'desc' }, { priority: 'asc' }],
        include: {
          documents: true,
          subsection: { include: { documents: true } },
        },
      });
      const secDocuments = sections.filter((section) => {
        return (section.documents = section.documents.filter((document) => {
          return document.sectionId !== null && document.subsectionId === null;
        }));
      });
      return secDocuments;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  /* Obtener una seccion por ID */
  async getById(id: string): Promise<any> {
    try {
      return this.prismaService.section.findUnique({
        where: { id },
        include: { documents: true, subsection: true },
      });
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  /* Obtener todas las secciones, incluyendo las que estan deshabilitadas */
  async getAllSectionsAdmin(): Promise<Section[]> {
    try {
      const sections = await this.prismaService.section.findMany({
        orderBy: [{ status: 'asc' }, { priority: 'asc' }],
        include: { documents: true, subsection: true },
      });
      const secDocuments = sections.filter((section) => {
        return (section.documents = section.documents.filter((document) => {
          return document.sectionId !== null && document.subsectionId === null;
        }));
      });
      return secDocuments;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  // En base al ID, quiero extraer todos los años para hacer un filtro y los meses que estan registrados (documentos)
  async filterByDate(id: string) {
    const section = await this.getById(id);
    if (!section) {
      throw new NotFoundException();
    }

    if (section.type !== 'document') return;
    let filter = [];
    section.documents.map((doc) => {
      console.log(doc.date);
      // Convertir doc.date a fecha
      const date = new Date(doc.date);
      // Identificar el año y el mes y agregarlo a un arreglo de años con meses la estructura seria: {year: 2021, months: [{month: 1, name: 'Enero'}, {month: 2, name: 'Febrero'}]}
      const year = date.getFullYear();
      const month = date.getMonth();
      const monthName = date.toLocaleString('es-ES', { month: 'long' });
      const indexYear = filter.findIndex((item) => item.year === year);
      if (indexYear === -1) {
        filter.push({ year, months: [{ month, name: monthName }] });
      } else {
        const indexMonth = filter[indexYear].months.findIndex(
          (item) => item.month === month,
        );
        if (indexMonth === -1) {
          filter[indexYear].months.push({ month, name: monthName });
        }
      }
    });
    // Ordenar los años de mayor a menor y los meses de menor a mayor
    filter.sort((a, b) => b.year - a.year);
    filter.forEach((item) => {
      item.months.sort((a, b) => a.month - b.month);
    });
    return filter;
  }

  /* Activar una seccion */
  async enable(id: string): Promise<Section> {
    try {
      return this.prismaService.section.update({
        where: { id },
        data: { status: true },
      });
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  /* Desactivar una seccion */
  async disable(id: string): Promise<Section> {
    try {
      return this.prismaService.section.update({
        where: { id },
        data: { status: false },
      });
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  /* Eliminar una seccion */
  async deleteS(id: string): Promise<Section> {
    try {
      const section: any = await this.getById(id);
      if (section.type === 'document' && section.documents.length > 0) {
        const documents = section.documents;
        documents.forEach(async (document) => {
          const imagePath = path.join(process.cwd(), `public/${document.path}`);
          if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
          await this.prismaService.documents.delete({
            where: { id: document.id },
          });
        });
      }
      if (section.type === null && section.subsection.length > 0) {
        const subsections = section.subsection;
        subsections.forEach(async (subsection) => {
          const sub = await this.prismaService.subsection.findUnique({
            where: { id: subsection.id },
            include: { documents: true },
          });
          if (sub.documents.length > 0) {
            const documents = sub.documents;
            documents.forEach(async (document) => {
              const imagePath = path.join(
                process.cwd(),
                `public/${document.path}`,
              );
              if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
              await this.prismaService.documents.delete({
                where: { id: document.id },
              });
            });
          }
          await this.prismaService.subsection.delete({
            where: { id: subsection.id },
          });
        });
      }
      return this.prismaService.section.delete({
        where: { id },
      });
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
}
