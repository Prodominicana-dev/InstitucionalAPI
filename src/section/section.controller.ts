import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { SectionService } from './section.service';
import { validateUser } from 'src/validation/validation';
import { Response } from 'express';
const CryptoJS = require('crypto-js');
const fs = require('fs');
const path = require('path');

@Controller('apiv2/section')
export class SectionController {
  constructor(private readonly sectionService: SectionService) {}

  /* Crear una seccion */
  @Post()
  async create(@Body() body, @Res() res) {
    try {
      const id = res.req.headers.authorization;
      const idBytes = CryptoJS.AES.decrypt(id, process.env.CRYPTO_KEY);
      const idDecrypted = idBytes.toString(CryptoJS.enc.Utf8);
      const auth0Token = await validateUser(idDecrypted, 'create:transparency');
      if (!auth0Token) return res.status(401).json({ error: 'Unauthorized' });
      const section = await this.sectionService.create(body);
      return res.status(201).json(section);
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error });
    }
  }

  /* Editar una seccion */
  @Patch(':id')
  async update(@Param('id') id: string, @Body() body, @Res() res) {
    try {
      const _id = res.req.headers.authorization;
      const idBytes = CryptoJS.AES.decrypt(_id, process.env.CRYPTO_KEY);
      const idDecrypted = idBytes.toString(CryptoJS.enc.Utf8);
      const auth0Token = await validateUser(idDecrypted, 'update:transparency');
      if (!auth0Token) return res.status(401).json({ error: 'Unauthorized' });
      const section = await this.sectionService.update(id, body);
      return res.status(200).json(section);
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error });
    }
  }

  /* Obtener una seccion en especifico */
  @Get(':id')
  async getById(@Param('id') id: string, @Res() res) {
    try {
      const section = await this.sectionService.getById(id);
      return res.status(200).json(section);
    } catch (error) {
      return res.status(404).json({ error });
    }
  }

  /* Obtener todas las secciones */
  @Get()
  async getAllSections(@Res() res) {
    try {
      const sections = await this.sectionService.getAllSections();
      return res.status(200).json(sections);
    } catch (error) {
      return res.status(404).json({ error });
    }
  }

  /* Obtener todas las secciones, incluyendo las que estan deshabilitadas */
  @Get('/adm/all')
  async getAllSectionsAdmin(@Res() res) {
    try {
      const sections = await this.sectionService.getAllSectionsAdmin();
      return res.status(200).json(sections);
    } catch (error) {
      return res.status(404).json({ error });
    }
  }

  // Get filters for transparency by sectionID
  @Get('/filters/:id')
  async getFilters(@Param('id') id: string, @Res() res) {
    try {
      const filters = await this.sectionService.filterByDate(id);
      return res.status(200).json(filters);
    } catch (error) {
      return res.status(404).json({ error });
    }
  }

  /* Activar una seccion en especifico */
  @Patch('/adm/activate/:id')
  async enable(@Param('id') id: string, @Res() res) {
    try {
      const _id = res.req.headers.authorization;
      const idBytes = CryptoJS.AES.decrypt(_id, process.env.CRYPTO_KEY);
      const idDecrypted = idBytes.toString(CryptoJS.enc.Utf8);
      const auth0Token = await validateUser(idDecrypted, 'update:transparency');
      if (!auth0Token) return res.status(401).json({ error: 'Unauthorized' });
      const section = await this.sectionService.enable(id);
      return res.status(200).json(section);
    } catch (error) {
      return res.status(500).json({ error });
    }
  }

  /* Desactivar una seccion en especifico */
  @Patch('/adm/deactivate/:id')
  async disable(@Param('id') id: string, @Res() res) {
    try {
      const _id = res.req.headers.authorization;
      const idBytes = CryptoJS.AES.decrypt(_id, process.env.CRYPTO_KEY);
      const idDecrypted = idBytes.toString(CryptoJS.enc.Utf8);
      const auth0Token = await validateUser(idDecrypted, 'update:transparency');
      if (!auth0Token) return res.status(401).json({ error: 'Unauthorized' });
      const section = await this.sectionService.disable(id);
      return res.status(200).json(section);
    } catch (error) {
      return res.status(500).json({ error });
    }
  }

  /* Eliminar una seccion en especifico */
  @Delete(':id')
  async delete(@Param('id') id: string, @Res() res) {
    try {
      const _id = res.req.headers.authorization;
      const idBytes = CryptoJS.AES.decrypt(_id, process.env.CRYPTO_KEY);
      const idDecrypted = idBytes.toString(CryptoJS.enc.Utf8);
      const auth0Token = await validateUser(idDecrypted, 'delete:transparency');
      if (!auth0Token) return res.status(401).json({ error: 'Unauthorized' });
      const section = await this.sectionService.deleteS(id);
      return res.status(200).json(section);
    } catch (error) {
      return res.status(500).json({ error });
    }
  }

  // Descargar los documentos PDF de una seccion
  @Get('pdf/:id/:pdfName')
  getPostPdf(
    @Param('id') id: string,
    @Param('pdfName') pdfName: string,
    @Res({ passthrough: true }) res: Response,
  ): StreamableFile {
    res.set({ 'Content-Type': 'application/pdf' });
    const pdfPath = path.join(process.cwd(), `public/docs/${id}`, pdfName);
    const fileStream = fs.createReadStream(pdfPath);
    const streamableFile = new StreamableFile(fileStream);
    return streamableFile;
  }

  // Descargar los documentos EXCEL de una seccion
  @Get('excel/:id/:excelName')
  getPostExcel(
    @Param('id') id: string,
    @Param('excelName') excelName: string,
    @Res({ passthrough: true }) res: Response,
  ): StreamableFile {
    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const excelPath = path.join(process.cwd(), `public/docs/${id}`, excelName);
    const fileStream = fs.createReadStream(excelPath);
    const streamableFile = new StreamableFile(fileStream);
    return streamableFile;
  }
}
