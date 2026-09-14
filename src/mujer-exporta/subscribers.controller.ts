import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  Res,
  Header,
} from '@nestjs/common';
import { SubscribersService } from './subscribers.service';
import { validateUser } from 'src/validation/validation';
const CryptoJS = require('crypto-js');

@Controller('apiv2/')
export class SubscribersController {
  constructor(private readonly subscribersService: SubscribersService) {}

  /* Obtener todos los suscriptores (Admin) */
  @Get('mujer-exporta/subscribers')
  async getSubscribers(@Query('search') search: string, @Res() res) {
    try {
      const id = res.req.headers.authorization;
      const idBytes = CryptoJS.AES.decrypt(id, process.env.CRYPTO_KEY);
      const idDecrypted = idBytes.toString(CryptoJS.enc.Utf8);
      const auth0Token = await validateUser(idDecrypted, 'create:mujer-exporta');
      if (!auth0Token) return res.status(401).json({ error: 'Unauthorized' });

      const subscribers = await this.subscribersService.findAll(search);
      return res.status(200).json(subscribers);
    } catch (error) {
      return res.status(error.status || 500).json({ error: error.message });
    }
  }

  /* Obtener estadísticas de suscriptores (Admin) */
  @Get('mujer-exporta/subscribers/stats')
  async getStats(@Res() res) {
    try {
      const id = res.req.headers.authorization;
      const idBytes = CryptoJS.AES.decrypt(id, process.env.CRYPTO_KEY);
      const idDecrypted = idBytes.toString(CryptoJS.enc.Utf8);
      const auth0Token = await validateUser(idDecrypted, 'create:mujer-exporta');
      if (!auth0Token) return res.status(401).json({ error: 'Unauthorized' });

      const stats = await this.subscribersService.getStats();
      return res.status(200).json(stats);
    } catch (error) {
      return res.status(error.status || 500).json({ error: error.message });
    }
  }

  /* Exportar suscriptores a CSV (Admin) */
  @Get('mujer-exporta/subscribers/export')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="suscriptores-mujer-exporta.csv"')
  async exportSubscribers(@Res() res) {
    try {
      const id = res.req.headers.authorization;
      const idBytes = CryptoJS.AES.decrypt(id, process.env.CRYPTO_KEY);
      const idDecrypted = idBytes.toString(CryptoJS.enc.Utf8);
      const auth0Token = await validateUser(idDecrypted, 'create:mujer-exporta');
      if (!auth0Token) return res.status(401).json({ error: 'Unauthorized' });

      const csv = await this.subscribersService.exportToCsv();

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="suscriptores-mujer-exporta.csv"');

      // Agregar BOM para UTF-8 (para que Excel reconozca correctamente los caracteres)
      const bom = '\uFEFF';
      return res.status(200).send(bom + csv);
    } catch (error) {
      return res.status(error.status || 500).json({ error: error.message });
    }
  }

  /* Crear suscriptor (Público - sin auth) */
  @Post('mujer-exporta/subscribers')
  async createSubscriber(@Body() body: any, @Res() res) {
    try {
      // Validación básica
      if (!body.name || !body.email) {
        return res.status(400).json({ error: 'Nombre y email son requeridos' });
      }

      // Validar formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(body.email)) {
        return res.status(400).json({ error: 'Formato de email inválido' });
      }

      const subscriber = await this.subscribersService.create(body);
      return res.status(201).json(subscriber);
    } catch (error) {
      return res.status(error.status || 500).json({ error: error.message });
    }
  }

  /* Cancelar suscripción por token (Público - sin auth) */
  @Get('mujer-exporta/unsubscribe/:token')
  async unsubscribe(@Param('token') token: string, @Res() res) {
    try {
      const result = await this.subscribersService.unsubscribeByToken(token);
      return res.status(200).json(result);
    } catch (error) {
      return res.status(error.status || 500).json({ error: error.message });
    }
  }

  /* Página de confirmación de cancelación (redirige al frontend) */
  @Get('mujer-exporta/unsubscribe/confirm/:token')
  async unsubscribeConfirm(@Param('token') token: string, @Res() res) {
    try {
      await this.subscribersService.unsubscribeByToken(token);
      // Redirigir a una página de confirmación en el frontend
      return res.redirect('https://prodominicana.gob.do/mujer-exporta?unsubscribed=true');
    } catch (error) {
      // Redirigir con mensaje de error
      return res.redirect('https://prodominicana.gob.do/mujer-exporta?unsubscribed=error');
    }
  }

  /* Eliminar suscriptor (Admin) */
  @Delete('mujer-exporta/subscribers/:id')
  async deleteSubscriber(@Param('id') id: string, @Res() res) {
    try {
      const _id = res.req.headers.authorization;
      const idBytes = CryptoJS.AES.decrypt(_id, process.env.CRYPTO_KEY);
      const idDecrypted = idBytes.toString(CryptoJS.enc.Utf8);
      const auth0Token = await validateUser(idDecrypted, 'create:mujer-exporta');
      if (!auth0Token) return res.status(401).json({ error: 'Unauthorized' });

      const subscriber = await this.subscribersService.delete(id);
      return res.status(200).json(subscriber);
    } catch (error) {
      return res.status(error.status || 500).json({ error: error.message });
    }
  }
}
