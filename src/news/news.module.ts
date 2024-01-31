import { Module } from '@nestjs/common';
import { NewsService } from './news.service';
import { NewsController } from './news.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  providers: [NewsService, PrismaService],
  controllers: [NewsController],
})
export class NewsModule {}
