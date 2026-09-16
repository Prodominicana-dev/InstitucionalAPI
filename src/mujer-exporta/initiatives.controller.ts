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
import { InitiativesService } from './initiatives.service';

@Controller('apiv2/')
export class InitiativesController {
  constructor(private readonly initiativesService: InitiativesService) {}

  /* Obtener todas las iniciativas públicas (por idioma) */
  @Get(':lang/mujer-exporta/initiatives')
  async getPublicInitiatives(@Param('lang') lang: string, @Res() res) {
    try {
      const initiatives = await this.initiativesService.findAllPublic(lang);
      return res.status(200).json(initiatives);
    } catch (error) {
      return res.status(error.status || 500).json({ error: error.message });
    }
  }

  /* Obtener todas las iniciativas (Admin) */
  @Get('mujer-exporta/initiatives/admin')
  async getAdminInitiatives(@Res() res) {
    try {
      const initiatives = await this.initiativesService.findAllAdmin();
      return res.status(200).json(initiatives);
    } catch (error) {
      return res.status(error.status || 500).json({ error: error.message });
    }
  }

  /* Obtener iniciativa por ID */
  @Get('mujer-exporta/initiatives/:id')
  async getInitiativeById(@Param('id') id: string, @Res() res) {
    try {
      const initiative = await this.initiativesService.findOne(id);
      return res.status(200).json(initiative);
    } catch (error) {
      return res.status(error.status || 404).json({ error: error.message });
    }
  }

  /* Seed - Migrar recursos estáticos */
  @Post('mujer-exporta/initiatives/seed')
  async seedInitiatives(@Body() body: any, @Res() res) {
    try {
      if (!body.recursos || !Array.isArray(body.recursos)) {
        return res.status(400).json({ error: 'Se requiere un array de recursos' });
      }
      const result = await this.initiativesService.seed(body.recursos);
      return res.status(201).json(result);
    } catch (error) {
      return res.status(error.status || 500).json({ error: error.message });
    }
  }

  /* Crear iniciativa */
  @Post('mujer-exporta/initiatives')
  async createInitiative(@Body() body: any, @Res() res) {
    try {
      const initiative = await this.initiativesService.create(body);
      return res.status(201).json(initiative);
    } catch (error) {
      return res.status(error.status || 500).json({ error: error.message });
    }
  }

  /* Editar iniciativa */
  @Patch('mujer-exporta/initiatives/:id')
  async updateInitiative(
    @Param('id') id: string,
    @Body() body: any,
    @Res() res,
  ) {
    try {
      const initiative = await this.initiativesService.update(id, body);
      return res.status(200).json(initiative);
    } catch (error) {
      return res.status(error.status || 500).json({ error: error.message });
    }
  }

  /* Habilitar iniciativa */
  @Patch('mujer-exporta/initiatives/enable/:id')
  async enableInitiative(@Param('id') id: string, @Res() res) {
    try {
      const initiative = await this.initiativesService.enable(id);
      return res.status(200).json(initiative);
    } catch (error) {
      return res.status(error.status || 500).json({ error: error.message });
    }
  }

  /* Deshabilitar iniciativa */
  @Patch('mujer-exporta/initiatives/disable/:id')
  async disableInitiative(@Param('id') id: string, @Res() res) {
    try {
      const initiative = await this.initiativesService.disable(id);
      return res.status(200).json(initiative);
    } catch (error) {
      return res.status(error.status || 500).json({ error: error.message });
    }
  }

  /* Eliminar iniciativa */
  @Delete('mujer-exporta/initiatives/:id')
  async deleteInitiative(@Param('id') id: string, @Res() res) {
    try {
      const initiative = await this.initiativesService.delete(id);
      return res.status(200).json(initiative);
    } catch (error) {
      return res.status(error.status || 500).json({ error: error.message });
    }
  }
}
