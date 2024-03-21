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
} from '@nestjs/common';
import { EventsService } from './events.service';
import { FilesInterceptor } from '@nestjs/platform-express';
import { validateUser } from 'src/validation/validation';
import { Response } from 'express';
import { rimraf } from 'rimraf';

const fs = require('fs');
const path = require('path');

@Controller('apiv2/')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  /* Crear un evento */
  @Post('events')
  @UseInterceptors(FilesInterceptor('files'))
  async createEvent(@Body() body: any, @Res() res, @UploadedFiles() files?) {
    try {
      //   const id = res.req.headers.authorization;
      //   const auth0Token = await validateUser(id, 'create:event');
      //   if (!auth0Token) return res.status(401).json({ error: 'Unauthorized' });

      const event = await this.eventsService.create(body);
      if (files !== undefined) {
        // Crear ruta del evento
        console.log(`aaa ${event}`);
        const pathFolder = path.join(
          process.cwd(),
          `/public/events/${event.id}`,
        );
        if (!fs.existsSync(pathFolder)) {
          fs.mkdirSync(pathFolder, { recursive: true });
        }

        // Guardar archivos
        await files.forEach(async (file) => {
          const fileName = file.originalname;
          await fs.writeFileSync(path.join(pathFolder, fileName), file.buffer);
          event.image = `${fileName}`;
        });

        await this.eventsService.update(event.id, event);
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
      // const id = res.req.headers.authorization;
      // const auth0Token = await validateUser(id, 'update:event');
      // if (!auth0Token) return res.status(401).json({ error: 'Unauthorized' });

      const event = await this.eventsService.update(id, body);
      if (files === undefined) {
        return res.status(200).json(event);
      }

      // Crear ruta del evento
      const pathFolder = path.join(process.cwd(), `/public/events/${event.id}`);
      await rimraf(pathFolder);
      if (!fs.existsSync(pathFolder)) {
        fs.mkdirSync(pathFolder, { recursive: true });
      }

      // Guardar archivos
      await files.forEach(async (file) => {
        const fileName = file.originalname;
        await fs.writeFileSync(path.join(pathFolder, fileName), file.buffer);
        event.image = `${fileName}`;
        await this.eventsService.update(event.id, event);
      });

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
      // const id = res.req.headers.authorization;
      // const auth0Token = await validateUser(id, 'delete:event');
      // if (!auth0Token) return res.status(401).json({ error: 'Unauthorized' });
      const event = await this.eventsService.delete(id);
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
  @Get('/:lang/events')
  async getAllEvents(@Param('lang') lang: string, @Res() res) {
    try {
      const events = await this.eventsService.findAllEnable(lang);
      return res.status(200).json(events);
    } catch (error) {
      return res.status(404).json({ error });
    }
  }

  // Obtener por id
  @Get('events/:id')
  async getOneNewsById(@Param('id') id: string, @Res() res) {
    try {
      const event = await this.eventsService.findOneById(id);
      console.log(event);
      return res.status(200).json(event);
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
      const event = await this.eventsService.findOne(id, lang);
      return res.status(200).json(event);
    } catch (error) {
      return res.status(404).json({ error });
    }
  }
}
