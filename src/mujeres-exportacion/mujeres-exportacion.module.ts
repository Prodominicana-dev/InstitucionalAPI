import { Module } from '@nestjs/common';
import { MujeresExportacionService } from './mujeres-exportacion.service';
import { MexCapacitaService } from './mujeres-exportacion-capacita.service';
import { MujeresExportacionController } from './mujeres-exportacion.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  providers: [MujeresExportacionService, MexCapacitaService, PrismaService],
  controllers: [MujeresExportacionController],
})
export class MujeresExportacionModule {}
