import { Module } from '@nestjs/common';
import { QrDocsController } from './qr-docs.controller';

@Module({
  controllers: [QrDocsController],
})
export class QrDocsModule {}
