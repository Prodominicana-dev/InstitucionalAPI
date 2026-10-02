import { Module } from '@nestjs/common';
import { NewspaperCoverService } from './newspaper-cover.service';
import { NewspaperCoverController } from './newspaper-cover.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  providers: [NewspaperCoverService, PrismaService],
  controllers: [NewspaperCoverController],
})
export class NewspaperCoverModule {}
