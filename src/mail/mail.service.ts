import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { log } from 'console';
import nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  constructor(private mailerService: MailerService) { }

  //esta de debajo
  async contact(toemail, nameF, lastName, message, identity, email, activity, contactCode) {
    try {
      const emailSend = await this.mailerService.sendMail({
        to: toemail,
        subject: `Nueva contacto registrado via prodominicana.gob.do`,
        template: './contact',
        context: {
          nameF,
          lastName,
          email,
          identity,
          activity,
          message,
          contactCode
        },

      });
      //  console.log('emailSend', emailSend);
      return emailSend;

    } catch (error) {
      console.error('Error al enviar el correo:', error.message || error);
    }


  }

  async complaint(toemail, name, lastName, email, companyName, departmen, involvedPerson, date, contactCode, message,) {
    try {
      await this.mailerService.sendMail({
        to: toemail,
        subject: `Nueva contacto registrado via prodominicana.gob.do`,
        template: './complaint',
        context: {
          name,
          lastName,
          email,
          departmen,
          companyName,
          message,
          date,
          involvedPerson,
          contactCode
        },
      });

    } catch (error) {
      console.error('Error al enviar el correo:', error.message || error);
    }
  }
  async sendPageEmail(email) {
    try {
      // console.log('Intentando enviar correo a:', email);
      const result = await this.mailerService.sendMail({
        to: email,
        subject: `Pagina enviada vía prodominicana.gob.do`,
        template: './sendEmailPage',
        // context: {
        //   title,
        //   type,
        //   description,
        //   imageUrl: image,
        // },
      });

      // console.log('Correo aparentemente enviado:', result);
      return result;
    } catch (error) {
      console.error('Error al enviar el correo:', error.message || error);
    }
  }
  async serviceForm(toemail, name, lastName, message, email, contact, id, Phone,contactCode) {
  // console.log('toemail:', toemail);
    try {

      const result = await this.mailerService.sendMail({
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
          contactCode,
          id
        },
      });

      // console.log('Correo enviado:', result);

      return result;
    } catch (error) {
      console.error('Error al enviar el correo:', error.message || error);
    }
  }

  async servicesUser(toemail, url) {
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

  async feedback(
    emails: string[],
    name: string,
    email: string,
    message: string,
    feedbackCode: string,
    rating?: number,
    serviceType?: string
  ) {
    try {
      // Enviar correos en paralelo a todos los responsables
      const emailPromises = emails.map(toemail =>
        this.mailerService.sendMail({
          to: toemail,
          subject: `Nuevo feedback recibido vía prodominicana.gob.do`,
          template: './newFeedback',
          context: {
            name,
            email,
            message,
            feedbackCode,
            rating,
            serviceType,
            dashboardUrl: 'https://prodominicana.gob.do/admin/feedback',
            createdAt: new Date().toLocaleString('es-DO', {
              dateStyle: 'full',
              timeStyle: 'short',
            }),
            year: new Date().getFullYear(),
          },
        })
      );

      await Promise.all(emailPromises);
      return { message: 'Emails enviados correctamente' };
    } catch (error) {
      console.error('Error al enviar el correo de feedback:', error.message || error);
    }
  }

}
