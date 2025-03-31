import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { MailService } from './mail.service';
import { ComplainttDto } from './dto/complaint.dto'
import { servicesFormDto, } from './dto/servicesform.dto'
import { servicesUsers } from './dto/servicesUsers.dto'
import { sendPageEmail } from './dto/sendPageEmail.dto'
import { ContactDto } from './dto/contact.dto';


@Controller('apiv2/mail')
export class MailController {
  constructor(private mailService: MailService) { }


  @Post('contact')
  async contact(
    @Body() data: ContactDto
  ) {

    return this.mailService.contact(
      'contact@prodominicana.gob.do',
      data.nameF,
      data.lastName,
      data.message,
      data.identity,
      data.email,
      data.activity
    );
    //josegarcia@prodominicana.gob.do
    //denuncia@prodominicana.gob.do
  }


  @Post('complaint')
  async complait(
    @Body() data: ComplainttDto
  ) {
    //complait
    const descripcion = `${data.message}`;
    return this.mailService.complaint(
      `
    Nombre: ${data.name} ${data.lastName},
    Correo electrónico: ${data.email},
    representante de la empresa:${data.companyName},
    Funcionario involucrado: ${data.involvedPerson},
    fecha : ${data.date},
    
    Descripción de la queja o denuncia:

   ` ,
      ` Hemos recibido una queja o denuncia a través del portal prodominicana.gob.do,área involucrada: ${data.departmen}, Los detalles del remitente son los siguientes: `,
      descripcion,
      `Gracias por contactarnos esta informacion sera manejada de forma confidencial `,
      'denuncia@prodominicana.gob.do',
    );
    //josegarcia@prodominicana.gob.do
    //denuncia@prodominicana.gob.do
  }

  @Post('servicesform')
  async servicesForm(
    @Body() data: servicesFormDto
  ) {
    // console.log('klk data',data);
    return this.mailService.serviceForm(
      'servicios@prodominicana.gob.do', // toemail
      data.name,
      data.lastName,
      data.message,
      data.email,
      data.contact,
      data.id,
      data.Phone,

    )

  }

  @Post('pageEmail')
  async pageEmail(
    @Body() data: sendPageEmail
  ) {
    console.log('Email recibido:', data.email);
    return this.mailService.sendPageEmail(
      data.email
    )
  }

  @Post('servicesUsers')
  async servicesUsers(
    @Body() email: servicesUsers
  ) {
    console.log('data email: ', email);

    return this.mailService.servicesUser(
      email,
      'https://ceirdom-my.sharepoint.com/:b:/r/personal/josegarcia_prodominicana_gob_do/Documents/ORGANIGRAMA%20GENERAL%202024.pdf?csf=1&web=1&e=ZMpbR9'
    )
  }

}





