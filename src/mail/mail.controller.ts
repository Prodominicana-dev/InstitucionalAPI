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





