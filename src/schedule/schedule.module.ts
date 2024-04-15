import { Module } from '@nestjs/common';
import { ScheduleService } from './schedule.service';
import { ScheduleController } from './schedule.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  providers: [ScheduleService, PrismaService],
  controllers: [ScheduleController],
})
export class ScheduleModule {}
