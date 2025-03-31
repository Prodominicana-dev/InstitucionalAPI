import { Module } from '@nestjs/common';
import { RatingServiceController } from './rating-service.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { RatingServiceService } from './rating-service.service';

@Module({
  controllers: [RatingServiceController],
  providers:[RatingServiceService,PrismaService]
})
export class RatingServiceModule {}
