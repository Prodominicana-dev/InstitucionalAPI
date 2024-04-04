import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Res,
  UseInterceptors,
  UploadedFiles,
  StreamableFile,
} from '@nestjs/common';
import { ServiceService } from './service.service';
import { FilesInterceptor } from '@nestjs/platform-express';
import { rimraf } from 'rimraf';
const CryptoJS = require('crypto-js');
import { Response } from 'express';

const fs = require('fs');
const path = require('path');
const mime = require('mime-types');

@Controller('apiv2/service')
export class ServiceController {
  constructor(private serviceService: ServiceService) {}

  // SERVICE CATEGORY

  // Crear
  @Post('category')
  async createServiceCategory(@Body() data: any, @Res() res: any) {
    try {
      const result = await this.serviceService.createServiceCategory(data);
      return res.status(201).json(result);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  // Editar
  @Patch('category/:id')
  async updateServiceCategory(
    @Param('id') id: string,
    @Body() data: any,
    @Res() res: any,
  ) {
    try {
      const result = await this.serviceService.updateServiceCategory(id, data);
      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  // Eliminar
  @Delete('category/:id')
  async deleteServiceCategory(@Param('id') id: string, @Res() res: any) {
    try {
      const result = await this.serviceService.deleteServiceCategory(id);
      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  // Obtener todos
  @Get('categories')
  async serviceCategories(@Res() res: any) {
    try {
      const result = await this.serviceService.serviceCategories();
      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  // Obtener por ID
  @Get('category/:id')
  async serviceCategory(@Param('id') id: string, @Res() res: any) {
    try {
      const result = await this.serviceService.serviceCategory(id);
      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  // SERVICE TYPE

  // Crear
  @Post('type')
  async createServiceType(@Body() data: any, @Res() res: any) {
    try {
      const result = await this.serviceService.createServiceType(data);
      return res.status(201).json(result);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  // Editar
  @Patch('type/:id')
  async updateServiceType(
    @Param('id') id: string,
    @Body() data: any,
    @Res() res: any,
  ) {
    try {
      const result = await this.serviceService.updateServiceType(id, data);
      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  // Eliminar
  @Delete('type/:id')
  async deleteServiceType(@Param('id') id: string, @Res() res: any) {
    try {
      const result = await this.serviceService.deleteServiceType(id);
      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  // Obtener todos
  @Get('types')
  async serviceTypes(@Res() res: any) {
    try {
      const result = await this.serviceService.serviceTypes();
      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  // Obtener por ID
  @Get('type/:id')
  async serviceType(@Param('id') id: string, @Res() res: any) {
    try {
      const result = await this.serviceService.serviceType(id);
      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  // SERVICE

  // Crear
  @Post()
  @UseInterceptors(FilesInterceptor('image'))
  async createService(
    @Body() data: any,
    @Res() res: any,
    @UploadedFiles() images: any,
  ) {
    try {
      console.log(data);
      const result = await this.serviceService.createService(data);
      if (!images) return res.status(201).json(result);
      await images.forEach(async (file) => {
        const pathFolder = path.join(
          process.cwd(),
          `/public/service/${result.id}`,
        );
        if (!fs.existsSync(pathFolder)) {
          fs.mkdirSync(pathFolder, { recursive: true });
        }
        const fileName = `${new Date().getTime()}.${mime.extension(file.mimetype)}`;
        await fs.writeFileSync(path.join(pathFolder, fileName), file.buffer);
        await this.serviceService.updateService(result.id, {
          image: fileName,
        });
      });
      return res.status(201).json(result);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  // Editar
  @Patch(':id')
  @UseInterceptors(FilesInterceptor('image'))
  async updateService(
    @Param('id') id: string,
    @Body() data: any,
    @Res() res: any,
    @UploadedFiles() images: any,
  ) {
    try {
      const result = await this.serviceService.updateService(id, data);
      if (!images) return res.status(200).json(result);
      /* Crear ruta de las noticias */
      const pathFolder = path.join(process.cwd(), `/public/service/${id}`);

      /* Eliminar la carpeta, si existe */
      await rimraf(pathFolder);

      if (!fs.existsSync(pathFolder)) {
        fs.mkdirSync(pathFolder, { recursive: true });
      }
      /* Guardar archivos */
      await images.forEach(async (file) => {
        const fileName = `${new Date().getTime()}.${mime.extension(file.mimetype)}`;
        await fs.writeFileSync(path.join(pathFolder, fileName), file.buffer);
        result.image = `${fileName}`;
      });
      await this.serviceService.updateService(result.id, {
        image: result.image,
      });
      return res.status(200).json({ message: 'Servicio actualizado' });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  @Get('/images/:id/:name')
  getImages(
    @Param('id') id: string,
    @Param('name') imageName: string,
    @Res({ passthrough: true }) res: Response,
  ): StreamableFile {
    // res.set({ 'Content-Type': 'image/jpeg' });
    const imagePath = path.join(
      process.cwd(),
      `public/service/${id}`,
      imageName,
    );
    const mimeType = mime.lookup(imageName);
    if (!mimeType) {
      return undefined;
    }
    const fileStream = fs.createReadStream(imagePath);
    const streamableFile = new StreamableFile(fileStream);
    streamableFile.options.type = mimeType;
    return streamableFile;
  }

  // Eliminar
  @Delete(':id')
  async deleteService(@Param('id') id: string, @Res() res: any) {
    try {
      const result = await this.serviceService.deleteService(id);
      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  // Obtener todos
  @Get()
  async services(@Res() res: any) {
    try {
      const result = await this.serviceService.services();
      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  // Obtener servicios de una categoría (Inversión)
  @Get('category/c/:cat')
  async investmentServices(@Param('cat') category: string, @Res() res: any) {
    try {
      if (category === 'investment') {
        const result = await this.serviceService.servicesByCategory('inversi');
        return res.status(200).json(result);
      }
      if (category === 'export') {
        const result =
          await this.serviceService.servicesByCategory('exportaci');
        return res.status(200).json(result);
      }
      return res.status(404).json({ message: 'Categoría no encontrada' });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  // Obtener por ID
  @Get(':id')
  async service(@Param('id') id: string, @Res() res: any) {
    try {
      const result = await this.serviceService.service(id);
      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  // Obtener por idioma
  @Get('lng/:lang')
  async servicesByLang(@Param('lang') lang: string, @Res() res: any) {
    try {
      const result = await this.serviceService.servicesByLanguage(lang);
      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  // Obtener por id y idioma
  @Get(':lang/:id')
  async serviceByLang(
    @Param('id') id: string,
    @Param('lang') lang: string,
    @Res() res: any,
  ) {
    try {
      const result = await this.serviceService.serviceByLanguage(id, lang);
      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }
}
