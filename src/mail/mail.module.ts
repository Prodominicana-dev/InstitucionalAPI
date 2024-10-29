import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { join } from 'path';
import { MailerModule } from '@nestjs-modules/mailer';
import { MailController } from './mail.controller';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';

// console.log('dir',__dirname);
@Module({
  imports: [
    
    MailerModule.forRoot({
      transport: {
        host: '10.25.1.68',
        port: 587,
        secure: false,
        ignoreTLS: true,
      },
      defaults: {
        from: 'Institucional-No Reply <no-reply@prodominicana.gob.do>',
      },
      template: {
        dir: join(process.cwd(), 'src', 'mail', 'templates'), 
        adapter: new HandlebarsAdapter(),
        // or new PugAdapter() or new EjsAdapter()
        options: {
          strict: true,
        },
      },
    }),
  ],
  providers: [MailService],
  exports: [MailService],
  controllers: [MailController], // 👈 export for DI
})
export class MailModule {}
