import { Module } from '@nestjs/common';
import { StructureOrganizationalService } from './structure-organizational.service';
import { StructureOrganizationalController } from './structure-organizational.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  providers: [StructureOrganizationalService, PrismaService],
  controllers: [StructureOrganizationalController],
  exports: [StructureOrganizationalService],
})
export class StructureOrganizationalModule {}
