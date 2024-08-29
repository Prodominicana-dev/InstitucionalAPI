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
   `por parte de ${data.name} ${data.lastName},
    con el correo electrónico:  ${data.email} 
   ` ,
   'Se ha recibido una queja o denuncia a través del portal prodominicana.gob.do ',
   descripcion,
   `Gracias por contactarnos esta informacion sera manejada de forma confidencial `,
   'josegarcia@prodominicana.gob.do',
 );
}
//denuncia@prodominicana.gob.do

}







