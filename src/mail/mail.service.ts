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
      console.log('Correo enviado exitosamente');
    } catch (error) {
      console.error('Error al enviar el correo:', error.message || error);
    }
  }
  async serviceForm(toemail, name, lastName, message, email, contact, id, Phone) {
    console.log('tu eres el to emmail',toemail);
    console.log('tu eres el  name',name);
    console.log('tu eres el  last name',lastName );
    console.log('tu eres el  message',message);
    console.log('tu eres el  emmail',email );
    console.log('tu eres el contact', contact);
    console.log('tu eres el id', id );
    console.log('tu eres el  phone', Phone );
    
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
}
