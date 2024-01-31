import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Res,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { GalleryService } from './gallery.service';
import { FilesInterceptor } from '@nestjs/platform-express';
import { validateUser } from 'src/validation/validation';
import { Response } from 'express';
import { rimraf } from 'rimraf';
import { Prisma } from '@prisma/client';

const fs = require('fs');
const path = require('path');

@Controller('apiv2/gallery')
export class GalleryController {
  constructor(private readonly galleryService: GalleryService) {}

  // Crear una imagen en la galería
  @Post(':eventId')
  @UseInterceptors(FilesInterceptor('files'))
  async createGalleryImage(
    @Param('eventId') eventId: string,
    @Res() res,
    @UploadedFiles() files?,
  ) {
    try {
      // Ruta de la galeria
      const pathFolder = path.join(process.cwd(), `/public/gallery/${eventId}`);
      if (!fs.existsSync(pathFolder)) {
        fs.mkdirSync(pathFolder, { recursive: true });
      }

      // Guardar archivos
      files.forEach(async (file) => {
        const fileName = file.originalname;
        fs.writeFileSync(path.join(pathFolder, fileName), file.buffer);
        await this.galleryService.create({
          name: fileName,
          path: `public/gallery/${eventId}/${fileName}`,
          size: file.size,
          type: file.mimetype,
          created_At: new Date(),
          updated_At: new Date(),
          event: {
            connect: {
              id: eventId,
            },
          },
        });
      });

      return res.status(201).json({ message: 'Imagenes almacenadas' });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  // Obtener todas las imagenes de la galeria por evento
  @Get(':eventId')
  async findAllGalleryImages(@Param('eventId') eventId: string, @Res() res) {
    try {
      const images = await this.galleryService.findAll(eventId);
      return res.status(200).json(images);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  // Eliminar imagen de la galeria
  @Delete(':id')
  async deleteGalleryImage(@Param('id') id: string, @Res() res) {
    try {
      const image = await this.galleryService.delete(id);
      const pathImage = path.join(process.cwd(), `/${image.path}`);
      fs.unlinkSync(pathImage);
      return res.status(200).json({ message: 'Imagen eliminada' });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
}
