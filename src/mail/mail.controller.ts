import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { MailService } from './mail.service';
import {ComplainttDto} from'./dto/complaint.dto'

@Controller('apiv2/mail')
export class MailController {
  constructor(private mailService: MailService) {}
  

  @Post(':name/:lastname/:email/:message/:activity/:identity')
  async alertaComercialMail(
    @Param('name') name: string,
    @Param('lastname') lastname: string,
    @Param('email') email: string,
    @Param('message') message: string,
    @Param('activity') activity: string,
    @Param('identity') identity: string,
  ) {
    const descripcion = `${message}`;
    return this.mailService.newAlertaComercialMail(
      `Nos contacta ${name} ${lastname}, portador de la cedula: ${identity}
        ${email} 
      ` ,
      'Saludos cordiales',
      descripcion,
      `el cual es un  ${activity} `,
      'viguera27@gmail.com',
    );
  }


  @Post('complaint')
  async complait(
    @Body() data:ComplainttDto
  ){
 //complait
 const descripcion = `${data.message}`;
 return this.mailService.complaint(
   `Nos contacta ${data.name} ${data.lastName},
    portador del correo electonico:  ${data.email} 
   ` ,
   'Saludos cordiales',
   descripcion,
   `Gracias por contactarnos esta informacion sera manejada de forma confidencial `,
   'denuncia@prodominicana.gob.do',
 );
}


}







