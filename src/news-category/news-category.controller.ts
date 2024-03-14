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
import { NewsCategoryService } from './news-category.service';

@Controller('apiv2/news-category')
export class NewsCategoryController {
  constructor(private newsCategoryService: NewsCategoryService) {}

  // Crear una categoría de noticia
  @Post()
  async createNewsCategory(@Body() data: any, @Res() res: any) {
    try {
      const newsCategory =
        await this.newsCategoryService.createNewsCategory(data);
      if (!newsCategory)
        return res.status(404).json({ message: 'Categoría no creada' });
      return res.status(201).json(newsCategory);
    } catch (error) {
      return res.status(500).json(error);
    }
  }

  // Editar una categoría de noticia
  @Patch(':id')
  async updateNewsCategory(
    @Param('id') id: string,
    @Body() data: any,
    @Res() res: any,
  ) {
    try {
      const newsCategory = await this.newsCategoryService.updateNewsCategory(
        id,
        data,
      );
      if (!newsCategory)
        return res.status(404).json({ message: 'Categoría no encontrada' });
      return res.status(200).json(newsCategory);
    } catch (error) {
      return res.status(500).json(error);
    }
  }

  // Obtener todas las categorías de noticias
  @Get()
  async getNewsCategories(@Res() res: any) {
    try {
      const newsCategories = await this.newsCategoryService.getNewsCategories();
      return res.status(200).json(newsCategories);
    } catch (error) {
      return res.status(500).json(error);
    }
  }

  // Obtener una categoría de noticia por id
  @Get(':id')
  async getNewsCategoryById(@Param('id') id: string, @Res() res: any) {
    try {
      const newsCategory =
        await this.newsCategoryService.getNewsCategoryById(id);
      if (!newsCategory)
        return res.status(404).json({ message: 'Categoría no encontrada' });
      return res.status(200).json(newsCategory);
    } catch (error) {
      return res.status(500).json(error);
    }
  }

  // Eliminar una categoría de noticia
  @Delete(':id')
  async deleteNewsCategory(@Param('id') id: string, @Res() res: any) {
    try {
      const newsCategory =
        await this.newsCategoryService.deleteNewsCategory(id);
      if (!newsCategory)
        return res.status(404).json({ message: 'Categoría no encontrada' });
      return res.status(200).json(newsCategory);
    } catch (error) {
      return res.status(500).json(error);
    }
  }
}
