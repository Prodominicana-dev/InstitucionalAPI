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
import { ServiceService } from './service.service';

@Controller('apiv2/service')
export class ServiceController {
  constructor(private serviceService: ServiceService) {}

  // SERVICE CATEGORY

  // Crear
  @Post('category')
  async createServiceCategory(@Body() data: any, @Res() res: any) {
    try {
      const result = await this.serviceService.createServiceCategory(data);
      return res.status(201).json(result);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  // Editar
  @Patch('category/:id')
  async updateServiceCategory(
    @Param('id') id: string,
    @Body() data: any,
    @Res() res: any,
  ) {
    try {
      const result = await this.serviceService.updateServiceCategory(id, data);
      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  // Eliminar
  @Delete('category/:id')
  async deleteServiceCategory(@Param('id') id: string, @Res() res: any) {
    try {
      const result = await this.serviceService.deleteServiceCategory(id);
      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  // Obtener todos
  @Get('categories')
  async serviceCategories(@Res() res: any) {
    try {
      const result = await this.serviceService.serviceCategories();
      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  // Obtener por ID
  @Get('category/:id')
  async serviceCategory(@Param('id') id: string, @Res() res: any) {
    try {
      const result = await this.serviceService.serviceCategory(id);
      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  // SERVICE TYPE

  // Crear
  @Post('type')
  async createServiceType(@Body() data: any, @Res() res: any) {
    try {
      const result = await this.serviceService.createServiceType(data);
      return res.status(201).json(result);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  // Editar
  @Patch('type/:id')
  async updateServiceType(
    @Param('id') id: string,
    @Body() data: any,
    @Res() res: any,
  ) {
    try {
      const result = await this.serviceService.updateServiceType(id, data);
      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  // Eliminar
  @Delete('type/:id')
  async deleteServiceType(@Param('id') id: string, @Res() res: any) {
    try {
      const result = await this.serviceService.deleteServiceType(id);
      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  // Obtener todos
  @Get('types')
  async serviceTypes(@Res() res: any) {
    try {
      const result = await this.serviceService.serviceTypes();
      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  // Obtener por ID
  @Get('type/:id')
  async serviceType(@Param('id') id: string, @Res() res: any) {
    try {
      const result = await this.serviceService.serviceType(id);
      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  // SERVICE

  // Crear
  @Post()
  async createService(@Body() data: any, @Res() res: any) {
    try {
      console.log(data);
      const result = await this.serviceService.createService(data);
      return res.status(201).json(result);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  // Editar
  @Patch(':id')
  async updateService(
    @Param('id') id: string,
    @Body() data: any,
    @Res() res: any,
  ) {
    try {
      const result = await this.serviceService.updateService(id, data);
      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  // Eliminar
  @Delete(':id')
  async deleteService(@Param('id') id: string, @Res() res: any) {
    try {
      const result = await this.serviceService.deleteService(id);
      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  // Obtener todos
  @Get()
  async services(@Res() res: any) {
    try {
      const result = await this.serviceService.services();
      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  // Obtener por ID
  @Get(':id')
  async service(@Param('id') id: string, @Res() res: any) {
    try {
      const result = await this.serviceService.service(id);
      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  // Obtener por idioma
  @Get('lng/:lang')
  async servicesByLang(@Param('lang') lang: string, @Res() res: any) {
    try {
      const result = await this.serviceService.servicesByLanguage(lang);
      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  // Obtener por id y idioma
  @Get(':lang/:id')
  async serviceByLang(
    @Param('id') id: string,
    @Param('lang') lang: string,
    @Res() res: any,
  ) {
    try {
      const result = await this.serviceService.serviceByLanguage(id, lang);
      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }
}
