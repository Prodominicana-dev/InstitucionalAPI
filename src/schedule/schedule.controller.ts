import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Res,
} from '@nestjs/common';

import { ScheduleService } from './schedule.service';

@Controller('apiv2/schedule')
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  // Crear un schedule
  @Post()
  async create(@Body() body: any, @Res() res) {
    try {
      const schedule = await this.scheduleService.create(body);
      return res.status(201).json(schedule);
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error });
    }
  }

  // Guardar el orden manual de la agenda (debe ir antes de @Patch(':id'))
  @Patch('reorder')
  async reorder(@Body() body: any, @Res() res) {
    try {
      const items = body?.items;
      if (!Array.isArray(items)) {
        return res.status(400).json({ error: 'items debe ser un arreglo' });
      }
      const schedules = await this.scheduleService.reorder(items);
      return res.status(200).json(schedules);
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error });
    }
  }

  // Editar un schedule
  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: any, @Res() res) {
    try {
      const schedule = await this.scheduleService.update(id, body);
      return res.status(200).json(schedule);
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error });
    }
  }

  // Eliminar un schedule
  @Delete(':id')
  async delete(@Param('id') id: string, @Res() res) {
    try {
      const schedule = await this.scheduleService.delete(id);
      return res.status(200).json(schedule);
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error });
    }
  }

  // Obtener todos los schedules
  @Get()
  async getAll(@Res() res) {
    try {
      const schedules = await this.scheduleService.getAll();
      return res.status(200).json(schedules);
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error });
    }
  }

  // Obtener todos los schedules publicados (debe ir antes de @Get(':id'))
  @Get('all')
  async getAllPublic(@Res() res) {
    try {
      const schedules = await this.scheduleService.getAllPublic();
      return res.status(200).json(schedules);
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error });
    }
  }

  // Obtener todos los schedules sin filtrar (debe ir antes de @Get(':id'))
  @Get('admin')
  async getAllAdmin(@Res() res) {
    try {
      const schedules = await this.scheduleService.getAllAdmin();
      return res.status(200).json(schedules);
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error });
    }
  }

  // Obtener un schedule por id
  @Get(':id')
  async getById(@Param('id') id: string, @Res() res) {
    try {
      const schedule = await this.scheduleService.getById(id);
      return res.status(200).json(schedule);
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error });
    }
  }
}
