import { Module } from '@nestjs/common';
import { EventCategoryController } from './event-category.controller';
import { EventCategoryService } from './event-category.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [EventCategoryController],
  providers: [EventCategoryService, PrismaService],
  exports: [EventCategoryService],
})
export class EventCategoryModule {}
