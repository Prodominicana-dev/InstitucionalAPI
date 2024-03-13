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
  @UseInterceptors(FilesInterceptor('image'))
  async createMember(@Body() body: any, @Res() res, @UploadedFiles() image?) {
    try {
      // Convertir de string a string[]
      body.functions = body.functions.split(',');

      const member =
        await this.structureOrganizationalService.createMember(body);

      if (image === undefined) return res.status(201).json(member);
      /* Guardar archivos */
      await image.forEach(async (file) => {
        const pathFolder = path.join(
          process.cwd(),
          `/public/member/${member.id}`,
        );
        if (!fs.existsSync(pathFolder)) {
          fs.mkdirSync(pathFolder, { recursive: true });
        }
        const fileName = file.originalname;
        await fs.writeFileSync(path.join(pathFolder, fileName), file.buffer);
      });

      return res.status(201).json(member);
    } catch (error) {
      throw new Error(error);
    }
  }

  /* Editar un miembro */
  @Patch('member/:id')
  @UseInterceptors(FilesInterceptor('image'))
  async updateMember(
    @Param('id') id: string,
    @Body() body: any,
    @Res() res,
    @UploadedFiles() image?,
  ) {
    try {
      const member = await this.structureOrganizationalService.updateMember(
        id,
        body,
      );
      if (image === undefined || image.length === 0) {
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
      await image.forEach(async (file) => {
        const fileName = file.originalname;
        await fs.writeFileSync(path.join(pathFolder, fileName), file.buffer);
        member.image = `${fileName}`;
      });
      return res.status(200).json(member);
    } catch (error) {
      throw new Error(error);
    }
  }

  /* Obtener todos los miembros */
  @Get('member')
  async getMembers(@Res() res) {
    try {
      const members = await this.structureOrganizationalService.getMembers();
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
