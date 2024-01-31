import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Res,
} from '@nestjs/common';
import { SectionService } from './section.service';
import { validateUser } from 'src/validation/validation';
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
      return res.status(201).json({ section });
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
      return res.status(200).json({ section });
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
      return res.status(200).json({ section });
    } catch (error) {
      return res.status(404).json({ error });
    }
  }

  /* Obtener todas las secciones */
  @Get()
  async getAllSections(@Res() res) {
    try {
      const sections = await this.sectionService.getAllSections();
      return res.status(200).json({ sections });
    } catch (error) {
      return res.status(404).json({ error });
    }
  }

  /* Obtener todas las secciones, incluyendo las que estan deshabilitadas */
  @Get('/adm/all')
  async getAllSectionsAdmin(@Res() res) {
    try {
      const sections = await this.sectionService.getAllSectionsAdmin();
      return res.status(200).json({ sections });
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
      return res.status(200).json({ section });
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
      return res.status(200).json({ section });
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
      return res.status(200).json({ section });
    } catch (error) {
      return res.status(500).json({ error });
    }
  }
}
