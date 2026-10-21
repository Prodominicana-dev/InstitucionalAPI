import { Module } from '@nestjs/common';
import { MujeresExportacionService } from './mujeres-exportacion.service';
import { MujeresExportacionController } from './mujeres-exportacion.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  providers: [MujeresExportacionService, PrismaService],
  controllers: [MujeresExportacionController],
})
export class MujeresExportacionModule {}
