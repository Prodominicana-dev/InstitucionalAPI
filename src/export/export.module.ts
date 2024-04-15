import { Module } from '@nestjs/common';
import { ExportController } from './export.controller';
import { ExportService } from './export.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [ExportController],
  providers: [ExportService, PrismaService],
})
export class ExportModule {}
