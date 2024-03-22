import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  NotFoundException,
  Res,
  UseInterceptors,
  UploadedFiles,
  StreamableFile,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { StructureOrganizationalService } from './structure-organizational.service';
import { rimraf } from 'rimraf';
const CryptoJS = require('crypto-js');

const fs = require('fs');
const path = require('path');
const mime = require('mime-types');

@Controller('apiv2/so')
export class StructureOrganizationalController {
  constructor(
    private readonly structureOrganizationalService: StructureOrganizationalService,
  ) {}

  /* Crear un departamento */
  @Post('direction')
  async createDirection(@Body() body: any, @Res() res) {
    try {
      const direction =
        await this.structureOrganizationalService.createDirection(body);
      return res.status(201).json(direction);
    } catch (error) {
      throw new Error(error);
    }
  }

  /* Editar un departamento */
  @Patch('direction/:id')
  async updateDirection(
    @Param('id') id: string,
    @Body() body: any,
    @Res() res,
  ) {
    try {
      const direction =
        await this.structureOrganizationalService.updateDirection(id, body);
      return res.status(200).json(direction);
    } catch (error) {
      throw new Error(error);
    }
  }

  // Obtener todos los departamentos
  @Get('direction')
  async getDirections(@Res() res) {
    try {
      const directions =
        await this.structureOrganizationalService.getDirections();
      return res.status(200).json(directions);
    } catch (error) {
      throw new Error(error);
    }
  }

  /* Obtener un departamento por id */
  @Get('direction/:id')
  async getDirectionById(@Param('id') id: string, @Res() res) {
    try {
      const direction =
        await this.structureOrganizationalService.getDirectionById(id);
      if (!direction) throw new NotFoundException('Departamento no encontrado');
      return res.status(200).json(direction);
    } catch (error) {
      throw new Error(error);
    }
  }

  /* Crear un miembro */
  @Post('member')
  @UseInterceptors(FilesInterceptor('images'))
  async createMember(@Body() body: any, @Res() res, @UploadedFiles() images?) {
    try {
      const member =
        await this.structureOrganizationalService.createMember(body);

      if (images === undefined) return res.status(201).json(member);
      /* Guardar archivos */
      await images.forEach(async (file) => {
        const pathFolder = path.join(
          process.cwd(),
          `/public/member/${member.id}`,
        );
        if (!fs.existsSync(pathFolder)) {
          fs.mkdirSync(pathFolder, { recursive: true });
        }
        const fileName = `${new Date().getTime()}.${mime.extension(file.mimetype)}`;
        await fs.writeFileSync(path.join(pathFolder, fileName), file.buffer);
        await this.structureOrganizationalService.updateMember(member.id, {
          image: fileName,
        });
      });

      return res.status(201).json({ message: 'Miembro creado con éxito' });
    } catch (error) {
      throw new Error(error);
    }
  }

  /* Editar un miembro */
  @Patch('member/:id')
  @UseInterceptors(FilesInterceptor('images'))
  async updateMember(
    @Param('id') id: string,
    @Body() body: any,
    @Res() res,
    @UploadedFiles() images?,
  ) {
    try {
      const member = await this.structureOrganizationalService.updateMember(
        id,
        body,
      );
      if (images === undefined || images.length === 0) {
        return res.status(200).json(member);
      }

      /* Crear ruta de las noticias */
      const pathFolder = path.join(
        process.cwd(),
        `/public/member/${member.id}`,
      );

      /* Eliminar la carpeta, si existe */
      await rimraf(pathFolder);

      if (!fs.existsSync(pathFolder)) {
        fs.mkdirSync(pathFolder, { recursive: true });
      }
      /* Guardar archivos */
      await images.forEach(async (file) => {
        const fileName = `${new Date().getTime()}.${mime.extension(file.mimetype)}`;
        await fs.writeFileSync(path.join(pathFolder, fileName), file.buffer);
        member.image = `${fileName}`;
      });
      await this.structureOrganizationalService.updateMember(member.id, {
        image: member.image,
      });
      return res.status(200).json({ message: 'Miembro actualizado' });
    } catch (error) {
      throw new Error(error);
    }
  }

  /* Obtener todos los miembros */
  @Get(':lang/member')
  async getMembers(@Param('lang') lang: string, @Res() res) {
    try {
      // Construir el siguiente modelo de member para retornar: { name, direction, es, en, image}
      const members =
        await this.structureOrganizationalService.getMembers(lang);
      return res.status(200).json(members);
    } catch (error) {
      throw new Error(error);
    }
  }

  /* Obtener todos los miembros de un departamento */
  @Get(':lang/member/direction/:id')
  async getMembersByDirection(
    @Param('id') id: string,
    @Param('lang') lang: string,
    @Res() res,
  ) {
    try {
      // Construir el siguiente modelo de member para retornar: { name, direction, es, en, image}
      const members =
        await this.structureOrganizationalService.getMembersByDirection(
          id,
          lang,
        );
      return res.status(200).json(members);
    } catch (error) {
      throw new Error(error);
    }
  }

  /* Obtener miembro por id */
  @Get('member/:id')
  async getMemberById(@Param('id') id: string, @Res() res) {
    try {
      const member =
        await this.structureOrganizationalService.getMemberById(id);
      if (!member) throw new NotFoundException('Miembro no encontrado');
      return res.status(200).json(member);
    } catch (error) {
      throw new Error(error);
    }
  }

  /* Eliminar un miembro */
  @Delete('member/:id')
  async deleteMember(@Param('id') id: string, @Res() res) {
    try {
      const member = await this.structureOrganizationalService.deleteMember(id);
      return res.status(200).json(member);
    } catch (error) {
      throw new Error(error);
    }
  }

  /* Eliminar un departamento */
  @Delete('direction/:id')
  async deleteDirection(@Param('id') id: string, @Res() res) {
    try {
      const direction =
        await this.structureOrganizationalService.deleteDirection(id);
      return res.status(200).json(direction);
    } catch (error) {
      throw new Error(error);
    }
  }
}
