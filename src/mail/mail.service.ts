import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MailService {
  constructor(private mailerService: MailerService) {}

//esta de debajo
  async newAlertaComercialMail(title, type, description, image, email) {
    await this.mailerService.sendMail({
      to: email,
      subject: `ProInteligencia - Nueva alerta comercial`,
      template: './saim',
      context: {
        title,
        type,
        description,
        imageUrl: image,
      },
    });
  }

  async complaint(title, type, description, image, email) {
    await this.mailerService.sendMail({
      to: email,
      subject: `Nueva queja o denuncia via prodominicana.gob.do`,
      template: './complaint',
      context: {
        title,
        type,
        description,
        imageUrl: image,
      },
    });
  }
}
