import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma, EventCategory } from '@prisma/client';

@Injectable()
export class EventCategoryService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(data: Prisma.EventCategoryCreateInput): Promise<EventCategory> {
    try {
      return this.prismaService.eventCategory.create({ data });
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  }

  async update(id: string, data: any): Promise<EventCategory> {
    try {
      const eventCategory = await this.getById(id);
      const newData: Prisma.EventCategoryUpdateInput = {
        name: data.name ? data.name : eventCategory.name,
        email: data.email ? data.email : eventCategory.email,
      };
      return this.prismaService.eventCategory.update({
        where: { id },
        data: newData,
      });
    } catch (error) {
      throw new Error(error);
    }
  }

  async getById(id: string): Promise<EventCategory> {
    try {
      return this.prismaService.eventCategory.findUnique({
        where: { id },
      });
    } catch (error) {
      throw new Error(error);
    }
  }

  async getAll(): Promise<EventCategory[]> {
    try {
      return this.prismaService.eventCategory.findMany();
    } catch (error) {
      throw new Error(error);
    }
  }

  async delete(id: string): Promise<EventCategory> {
    try {
      return this.prismaService.eventCategory.delete({
        where: { id },
      });
    } catch (error) {
      throw new Error(error);
    }
  }
}
