import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { ProductService } from './product.service';

@Controller('apiv2/product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  // Crear un producto
  @Post()
  async createProduct(@Body() body: any) {
    try {
      const product = await this.productService.createProduct(body);
      return product;
    } catch (error) {
      throw new Error(error);
    }
  }

  // Editar un producto
  @Patch(':id')
  async updateProduct(@Param('id') id: string, @Body() body: any) {
    try {
      const product = await this.productService.updateProduct(id, body);
      return product;
    } catch (error) {
      throw new Error(error);
    }
  }

  // Eliminar un producto
  @Delete(':code')
  async deleteProduct(@Param('code') code: string) {
    try {
      const product = await this.productService.deleteProduct(code);
      return product;
    } catch (error) {
      throw new Error(error);
    }
  }

  // Obtener todos los productos
  @Get()
  async products() {
    try {
      const products = await this.productService.products();
      return products;
    } catch (error) {
      throw new Error(error);
    }
  }

  // Obtener todos los productos exportados
  @Post('/exported')
  async exportedProducts(@Body() body: any) {
    try {
      const products = await this.productService.exportedProducts(body.lang);
      return products;
    } catch (error) {
      throw new Error(error);
    }
  }

  // Obtener un producto por code
  @Get(':code')
  async product(@Param('code') code: string) {
    try {
      const product = await this.productService.productByCode(code);
      return product;
    } catch (error) {
      throw new Error(error);
    }
  }
}
