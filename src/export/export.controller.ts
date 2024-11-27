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
import { ExportService } from './export.service';
import { Response } from 'express';
import { FilesInterceptor } from '@nestjs/platform-express';
import { rimraf } from 'rimraf';
const CryptoJS = require('crypto-js');

const fs = require('fs');
const path = require('path');
const mime = require('mime-types');

@Controller('apiv2/export')
export class ExportController {
  constructor(private exportService: ExportService) {}

  // Crear directorio
  @Post()
  @UseInterceptors(FilesInterceptor('images'))
  async createExporter(
    @Body() body: any,
    @Res() res: Response,
    @UploadedFiles() files?,
  ) {
    try {
      console.log(body);
      // Convertir products a array de strings
      const products = body.products.split(',');
      // Convertir sectors a array de strings
      //const sectors = body.sectors.split(',');
      //body.sectors = sectors;
      body.products = products;
      // Convertir authorized a boolean
      body.authorized = body.authorized === 'true';
      body.isWoman = body.isWoman === 'true';
      // Convertir FOB a decimal
      body.fob = parseFloat(body.fob);
      const exporter = await this.exportService.createExporter(body);
      if (files === undefined) return res.status(201).json(exporter);
      await files.forEach(async (file) => {
        const pathFolder = path.join(
          process.cwd(),
          `/public/export/${exporter.id}`,
        );
        if (!fs.existsSync(pathFolder)) {
          fs.mkdirSync(pathFolder, { recursive: true });
        }
        const fileName = `${new Date().getTime()}.${mime.extension(file.mimetype)}`;
        await fs.writeFileSync(path.join(pathFolder, fileName), file.buffer);
        await this.exportService.update(exporter.id, {
          image: fileName,
        });
      });
      return res.status(201).json(exporter);
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error });
    }
  }

  // Editar exportador
  @Patch(':id')
  @UseInterceptors(FilesInterceptor('images'))
  async updateExporter(
    @Param('id') id: string,
    @Body() body: any,
    @Res() res: Response,
    @UploadedFiles() files?,
  ) {
    try {
      const products = body.products.split(',');
      // Convertir sectors a array de strings
      //const sectors = body.sectors.split(',');
      //body.sectors = sectors;
      body.products = products;
      // Convertir authorized a boolean
      body.authorized = body.authorized === 'true';
      body.isWoman = body.isWoman === 'true';
      // Convertir FOB a decimal
      body.fob = parseFloat(body.fob);
      const exporter = await this.exportService.updateExporter(id, body);
      if (files === undefined || files.length === 0) {
        return res.status(200).json(exporter);
      }
      const pathFolder = path.join(process.cwd(), `/public/export/${id}`);
      await rimraf(pathFolder);

      await files.forEach(async (file) => {
        if (!fs.existsSync(pathFolder)) {
          fs.mkdirSync(pathFolder, { recursive: true });
        }
        const fileName = `${new Date().getTime()}.${mime.extension(file.mimetype)}`;
        await fs.writeFileSync(path.join(pathFolder, fileName), file.buffer);
        await this.exportService.update(id, {
          image: fileName,
        });
      });
      return res.status(200).json(exporter);
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error });
    }
  }

  // Eliminar exportador
  @Delete(':id')
  async deleteExporter(@Param('id') id: string, @Res() res: Response) {
    try {
      const exporter = await this.exportService.deleteExporter(id);
      // Eliminar carpeta con imagenes
      const pathFolder = path.join(process.cwd(), `/public/export/${id}`);
      if (!fs.existsSync) {
        return res.status(200).json(exporter);
      }
      await rimraf(pathFolder);
      return res.status(200).json(exporter);
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error });
    }
  }

  // Obtener todos los exportadores
  @Get()
  async getExporters(@Res() res: Response) {
    try {
      const exporters = await this.exportService.exporters();
      return res.status(200).json(exporters);
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error });
    }
  }

  // Obtener todas las provincias
  @Get('/provinces')
  async getProvinces(@Res() res: Response) {
    try {
      const provinces = await this.exportService.getProvinces();
      return res.status(200).json(provinces);
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error });
    }
  }
  // Obtener exportadores por pagination
  @Post('/pagination')
  async getExportersPagination(
    @Body('perPage') perPage: number,
    @Body('page') page: number,
    @Body('search') search: string,
    @Body('selectedProduct') product: string,
    @Body('selectedSector') sector: string,
    @Body('selectedProvince') province: string,
    @Body('selectedisWoman') isWoman: string,
    @Body('isAuthorized') isAuthorized: boolean,
    @Res() res: Response,
  ) {
    try {
      const exporters = await this.exportService.exportersPaginate(
        page,
        perPage,
        search,
        product,
        sector,
        province,
        isWoman === 'true',
        isAuthorized,
      );

      return res.status(200).json(exporters);
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error });
    }
  }

  // Obtener exportador por RNC
  @Get(':rnc')
  async getExporter(@Param('rnc') rnc: string, @Res() res: Response) {
    try {
      const exporter = await this.exportService.exporter(rnc);
      return res.status(200).json(exporter);
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error });
    }
  }

  // Obtener los mejores exportadores
  @Get('top')
  async getTopExporters(@Res() res: Response) {
    try {
      const exporters = await this.exportService.topExporters();
      return res.status(200).json(exporters);
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error });
    }
  }

  // Obtener imagen de exportador
  @Get('/img/:id/:name')
  getImages(
    @Param('id') id: string,
    @Param('name') imageName: string,
    @Res({ passthrough: true }) res: Response,
  ): StreamableFile {
    //res.set({ 'Content-Type': 'image/jpeg' });
    const imagePath = path.join(
      process.cwd(),
      `public/export/${id}`,
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
}
