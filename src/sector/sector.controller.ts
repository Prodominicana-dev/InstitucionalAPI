import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { SectorService } from './sector.service';

@Controller('apiv2/sector')
export class SectorController {
  constructor(private readonly sectorService: SectorService) {}

  // Crear un sector
  @Post()
  async createSector(@Body() body: any) {
    try {
      const sector = await this.sectorService.createSector(body);
      return sector;
    } catch (error) {
      throw new Error(error);
    }
  }

  // Editar un sector
  @Patch(':id')
  async updateSector(@Param('id') id: string, @Body() body: any) {
    try {
      const sector = await this.sectorService.updateSector(id, body);
      return sector;
    } catch (error) {
      throw new Error(error);
    }
  }

  // Eliminar un sector
  @Delete(':code')
  async deleteSector(@Param('code') code: string) {
    try {
      const sector = await this.sectorService.deleteSector(code);
      return sector;
    } catch (error) {
      throw new Error(error);
    }
  }

  // Obtener todos los sectores
  @Get()
  async sectors() {
    try {
      const sectors = await this.sectorService.sectors();
      return sectors;
    } catch (error) {
      throw new Error(error);
    }
  }

  // Obtener un sector por code
  @Get(':code')
  async sectorByCode(@Param('code') code: string) {
    try {
      const sector = await this.sectorService.sectorByCode(code);
      return sector;
    } catch (error) {
      throw new Error(error);
    }
  }
}
