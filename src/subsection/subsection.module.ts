import { Module } from '@nestjs/common';
import { SubsectionService } from './subsection.service';
import { SubsectionController } from './subsection.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  providers: [SubsectionService, PrismaService],
  controllers: [SubsectionController],
  exports: [SubsectionService],
})
export class SubsectionModule {}
