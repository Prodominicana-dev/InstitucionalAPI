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
import { GalleryDto, GalleryUpdateDto } from './dto/gallery.dto';
import { PhotoDto } from './dto/photo.dto';

const fs = require('fs');
const path = require('path');
const CryptoJS = require('crypto-js');

@Controller('apiv2/gallery')
export class GalleryController {
  constructor(private readonly galleryService: GalleryService) {}
  y;

  // Crear una galería de imágenes

  @Post()
  @UseInterceptors(FilesInterceptor('image'))
  async createGalleryImage(
    @Body() body: GalleryDto,
    @UploadedFiles() files,
    @Res() res: Response,
  ) {
    try {
      // const id = res.req.headers.authorization;
      // const idBytes = CryptoJS.AES.decrypt(id, process.env.CRYPTO_KEY);
      // const idDecrypted = idBytes.toString(CryptoJS.enc.Utf8);
      // const auth0Token = await validateUser(idDecrypted, 'create:news');
      // if (!auth0Token) return res.status(401).json({ error: 'Unauthorized' });
      const gallery = await this.galleryService.create(body);
      if (files) {
        files.forEach(async (file) => {
          const pathFolder = path.join(
            process.cwd(),
            `/public/gallery/${gallery.id}`,
          );
          if (!fs.existsSync(pathFolder)) {
            fs.mkdirSync(pathFolder, { recursive: true });
          }
          const fileName = file.originalname;
          if (fileName !== gallery.cover) {
            const data: PhotoDto = {
              name: fileName,
              galleryId: gallery.id,
              size: file.size.toString(),
              created_By: body.created_By,
            };
            const photo = await this.galleryService.createPhoto(data);
            if (photo)
              await fs.writeFileSync(
                path.join(pathFolder, fileName),
                file.buffer,
              );
          } else {
            await fs.writeFileSync(
              path.join(pathFolder, fileName),
              file.buffer,
            );
          }
        });
      }
      return res.status(201).json(gallery);
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: error.message });
    }
  }

  // Editar una gallery
  @Patch(':id')
  @UseInterceptors(FilesInterceptor('image'))
  async updateGalleryImage(
    @Param('id') id: string,
    @Body() body: GalleryUpdateDto,
    @UploadedFiles() files,
    @Res() res: Response,
  ) {
    try {
      // const id = res.req.headers.authorization;
      // const idBytes = CryptoJS.AES.decrypt(id, process.env.CRYPTO_KEY);
      // const idDecrypted = idBytes.toString(CryptoJS.enc.Utf8);
      // const auth0Token = await validateUser(idDecrypted, 'create:news');
      // if (!auth0Token) return res.status(401).json({ error: 'Unauthorized' });
      const gallery = await this.galleryService.getById(id);
      if (!gallery) return res.status(404).json({ error: 'Gallery not found' });
      if (files) {
        files.forEach(async (file) => {
          const pathFolder = path.join(
            process.cwd(),
            `/public/gallery/${gallery.id}`,
          );
          if (!fs.existsSync(pathFolder)) {
            fs.mkdirSync(pathFolder);
          }
          // Delete old file (image)
          const files = fs.readdirSync(pathFolder);
          files.forEach((file) => {
            if (file === gallery.cover) {
              fs.unlinkSync(path.join(pathFolder, file));
            }
          });
          const fileName = file.originalname;
          await fs.writeFileSync(path.join(pathFolder, fileName), file.buffer);
        });
      }
      const updatedGallery = await this.galleryService.update(id, body);
      return res.status(200).json(updatedGallery);
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: error.message });
    }
  }

  // Activar una galería
  @Patch(':id/enable')
  async enableGalleryImage(
    @Param('id') id: string,
    @Body() body: GalleryUpdateDto,
    @Res() res,
  ) {
    try {
      // const id = res.req.headers.authorization;
      // const idBytes = CryptoJS.AES.decrypt(id, process.env.CRYPTO_KEY);
      // const idDecrypted = idBytes.toString(CryptoJS.enc.Utf8);
      // const auth0Token = await validateUser(idDecrypted, 'create:news');
      // if (!auth0Token) return res.status(401).json({ error: 'Unauthorized' });
      const gallery = await this.galleryService.enable(id, body);
      return res.status(200).json(gallery);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  // Desactivar una galería
  @Patch(':id/disable')
  async disableGalleryImage(
    @Param('id') id: string,
    @Body() body: GalleryUpdateDto,
    @Res() res,
  ) {
    try {
      // const id = res.req.headers.authorization;
      // const idBytes = CryptoJS.AES.decrypt(id, process.env.CRYPTO_KEY);
      // const idDecrypted = idBytes.toString(CryptoJS.enc.Utf8);
      // const auth0Token = await validateUser(idDecrypted, 'create:news');
      // if (!auth0Token) return res.status(401).json({ error: 'Unauthorized' });
      const gallery = await this.galleryService.disable(id, body);
      return res.status(200).json(gallery);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  // Obtener todas las galerías
  @Get()
  async findAllGalleryImages(@Res() res: Response) {
    try {
      const images = await this.galleryService.findAll();
      return res.status(200).json(images);
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: error.message });
    }
  }

  // Obtener una galería por id
  @Get(':id')
  async findOneGalleryImage(@Param('id') id: string, @Res() res: Response) {
    try {
      const image = await this.galleryService.getById(id);
      if (!image) return res.status(404).json({ error: 'Gallery not found' });
      return res.status(200).json(image);
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: error.message });
    }
  }

  // Eliminar una galería
  @Delete(':id')
  async deleteGalleryImage(@Param('id') id: string, @Res() res: Response) {
    try {
      // const id = res.req.headers.authorization;
      // const idBytes = CryptoJS.AES.decrypt(id, process.env.CRYPTO_KEY);
      // const idDecrypted = idBytes.toString(CryptoJS.enc.Utf8);
      // const auth0Token = await validateUser(idDecrypted, 'create:news');
      // if (!auth0Token) return res.status(401).json({ error: 'Unauthorized' });
      const gallery = await this.galleryService.getById(id);
      const galleryDeleted = await this.galleryService.delete(id);
      if (!galleryDeleted)
        return res.status(404).json({ error: 'Gallery not found' });
      if (!gallery) return res.status(404).json({ error: 'Gallery not found' });
      const pathFolder = path.join(
        process.cwd(),
        `/public/gallery/${gallery.id}`,
      );
      await rimraf(pathFolder);
      return res.status(200).json({ message: 'Gallery deleted' });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: error.message });
    }
  }

  // Agregar fotos a una galería
  @Post(':id/photo')
  @UseInterceptors(FilesInterceptor('images'))
  async createPhoto(
    @Param('id') id: string,
    @Body() body: PhotoDto,
    @UploadedFiles() files,
    @Res() res: Response,
  ) {
    try {
      // const id = res.req.headers.authorization;
      // const idBytes = CryptoJS.AES.decrypt(id, process.env.CRYPTO_KEY);
      // const idDecrypted = idBytes.toString(CryptoJS.enc.Utf8);
      // const auth0Token = await validateUser(idDecrypted, 'create:news');
      // if (!auth0Token) return res.status(401).json({ error: 'Unauthorized' });
      const gallery = await this.galleryService.getById(id);
      console.log(id);
      if (!gallery) return res.status(404).json({ error: 'Gallery not found' });
      if (files) {
        files.forEach(async (file) => {
          const pathFolder = path.join(
            process.cwd(),
            `/public/gallery/${gallery.id}`,
          );
          if (!fs.existsSync(pathFolder)) {
            fs.mkdirSync(pathFolder, { recursive: true });
          }
          const fileName = file.originalname;

          const data: PhotoDto = {
            name: fileName,
            galleryId: gallery.id,
            size: file.size.toString(),
            created_By: body.created_By,
          };
          const photo = await this.galleryService.createPhoto(data);
          if (photo)
            await fs.writeFileSync(
              path.join(pathFolder, fileName),
              file.buffer,
            );
        });
      }
      return res.status(201).json({ message: 'Photos added' });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: error.message });
    }
  }

  // Obtener todas las fotos de una galería
  @Get(':id/photo')
  async findAllPhotos(@Param('id') id: string, @Res() res: Response) {
    try {
      const gallery = await this.galleryService.getById(id);
      if (!gallery) return res.status(404).json({ error: 'Gallery not found' });
      const photos = await this.galleryService.findAllPhotos(id);
      return res.status(200).json(photos);
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: error.message });
    }
  }

  // Eliminar una foto de una galería
  @Delete(':id/photo/:photoId')
  async deletePhoto(
    @Param('id') id: string,
    @Param('photoId') photoId: string,
    @Res() res: Response,
  ) {
    try {
      // const id = res.req.headers.authorization;
      // const idBytes = CryptoJS.AES.decrypt(id, process.env.CRYPTO_KEY);
      // const idDecrypted = idBytes.toString(CryptoJS.enc.Utf8);
      // const auth0Token = await validateUser(idDecrypted, 'create:news');
      // if (!auth0Token) return res.status(401).json({ error: 'Unauthorized' });
      const gallery = await this.galleryService.getById(id);
      if (!gallery) return res.status(404).json({ error: 'Gallery not found' });
      const photo = await this.galleryService.deletePhoto(photoId);
      if (!photo) return res.status(404).json({ error: 'Photo not found' });
      const pathFolder = path.join(
        process.cwd(),
        `/public/gallery/${gallery.id}`,
      );
      await fs.unlinkSync(path.join(pathFolder, photo.name));
      return res.status(200).json({ message: 'Photo deleted' });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: error.message });
    }
  }
}
