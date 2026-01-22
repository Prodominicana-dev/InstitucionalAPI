import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { MailService } from './mail.service';
import { ComplainttDto } from './dto/complaint.dto'
import { servicesFormDto, } from './dto/servicesform.dto'
import { servicesUsers } from './dto/servicesUsers.dto'
import { sendPageEmail } from './dto/sendPageEmail.dto'
import { ContactDto } from './dto/contact.dto';
import { FeedbackService } from '../feeback/feedback.service';


@Controller('apiv2/mail')
export class MailController {
  constructor(
    private mailService: MailService,
    private feedbackService: FeedbackService,
  ) { }


  @Post('contact')
  async contact(
    @Body() data: ContactDto
  ) {
    // console.log('data', data);

    return this.mailService.contact(
      'contact@prodominicana.gob.do',
      data.nameF,
      data.lastName,
      data.message,
      data.identity,
      data.email,
      data.activity,
      data.contactCode,
    );
    //josegarcia@prodominicana.gob.do
    //contact@prodominicana.gob.do
  }


  @Post('complaint')
  async complait(
    @Body() data: ComplainttDto
  ) {
    return this.mailService.complaint(
    'denuncia@prodominicana.gob.do',
    data.name,
    data.lastName,
    data.email,
    data.companyName,
    data.departmen,
    data.involvedPerson,
    data.date,
    data.contactCode,
    data.message,
    
    //josegarcia@prodominicana.gob.do
    //denuncia@prodominicana.gob.do
    )
  }

  @Post('servicesform')
  async servicesForm(
    @Body() data: servicesFormDto
  ) {
    //  console.log('klk data',data);
    return this.mailService.serviceForm(
      //josegarcia@prodominicana.gob.do
      //servicios@prodominicana.gob.do
      'servicios@prodominicana.gob.do', // toemail
      data.name,
      data.lastName,
      data.message,
      data.email,
      data.contact,
      data.id,
      data.Phone,
      data.contactCode

    )

  }

  @Post('pageEmail')
  async pageEmail(
    @Body() data: sendPageEmail
  ) {
    // console.log('Email recibido:', data.email);
    return this.mailService.sendPageEmail(
      data.email
    )
  }

  @Post('servicesUsers')
  async servicesUsers(
    @Body() email: servicesUsers
  ) {
    // console.log('data email: ', email);

    return this.mailService.servicesUser(
      email,
      'https://ceirdom-my.sharepoint.com/:b:/r/personal/josegarcia_prodominicana_gob_do/Documents/ORGANIGRAMA%20GENERAL%202024.pdf?csf=1&web=1&e=ZMpbR9'
    )
  }

  @Post('feedback')
  async feedback(
    @Body() data: {
      name: string;
      email: string;
      message: string;
      rating?: number;
      serviceType?: string;
    }
  ) {
    // 1. Crear el feedback en la base de datos
    const feedback = await this.feedbackService.create(data);
    
    // 2. Generar código de feedback
    const feedbackCode = feedback.id.substring(0, 8).toUpperCase();
    
    // 3. Lista de correos responsables (hardcoded como los demás)
    const responsibleEmails = [
      'gestiondecalidad@prodominicana.gob.do',
     
     
    ];
    
    // 4. Enviar emails a los 4 responsables
    await this.mailService.feedback(
      responsibleEmails,
      data.name,
      data.email,
      data.message,
      feedbackCode,
      data.rating,
      data.serviceType
    );
    
    return feedback;
  }

}





