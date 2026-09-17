import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { log } from 'console';
import nodemailer from 'nodemailer';

// Colores de las rutas de Mujer Exporta
const RUTA_COLORS: Record<string, { primary: string; light: string; name: string }> = {
  aprender: { primary: '#3D63D8', light: '#d8e0f7', name: 'Aprender' },
  impulsar: { primary: '#F2665E', light: '#fce0df', name: 'Impulsar' },
  exportar: { primary: '#2FB7C8', light: '#d5f1f4', name: 'Exportar' },
  conectar: { primary: '#F39A3D', light: '#fdebd8', name: 'Conectar' },
};

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

  // ==========================================
  // MUJER EXPORTA - Métodos de correo
  // ==========================================

  /**
   * Envía correo de bienvenida al suscriptor de Mujer Exporta
   */
  async meWelcome(email: string, name: string, unsubscribeToken: string) {
    try {
      await this.mailerService.sendMail({
        to: email,
        from: 'Mujer Exporta+ <mujerexportamas@prodominicana.gob.do>',
        subject: '¡Bienvenida a Mujer Exporta+!',
        template: './meWelcome',
        context: {
          name,
          unsubscribeUrl: `https://prodominicana.gob.do/mujer-exporta/unsubscribe/${unsubscribeToken}`,
          year: new Date().getFullYear(),
        },
      });
      return { success: true };
    } catch (error) {
      console.error('Error al enviar correo de bienvenida ME:', error.message || error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Envía notificación a los administradores cuando hay una nueva suscripción
   */
  async meAdminNotification(subscriber: {
    name: string;
    email: string;
    company?: string;
    phone?: string;
    sector?: string;
  }) {
    const adminEmails = [
      'carolinaperez@prodominicana.gob.do',
      'nikaulisfeliz@prodominicana.gob.do',
    ];

    try {
      const emailPromises = adminEmails.map(adminEmail =>
        this.mailerService.sendMail({
          to: adminEmail,
          from: 'Mujer Exporta+ <mujerexportamas@prodominicana.gob.do>',
          subject: `Nueva suscripción: ${subscriber.name}`,
          template: './meAdminNotification',
          context: {
            name: subscriber.name,
            email: subscriber.email,
            company: subscriber.company,
            phone: subscriber.phone,
            sector: subscriber.sector,
            registrationDate: new Date().toLocaleString('es-DO', {
              dateStyle: 'full',
              timeStyle: 'short',
            }),
            year: new Date().getFullYear(),
          },
        })
      );

      await Promise.all(emailPromises);
      console.log('ME: Notificación enviada a administradores');
      return { success: true };
    } catch (error) {
      console.error('Error al enviar notificación a admins ME:', error.message || error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Envía notificación interna al equipo cuando se publica una nueva iniciativa
   */
  async meTeamNotification(initiative: {
    title: string;
    description: string;
    ruta: string;
    tipo: string;
    autor: string;
    url: string;
    endDate?: Date;
    createdBy?: string;
  }) {
    const teamEmail = 'todos@prodominicana.gob.do';
    const rutaColors = RUTA_COLORS[initiative.ruta] || RUTA_COLORS.aprender;

    try {
      await this.mailerService.sendMail({
        to: teamEmail,
        from: 'Mujer Exporta+ <mujerexportamas@prodominicana.gob.do>',
        subject: `[Mujer Exporta+] Nueva iniciativa: ${initiative.title}`,
        template: './meTeamNotification',
        context: {
          title: initiative.title,
          description: initiative.description,
          ruta: rutaColors.name,
          rutaColor: rutaColors.primary,
          rutaLightColor: rutaColors.light,
          tipo: initiative.tipo,
          autor: initiative.autor,
          initiativeUrl: initiative.url,
          endDate: initiative.endDate
            ? new Date(initiative.endDate).toLocaleDateString('es-DO', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })
            : null,
          createdBy: initiative.createdBy || 'Sistema',
          createdAt: new Date().toLocaleString('es-DO', {
            dateStyle: 'full',
            timeStyle: 'short',
          }),
          year: new Date().getFullYear(),
        },
      });

      console.log('ME: Notificación enviada al equipo (todos@prodominicana.gob.do)');
      return { success: true };
    } catch (error) {
      console.error('Error al enviar notificación al equipo ME:', error.message || error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Envía notificación de nueva iniciativa a todos los suscriptores activos
   */
  async meNewInitiative(
    subscribers: Array<{ email: string; name: string; unsubscribeToken: string }>,
    initiative: {
      title: string;
      description: string;
      ruta: string;
      tipo: string;
      autor: string;
      url: string;
      endDate?: Date;
    }
  ) {
    try {
      const rutaColors = RUTA_COLORS[initiative.ruta] || RUTA_COLORS.aprender;

      const emailPromises = subscribers.map(subscriber =>
        this.mailerService.sendMail({
          to: subscriber.email,
          from: 'Mujer Exporta+ <mujerexportamas@prodominicana.gob.do>',
          subject: `Nueva iniciativa: ${initiative.title}`,
          template: './meNewInitiative',
          context: {
            subscriberName: subscriber.name,
            title: initiative.title,
            description: initiative.description,
            ruta: rutaColors.name,
            rutaColor: rutaColors.primary,
            rutaLightColor: rutaColors.light,
            tipo: initiative.tipo,
            autor: initiative.autor,
            initiativeUrl: initiative.url,
            endDate: initiative.endDate
              ? new Date(initiative.endDate).toLocaleDateString('es-DO', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })
              : null,
            unsubscribeUrl: `https://prodominicana.gob.do/mujer-exporta/unsubscribe/${subscriber.unsubscribeToken}`,
            year: new Date().getFullYear(),
          },
        })
      );

      const results = await Promise.allSettled(emailPromises);
      const sent = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      console.log(`ME: Notificaciones enviadas: ${sent}, fallidas: ${failed}`);
      return { sent, failed };
    } catch (error) {
      console.error('Error al enviar notificaciones ME:', error.message || error);
      return { sent: 0, failed: subscribers.length, error: error.message };
    }
  }

  /**
   * Envía confirmación de cancelación de suscripción
   */
  async meUnsubscribe(email: string, name: string) {
    try {
      await this.mailerService.sendMail({
        to: email,
        from: 'Mujer Exporta+ <mujerexportamas@prodominicana.gob.do>',
        subject: 'Suscripción cancelada - Mujer Exporta+',
        template: './meUnsubscribe',
        context: {
          name,
          year: new Date().getFullYear(),
        },
      });
      return { success: true };
    } catch (error) {
      console.error('Error al enviar confirmación de cancelación ME:', error.message || error);
      return { success: false, error: error.message };
    }
  }

}
