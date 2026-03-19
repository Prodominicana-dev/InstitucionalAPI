import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Res,
  UseInterceptors,
  UploadedFiles,
  StreamableFile,
  Query,
} from '@nestjs/common';
import { EventsService } from './events.service';
import { FilesInterceptor } from '@nestjs/platform-express';
import { validateUser } from 'src/validation/validation';
import { Response } from 'express';
import { rimraf } from 'rimraf';
import { guardarFormulario, obtenerFormulario, leerFormularios, eliminarFormulario } from 'src/lib/formularios-helper';

const fs = require('fs');
const path = require('path');

@Controller('apiv2/')
export class EventsController {
  constructor(private readonly eventsService: EventsService) { }

  /* Crear un evento */
  @Post('events')
  @UseInterceptors(FilesInterceptor('files'))
  async createEvent(@Body() body: any, @Res() res, @UploadedFiles() files?) {
    try {
      const event = await this.eventsService.create(body);

      if (files !== undefined) {
        const pathFolder = path.join(
          process.cwd(),
          `/public/events/${event.id}`,
        );
        if (!fs.existsSync(pathFolder)) {
          fs.mkdirSync(pathFolder, { recursive: true });
        }

        await files.forEach(async (file) => {
          const fileName = file.originalname;
          await fs.writeFileSync(path.join(pathFolder, fileName), file.buffer);
          event.image = `${fileName}`;
        });

        await this.eventsService.update(event.id, event);
      }

      // ✅ GUARDAR FORMULARIO EN JSON
      if (body.formulario_url && body.formulario_url.trim() !== '') {
        await guardarFormulario(event.id, body.formulario_url.trim());
        // console.log('✅ Formulario guardado:', event.id, '→', body.formulario_url);
      }

      return res.status(201).json({ message: 'Eventos creados' });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  /* Editar un evento */
  @Patch('events/:id')
  @UseInterceptors(FilesInterceptor('files'))
  async updateEvent(
    @Param('id') id: string,
    @Body() body: any,
    @Res() res,
    @UploadedFiles() files?,
  ) {
    try {
      const event = await this.eventsService.update(id, body);

      if (files !== undefined && files.length > 0) {
        const pathFolder = path.join(process.cwd(), `/public/events/${event.id}`);
        await rimraf(pathFolder);
        if (!fs.existsSync(pathFolder)) {
          fs.mkdirSync(pathFolder, { recursive: true });
        }

        await files.forEach(async (file) => {
          const fileName = file.originalname;
          await fs.writeFileSync(path.join(pathFolder, fileName), file.buffer);
          event.image = `${fileName}`;
          await this.eventsService.update(event.id, event);
        });
      }

      // ✅ ACTUALIZAR/ELIMINAR FORMULARIO EN JSON
      if (body.formulario_url !== undefined) {
        if (body.formulario_url && body.formulario_url.trim() !== '') {
          await guardarFormulario(event.id, body.formulario_url.trim());
          // console.log('✅ Formulario actualizado:', event.id);
        } else {
          await eliminarFormulario(event.id);
          // console.log('✅ Formulario eliminado:', event.id);
        }
      }

      return res.status(200).json({ message: 'Eventos actualizados' });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
  @Get('/events/images/:id/:name')
  getImages(
    @Param('id') id: string,
    @Param('name') imageName: string,
    @Res({ passthrough: true }) res: Response,
  ): StreamableFile {
    res.set({ 'Content-Type': 'image/jpeg' });
    const imagePath = path.join(
      process.cwd(),
      `public/events/${id}`,
      imageName,
    );
    //   const mimeType = mime.lookup(imageName);
    //   if (!mimeType) {
    //     return undefined;
    //   }
    const fileStream = fs.createReadStream(imagePath);
    const streamableFile = new StreamableFile(fileStream);
    //   streamableFile.options.type = mimeType
    return streamableFile;
  }

  /* Eliminar un evento */
  @Delete('events/:id')
  async deleteEvent(@Param('id') id: string, @Res() res) {
    try {
      const event = await this.eventsService.delete(id);

      // ✅ ELIMINAR FORMULARIO DEL JSON
      await eliminarFormulario(id);
      console.log('✅ Formulario eliminado del JSON (si existía)');

      return res.status(200).json(event);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  /* Deshabilitar un evento */
  @Patch('events/disable/:id')
  async disableEvent(@Param('id') id: string, @Body() data, @Res() res) {
    try {
      // const id = res.req.headers.authorization;
      // const auth0Token = await validateUser(id, 'disable:event');
      // if (!auth0Token) return res.status(401).json({ error: 'Unauthorized' });
      const event = await this.eventsService.disable(id, data);
      return res.status(200).json(event);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  /* Habilitar un evento */
  @Patch('events/enable/:id')
  async enableEvent(@Param('id') id: string, @Body() data, @Res() res) {
    try {
      // const id = res.req.headers.authorization;
      // const auth0Token = await validateUser(id, 'enable:event');
      // if (!auth0Token) return res.status(401).json({ error: 'Unauthorized' });
      console.log(data);
      const event = await this.eventsService.enable(id, data);

      return res.status(200).json(event);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  /* Obtener todos los eventos */
  @Get(':lang/events')
  async getAllEvents(
    @Param('lang') lang: string,
    @Query('all') all: string,
    @Res() res
  ) {
    try {
      const showAll = all === 'true';
      const events = await this.eventsService.findAllEnable(lang, showAll);

      // ✅ LEER FORMULARIOS Y COMBINAR
      const formularios = await leerFormularios();
      const eventsWithForms = events.map((event) => ({
        ...event,
        formularioUrl: formularios[event.id] || null,
      }));

      return res.status(200).json(eventsWithForms);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  // Obtener por id
  @Get('events/:id')
  async getOneNewsById(@Param('id') id: string, @Res() res) {
    try {
      const eventData = await this.eventsService.findOneById(id);

      // ✅ Verificar si es array o está vacío
      if (!eventData || (Array.isArray(eventData) && eventData.length === 0)) {
        return res.status(404).json({ error: 'Evento no encontrado' });
      }

      // ✅ Acceder al primer elemento si es array
      const event = Array.isArray(eventData) ? eventData[0] : eventData;

      // ✅ OBTENER FORMULARIO Y COMBINAR
      const formularioUrl = await obtenerFormulario(event.id);

      return res.status(200).json({
        ...event,
        formularioUrl,
      });
    } catch (error) {
      return res.status(404).json({ error });
    }
  }

  /* Obtener un evento por id */
  @Get(':lang/events/:id')
  async getOneEvent(
    @Param('lang') lang: string,
    @Param('id') id: string,
    @Res() res,
  ) {
    try {
      const eventData = await this.eventsService.findOne(id, lang);

      if (!eventData || eventData.length === 0) {
        return res.status(404).json({ error: 'Evento no encontrado' });
      }

      // ✅ Acceder al primer elemento del array
      const event = eventData[0];

      // ✅ OBTENER FORMULARIO con el ID correcto
      const formularioUrl = await obtenerFormulario(event.id);

      return res.status(200).json({
        ...event,
        formularioUrl,
      });
    } catch (error) {
      return res.status(404).json({ error });
    }
  }
}
