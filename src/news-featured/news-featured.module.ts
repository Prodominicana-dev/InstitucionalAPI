import { Module } from '@nestjs/common';
import { NewsFeaturedService } from './news-featured.service';
import { NewsFeaturedController } from './news-featured.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  providers: [NewsFeaturedService, PrismaService],
  controllers: [NewsFeaturedController],
})
export class NewsFeaturedModule {}
