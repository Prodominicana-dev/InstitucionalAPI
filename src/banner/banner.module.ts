import { Module } from '@nestjs/common';
import { BannerService } from './banner.service';
import { BannerController } from './banner.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  providers: [BannerService, PrismaService],
  controllers: [BannerController],
})
export class BannerModule {}
