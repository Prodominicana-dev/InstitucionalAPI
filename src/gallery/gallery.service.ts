import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Gallery, Prisma, Photo } from '@prisma/client';
import { GalleryUpdateDto } from './dto/gallery.dto';
import { PhotoDto } from './dto/photo.dto';

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

  // Update Gallery by ID
  async update(id: string, data: Prisma.GalleryUpdateInput): Promise<Gallery> {
    try {
      return this.prismaService.gallery.update({
        where: {
          id,
        },
        data: {
          ...data,
          updated_At: new Date(),
        },
      });
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  // Enable the Gallery by ID
  async enable(id: string, body: GalleryUpdateDto): Promise<Gallery> {
    try {
      return this.prismaService.gallery.update({
        where: {
          id,
        },
        data: {
          status: true,
          updated_At: new Date(),
          ...body,
        },
      });
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  // Disable the Gallery by ID
  async disable(id: string, body: GalleryUpdateDto): Promise<Gallery> {
    try {
      return this.prismaService.gallery.update({
        where: {
          id,
        },
        data: {
          status: false,
          updated_At: new Date(),
          ...body,
        },
      });
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  // Find all Gallery Images by EventID
  async findAll(): Promise<Gallery[]> {
    try {
      return this.prismaService.gallery.findMany({ include: { photo: true } });
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  // Find Gallery by name and language
  async findByName(name: string): Promise<Gallery> {
    try {
      const gallery = await this.prismaService.gallery.findFirst({
        where: {
          title: name,
        },
        include: { photo: true },
      });
      if (!gallery) {
        return this.prismaService.gallery.findFirst({
          where: {
            titleEn: name,
          },
          include: { photo: true },
        });
      }

      return gallery;
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

  // PHOTO

  // Crear una foto
  async createPhoto(data: any): Promise<Photo> {
    try {
      return this.prismaService.photo.create({
        data,
      });
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  // Obtener todas las fotos por galeria
  async findAllPhotos(galleryId: string): Promise<any[]> {
    try {
      const photos = await this.prismaService.photo.findMany({
        where: {
          galleryId,
        },
        include: { gallery: true },
      });

      return photos.map((photo: any) => {
        return {
          id: photo.id,
          galleryId: photo.galleryId,
          name: photo.name,
          titleEs: photo.gallery.title,
          titleEn: photo.gallery.titleEn,
        };
      });
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  // Obtener todas las fotos por nombre de la galeria e idioma
  async findPhotosByName(name: string): Promise<any[]> {
    try {
      const gallery = await this.findByName(name);
      return this.findAllPhotos(gallery.id);
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  // Eliminar una foto
  async deletePhoto(id: string): Promise<Photo> {
    try {
      return this.prismaService.photo.delete({
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
