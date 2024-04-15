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
