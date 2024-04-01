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
import { EventCategoryService } from './event-category.service';

@Controller('apiv2/event-category')
export class EventCategoryController {
  constructor(private readonly eventCategoryService: EventCategoryService) {}

  @Post()
  async create(@Body() data: any, @Res() response: any) {
    try {
      const eventCategory = await this.eventCategoryService.create(data);
      if (!eventCategory) {
        return response
          .status(400)
          .json({ message: 'Event category not created' });
      }
      return response.status(201).json(eventCategory);
    } catch (error) {
      return response.status(500).json({ message: error.message });
    }
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() data: any,
    @Res() response: any,
  ) {
    try {
      const eventCategory = await this.eventCategoryService.update(id, data);
      if (!eventCategory) {
        return response
          .status(400)
          .json({ message: 'Event category not updated' });
      }
      return response.status(200).json(eventCategory);
    } catch (error) {
      return response.status(500).json({ message: error.message });
    }
  }

  @Get()
  async getAll(@Res() response: any) {
    try {
      const eventCategories = await this.eventCategoryService.getAll();
      return response.status(200).json(eventCategories);
    } catch (error) {
      return response.status(500).json({ message: error.message });
    }
  }

  @Get(':id')
  async getById(@Param('id') id: string, @Res() response: any) {
    try {
      const eventCategory = await this.eventCategoryService.getById(id);
      if (!eventCategory) {
        return response
          .status(400)
          .json({ message: 'Event category not found' });
      }
      return response.status(200).json(eventCategory);
    } catch (error) {
      return response.status(500).json({ message: error.message });
    }
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Res() response: any) {
    try {
      const eventCategory = await this.eventCategoryService.delete(id);
      if (!eventCategory) {
        return response
          .status(400)
          .json({ message: 'Event category not deleted' });
      }
      return response.status(200).json(eventCategory);
    } catch (error) {
      return response.status(500).json({ message: error.message });
    }
  }
}
