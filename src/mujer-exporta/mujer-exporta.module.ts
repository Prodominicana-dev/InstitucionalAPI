import { Module } from '@nestjs/common';
import { InitiativesController } from './initiatives.controller';
import { InitiativesService } from './initiatives.service';
import { SubscribersController } from './subscribers.controller';
import { SubscribersService } from './subscribers.service';
import { PrismaService } from '../prisma/prisma.service';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [MailModule],
  controllers: [InitiativesController, SubscribersController],
  providers: [InitiativesService, SubscribersService, PrismaService],
})
export class MujerExportaModule {}
