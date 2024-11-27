import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import nodemailer from 'nodemailer';

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
    try {
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
   
    } catch (error) {
      console.error('Error al enviar el correo:', error.message || error);
    }
  }
  async serviceForm(toemail, name, lastName, message, email, contact, id, Phone) {

    await this.mailerService.sendMail({
      to: toemail,
      subject: `Nueva aplicación de servicio via prodominicana.gob.do`,
      template: './servicesForm',
      context: {
        name,
        lastName,
        email,
        message,
        contact,
        Phone,
        id
      },
    });
  }
  
  async servicesUser(toemail, url){
    // console.log('toemail:', toemail);
    // console.log('url:', url);
    
    await this.mailerService.sendMail({
      to: toemail,
      subject: `Revista enviada via prodominicana.gob.do`,
      template: './servicesUsers',
      context: {
        url,
        year: new Date().getFullYear(),
      },
      attachments: [
        {
          filename: 'prodominicana.png',
          path: './images/prodominicana.png',
          cid: 'logoProdominicana',
        },
      ],
    });
  }

}
