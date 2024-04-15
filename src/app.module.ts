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
import { GalleryModule } from './gallery/gallery.module';
import { StructureOrganizationalModule } from './structure-organizational/structure-organizational.module';
import { NewsCategoryModule } from './news-category/news-category.module';
import { EventCategoryModule } from './event-category/event-category.module';
import { ServiceModule } from './service/service.module';
import { ExportModule } from './export/export.module';
import { ProductModule } from './product/product.module';
import { SectorModule } from './sector/sector.module';
import { DocsModule } from './docs/docs.module';
import { ScheduleModule } from './schedule/schedule.module';

@Module({
  imports: [
    SectionModule,
    SubsectionModule,
    DocumentsModule,
    NewsModule,
    FilesModule,
    EventsModule,
    GalleryModule,
    StructureOrganizationalModule,
    NewsCategoryModule,
    EventCategoryModule,
    ServiceModule,
    ExportModule,
    ProductModule,
    SectorModule,
    DocsModule,
    ScheduleModule,
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
