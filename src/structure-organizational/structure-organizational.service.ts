import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma, Member, Department } from '@prisma/client';

@Injectable()
export class StructureOrganizationalService {
  constructor(private prisma: PrismaService) {}

  // Obtener todos los departamentos
  async getDirections(): Promise<Department[]> {
    try {
      return await this.prisma.department.findMany();
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  // Obtener departamento por id
  async getDirectionById(id: string): Promise<Department> {
    try {
      return await this.prisma.department.findUnique({
        where: { id },
      });
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  // Crear un departamento
  async createDirection(data: any): Promise<Department> {
    try {
      return await this.prisma.department.create({
        data,
      });
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error);
    }
  }

  // Editar un departamento
  async updateDirection(id: string, data: any): Promise<Department> {
    try {
      const direction = await this.prisma.department.findUnique({
        where: { id },
      });
      if (!direction) throw new NotFoundException('Departamento no encontrado');
      return await this.prisma.department.update({
        where: { id },
        data,
      });
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  // Obtener todos los miembros de un departamento, con el departamento
  async getMembers(lang: string): Promise<any[]> {
    try {
      const member = await this.prisma.member.findMany({
        include: { department: true },
      });
      return member.flatMap((n: any) => {
        return n.metadata
          .filter((m: any) => m.language === lang)
          .map((filteredNews: any) => ({
            id: n.id,
            name: n.name,
            image: n.image,
            isDirector: n.isDirector,
            department: n.department,
            ...filteredNews,
          }));
      });
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  // Obtener miembro por id
  async getMemberById(id: string): Promise<any> {
    try {
      const member = await this.prisma.member.findUnique({
        where: { id },
        include: { department: true },
      });
      if (!member) throw new NotFoundException('Noticia no encontrada');
      const es = member.metadata
        .filter((m: any) => m.language === 'es')
        .flatMap((filteredNews: any) => ({
          ...filteredNews,
        }));

      const en = member.metadata
        .filter((m: any) => m.language === 'en')
        .flatMap((filteredNews: any) => ({
          ...filteredNews,
        }));
      const data = {
        id: member.id,
        image: member.image,
        name: member.name,
        isDirector: member.isDirector,
        department: member.department,
        departmentId: member.departmentId,
        es: es[0],
        en: en[0],
      };
      return data;
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  // Obtener todos los miembros de un departamento
  async getMembersByDirection(id: string, lang: string): Promise<any[]> {
    try {
      const member = await this.prisma.member.findMany({
        where: { departmentId: id },
        include: { department: true },
      });
      return member
        .flatMap((n: any) => {
          return n.metadata
            .filter((m: any) => m.language === lang)
            .map((filteredNews: any) => ({
              id: n.id,
              name: n.name,
              image: n.image,
              isDirector: n.isDirector,
              department: n.department,
              ...filteredNews,
            }));
        })
        .sort((a, b) =>
          a.isDirector === b.isDirector ? 0 : a.isDirector ? -1 : 1,
        );
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  // Crear un miembro
  async createMember(data: any): Promise<Member> {
    try {
      const { es, en } = data;
      const isDirector = data.isDirector === 'true';
      if (!es || !en) {
        return await this.prisma.member.create({
          data: {
            name: data.name,
            isDirector: isDirector,
            departmentId: data.departmentId,
            image: data.image,
          },
        });
      } else {
        const esData = JSON.parse(es);
        const enData = JSON.parse(en);
        const metadata = [esData, enData];
        return await this.prisma.member.create({
          data: {
            name: data.name,
            isDirector: isDirector,
            metadata: metadata || [],
            departmentId: data.departmentId,
            image: data.image,
          },
        });
      }
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(error);
    }
  }

  // Editar un miembro
  async updateMember(id: string, data: any): Promise<Member> {
    try {
      const member = await this.prisma.member.findUnique({
        where: { id },
      });
      if (!member) throw new NotFoundException('Miembro no encontrado');
      const { es, en } = data;
      const isDirector = data.isDirector === 'true';
      if (!es || !en) {
        return await this.prisma.member.update({
          where: { id },
          data: {
            name: data.name,
            isDirector: isDirector,
            departmentId: data.departmentId,
            image: data.image,
          },
        });
      } else {
        const esData = JSON.parse(es);
        const enData = JSON.parse(en);
        const metadata = [esData, enData];
        const newData = {
          name: data.name || member.name,
          isDirector: isDirector,
          metadata,
          departmentId: data.departmentId || member.departmentId,
          image: data.image || member.image,
        };
        return await this.prisma.member.update({
          where: { id },
          data: newData,
        });
      }
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  // Eliminar un miembro
  async deleteMember(id: string): Promise<Member> {
    try {
      return this.prisma.member.delete({
        where: { id },
      });
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  // Eliminar un departamento
  async deleteDirection(id: string): Promise<Department> {
    try {
      return this.prisma.department.delete({
        where: { id },
      });
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }
}
