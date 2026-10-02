import { Module } from '@nestjs/common';
import { MailModule } from '../mail/mail.module';
import { PrismaService } from '../prisma/prisma.service';
import { NewsletterService } from './newsletter.service';
import { NewsletterSendService } from './newsletter-send.service';
import { NewsletterMailService } from './newsletter-mail.service';
import { NewsletterController } from './newsletter.controller';
import { NewsletterTrackingController } from './newsletter-tracking.controller';

@Module({
  imports: [MailModule],
  providers: [
    PrismaService,
    NewsletterService,
    NewsletterMailService,
    NewsletterSendService,
  ],
  controllers: [NewsletterController, NewsletterTrackingController],
})
export class NewsletterModule {}
