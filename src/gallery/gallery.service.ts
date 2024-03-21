import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Gallery, Prisma } from '@prisma/client';

@Injectable()
export class GalleryService {
  constructor(private readonly prismaService: PrismaService) {}

  // Create new Gallery Image
  async create(data: Prisma.GalleryCreateInput): Promise<Gallery> {
    try {
      return this.prismaService.gallery.create({
        data,
      });
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  // Find all Gallery Images by EventID
  async findAll(eventId: string): Promise<Gallery[]> {
    try {
      return this.prismaService.gallery.findMany({
        where: {
          eventId,
        },
      });
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  // Delete Gallery Image by ID
  async delete(id: string): Promise<Gallery> {
    try {
      return this.prismaService.gallery.delete({
        where: {
          id,
        },
      });
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  // Get by ID
  async getById(id: string): Promise<Gallery> {
    try {
      return this.prismaService.gallery.findUnique({
        where: {
          id,
        },
      });
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
}
