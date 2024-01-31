import { Module } from '@nestjs/common';
import { SectionService } from './section.service';
import { SectionController } from './section.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { DocumentsModule } from 'src/documents/documents.module';
import { SubsectionModule } from 'src/subsection/subsection.module';

@Module({
  providers: [SectionService, PrismaService],
  controllers: [SectionController],
  exports: [SectionService],
  imports: [DocumentsModule],
})
export class SectionModule {}
