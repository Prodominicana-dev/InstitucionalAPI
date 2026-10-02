import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Res,
} from '@nestjs/common';
import { EconomicIndicatorService } from './economic-indicator.service';
import { validateUser } from 'src/validation/validation';
import { Response } from 'express';

const CryptoJS = require('crypto-js');

@Controller('apiv2/economic-indicator')
export class EconomicIndicatorController {
  constructor(private readonly economicIndicatorService: EconomicIndicatorService) {}

  // Obtener los 4 indicadores del ticker (sin autenticación)
  @Get()
  async findAll(@Res() res: Response) {
    try {
      const indicators = await this.economicIndicatorService.findAll();
      return res.status(200).json(indicators);
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: error.message });
    }
  }

  // Actualizar un indicador por su key
  @Patch(':key')
  async update(@Param('key') key: string, @Body() body: any, @Res() res: Response) {
    try {
      const _id = res.req.headers.authorization;
      // Sin cabecera, decrypt lanza y caeria al catch como 500: eso es 401.
      if (!_id) return res.status(401).json({ error: 'Unauthorized' });
      const idBytes = CryptoJS.AES.decrypt(_id, process.env.CRYPTO_KEY);
      const idDecrypted = idBytes.toString(CryptoJS.enc.Utf8);
      const auth0Token = await validateUser(idDecrypted, 'create:news');
      if (!auth0Token) return res.status(401).json({ error: 'Unauthorized' });

      const indicator = await this.economicIndicatorService.updateByKey(key, {
        value: body.value,
        label: body.label,
        labelEn: body.labelEn,
        note: body.note,
        noteEn: body.noteEn,
        updated_By: body.updated_By,
      });
      return res.status(200).json(indicator);
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: error.message });
    }
  }
}
