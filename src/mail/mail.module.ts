import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { join } from 'path';
import { MailerModule } from '@nestjs-modules/mailer';
import { MailController } from './mail.controller';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { FeedbackService } from '../feeback/feedback.service';
import { PrismaService } from '../prisma/prisma.service';

// console.log('dir',__dirname);
@Module({
  imports: [
    
    MailerModule.forRoot({
      // Relay por variable de entorno. Estaba escrito a mano aqui, asi que la
      // configuracion SMTP del servidor no se usaba. Sin variables queda el
      // mismo relay interno de antes, para no cambiar el correo que ya sale.
      transport: {
        host: process.env.MAIL_HOST || '10.25.1.68',
        port: Number(process.env.MAIL_PORT) || 587,
        secure: process.env.MAIL_SECURE === 'true',
        ignoreTLS: process.env.MAIL_SECURE !== 'true',
        ...(process.env.MAIL_USER
          ? {
              auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASSWORD,
              },
            }
          : {}),
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
  providers: [MailService, FeedbackService, PrismaService],
  exports: [MailService, MailerModule],
  controllers: [MailController], // 👈 export for DI
})
export class MailModule {}
