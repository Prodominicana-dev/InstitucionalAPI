import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
import { SectionModule } from './section/section.module';
import { SubsectionModule } from './subsection/subsection.module';
import { DocumentsModule } from './documents/documents.module';
import { NewsModule } from './news/news.module';
import { FilesModule } from './files/files.module';
import { EventsModule } from './events/events.module';

@Module({
  imports: [
    SectionModule,
    SubsectionModule,
    DocumentsModule,
    NewsModule,
    FilesModule,
    EventsModule,
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
