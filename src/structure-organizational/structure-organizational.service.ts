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
  async getMembers(): Promise<Member[]> {
    try {
      return await this.prisma.member.findMany({
        include: {
          department: true,
        },
      });
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  // Obtener miembro por id
  async getMemberById(id: string): Promise<Member> {
    try {
      return await this.prisma.member.findUnique({
        where: { id },
      });
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  // Crear un miembro
  async createMember(data: any): Promise<Member> {
    try {
      return await this.prisma.member.create({
        data,
      });
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
      return await this.prisma.member.update({
        where: { id },
        data,
      });
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
