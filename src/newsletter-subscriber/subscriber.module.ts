import { Module } from '@nestjs/common';
import { MailModule } from '../mail/mail.module';
import { PrismaService } from '../prisma/prisma.service';
import { NewsletterMailService } from '../newsletter/newsletter-mail.service';
import { SubscriberService } from './subscriber.service';
import { SubscriberController } from './subscriber.controller';

@Module({
  imports: [MailModule],
  providers: [PrismaService, NewsletterMailService, SubscriberService],
  controllers: [SubscriberController],
})
export class NewsletterSubscriberModule {}
