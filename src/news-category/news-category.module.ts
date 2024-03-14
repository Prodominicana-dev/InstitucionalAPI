import { Module } from '@nestjs/common';
import { NewsCategoryService } from './news-category.service';
import { NewsCategoryController } from './news-category.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  providers: [NewsCategoryService, PrismaService],
  controllers: [NewsCategoryController],
  exports: [NewsCategoryService],
})
export class NewsCategoryModule {}
