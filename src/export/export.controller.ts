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
      const exporter = await this.exportService.createExporter(body);
      if (files === undefined) return res.status(201).json(exporter);
      await files.forEach(async (file) => {
        const pathFolder = path.join(
          process.cwd(),
          `/public/export/${exporter.rnc}`,
        );
        if (!fs.existsSync(pathFolder)) {
          fs.mkdirSync(pathFolder, { recursive: true });
        }
        const fileName = `${new Date().getTime()}.${mime.extension(file.mimetype)}`;
        await fs.writeFileSync(path.join(pathFolder, fileName), file.buffer);
        await this.exportService.updateExporter(exporter.rnc, {
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
  @Patch(':rnc')
  @UseInterceptors(FilesInterceptor('images'))
  async updateExporter(
    @Param('rnc') rnc: string,
    @Body() body: any,
    @Res() res: Response,
    @UploadedFiles() files?,
  ) {
    try {
      const exporter = await this.exportService.updateExporter(rnc, body);
      if (files === undefined || files.length === 0) {
        return res.status(200).json(exporter);
      }
      const pathFolder = path.join(
        process.cwd(),
        `/public/export/${exporter.rnc}`,
      );
      await rimraf(pathFolder);

      await files.forEach(async (file) => {
        if (!fs.existsSync(pathFolder)) {
          fs.mkdirSync(pathFolder, { recursive: true });
        }
        const fileName = `${new Date().getTime()}.${mime.extension(file.mimetype)}`;
        await fs.writeFileSync(path.join(pathFolder, fileName), file.buffer);
        await this.exportService.updateExporter(exporter.rnc, {
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
  @Delete(':rnc')
  async deleteExporter(@Param('rnc') rnc: string, @Res() res: Response) {
    try {
      const exporter = await this.exportService.deleteExporter(rnc);
      // Eliminar carpeta con imagenes
      const pathFolder = path.join(process.cwd(), `/public/export/${rnc}`);
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

  // Obtener exportadores por pagination
  @Get('pagination/:perPage/:page')
  async getExportersPagination(
    @Param('perPage') perPage: number,
    @Param('page') page: number,
    @Res() res: Response,
  ) {
    try {
      const exporters = await this.exportService.exportersPaginate(
        page,
        perPage,
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
}
