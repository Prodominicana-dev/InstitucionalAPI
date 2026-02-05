import { Module } from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { FeedbackController } from './feedback.controller';
import { FeedbackResponsibleController } from './feedback-responsible.controller';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { FeedbackResponsibleService } from './feedback-responsible.service';

@Module({
  controllers: [FeedbackController, FeedbackResponsibleController],
  providers: [
    FeedbackService,
    FeedbackResponsibleService,
    PrismaService, // Solo para Feedback, no para FeedbackResponsible
    MailService,
  ],
  exports: [FeedbackResponsibleService],
})
export class FeedbackModule {}