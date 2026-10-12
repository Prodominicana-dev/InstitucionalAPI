import { Module } from '@nestjs/common';
import { MailModule } from '../mail/mail.module';
import { EconomicIndicatorService } from './economic-indicator.service';
import { IndicatorAlertService } from './indicator-alert.service';
import { ExchangeRateService } from './exchange-rate.service';
import { OilPriceService } from './oil-price.service';
import { EconomicIndicatorController } from './economic-indicator.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  imports: [MailModule],
  providers: [
    EconomicIndicatorService,
    IndicatorAlertService,
    ExchangeRateService,
    OilPriceService,
    PrismaService,
  ],
  controllers: [EconomicIndicatorController],
})
export class EconomicIndicatorModule {}
