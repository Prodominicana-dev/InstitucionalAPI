import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma, Subsection } from '@prisma/client';
import { rimraf } from 'rimraf';

const fs = require('fs');
const path = require('path');

@Injectable()
export class SubsectionService {
  constructor(private readonly prismaService: PrismaService) {}

  /* Crear una nueva subsección */
  async create(data: Prisma.SubsectionCreateInput): Promise<Subsection> {
    try {
      return this.prismaService.subsection.create({ data });
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  /* Editar una subsección */
  async update(id: string, data: any): Promise<Subsection> {
    try {
      const subsection = await this.getById(id);
      if (data.type !== 'document' && subsection.type === 'document') {
        if (subsection.documents.length > 0) {
          const documents = subsection.documents;
          documents.forEach(async (document) => {
            await this.prismaService.documents.delete({
              where: { id: document.id },
            });
          });
        }
        const pathFolder = path.join(
          process.cwd(),
          `public/docs/${subsection.sectionId}/${id}`,
        );
        if (fs.existsSync(pathFolder)) rimraf(pathFolder);
        subsection.description = '';
      }

      if (data.type !== 'url' && subsection.type === 'url') {
        subsection.url = '';
      }
      const newData: Prisma.SubsectionUpdateInput = {
        name: data.name ? data.name : subsection.name,
        description: data.description
          ? data.description
          : subsection.description,
        type: data.type,
        url: data.url ? data.url : subsection.url,
        status: data.status ? data.status : subsection.status,
      };
      return this.prismaService.subsection
        .update({
          where: { id },
          data: newData,
        })
        .then((res) => {
          return res;
        });
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  /* Obtener todas las subsecciones con todos los datos */
  async getAllSubsections(): Promise<Subsection[]> {
    try {
      const subsection = await this.prismaService.subsection.findMany({
        include: { documents: true, section: true },
      });

      const subDocuments = subsection.filter((section) => {
        return (section.documents = section.documents.filter((document) => {
          return document.sectionId !== null && document.subsectionId !== null;
        }));
      });

      return subDocuments;
    } catch (error) {
      throw error;
    }
  }

  /* Obtener una subseccion por ID */
  async getById(id: string): Promise<any> {
    try {
      return this.prismaService.subsection.findUnique({
        where: { id },
        include: { documents: true, section: true },
      });
    } catch (error) {
      throw error;
    }
  }

  /* Obtener todas las subsecciones con el mismo sectionID */
  async getBySectionId(sectionId: string): Promise<Subsection[]> {
    try {
      return this.prismaService.subsection.findMany({
        where: { sectionId },
        include: { documents: true, section: true },
      });
    } catch (error) {
      throw error;
    }
  }

  // En base al ID, quiero extraer todos los años para hacer un filtro y los meses que estan registrados (documentos)
  async filterByDate(id: string) {
    const subsection = await this.getById(id);
    if(!subsection){
      throw new NotFoundException();
    }
    
    if(subsection.type !== 'document')
      return;
    let filter = [];
    subsection.documents.map((doc) => {
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
    
    })

    // Ordenar los años de mayor a menor y los meses de menor a mayor
    filter.sort((a, b) => b.year - a.year);
    filter.forEach((item) => {
      item.months.sort((a, b) => a.month - b.month);
    });
    return filter
  }

  /* Activar una subseccion */
  async enable(id: string): Promise<Subsection> {
    try {
      return this.prismaService.subsection.update({
        where: { id },
        data: { status: true },
      });
    } catch (error) {
      throw error;
    }
  }

  /* Desactivar una subseccion */
  async disable(id: string): Promise<Subsection> {
    try {
      return this.prismaService.subsection.update({
        where: { id },
        data: { status: false },
      });
    } catch (error) {
      throw error;
    }
  }

  /* Borrar una subseccion */
  async delete(id: string): Promise<Subsection> {
    try {
      return this.prismaService.subsection.delete({
        where: { id },
      });
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
}
