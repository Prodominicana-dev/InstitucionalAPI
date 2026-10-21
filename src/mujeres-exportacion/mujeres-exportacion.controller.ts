import {
  Controller,
  Get,
  Post,
  Patch,
  Put,
  Delete,
  Param,
  Body,
  Res,
  UseInterceptors,
  UploadedFile,
  StreamableFile,
  HttpException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { validateUser } from 'src/validation/validation';
import { MujeresExportacionService } from './mujeres-exportacion.service';

const fs = require('fs');
const path = require('path');
const mime = require('mime-types');
const CryptoJS = require('crypto-js');

// Lo gestiona Comunicaciones, igual que noticias y portadas.
const PERMISO = 'create:news';
const CARPETA_FOTOS = path.join(process.cwd(), 'public/mujeres-exportacion/speakers');
const TIPOS_FOTO = ['image/jpeg', 'image/png', 'image/webp'];

@Controller('apiv2/mujeres-exportacion')
export class MujeresExportacionController {
  constructor(private readonly service: MujeresExportacionService) {}

  private async autorizado(res: Response): Promise<boolean> {
    const _id = res.req.headers.authorization;
    if (!_id) return false;
    try {
      const idDecrypted = CryptoJS.AES.decrypt(_id, process.env.CRYPTO_KEY).toString(CryptoJS.enc.Utf8);
      return idDecrypted ? await validateUser(idDecrypted, PERMISO) : false;
    } catch {
      return false;
    }
  }

  // Ejecuta la acción si el usuario tiene permiso y traduce los errores a HTTP.
  private async protegido(res: Response, status: number, accion: () => Promise<any>) {
    try {
      if (!(await this.autorizado(res))) return res.status(401).json({ error: 'Unauthorized' });
      const result = await accion();
      return res.status(status).json(result ?? { ok: true });
    } catch (error) {
      return this.error(res, error);
    }
  }

  private error(res: Response, error: any) {
    if (error instanceof HttpException) return res.status(error.getStatus()).json({ error: error.message });
    if (error?.code === 'P2025') return res.status(404).json({ error: 'No existe.' });
    console.log(error);
    return res.status(500).json({ error: 'Error interno.' });
  }

  private nombreFoto(file: any): string {
    const ext = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' }[file.mimetype];
    return `foto-${Date.now()}${ext}`;
  }

  private guardarFoto(speakerId: string, file: any): string {
    const nombre = this.nombreFoto(file);
    const carpeta = path.join(CARPETA_FOTOS, speakerId);
    fs.mkdirSync(carpeta, { recursive: true });
    fs.writeFileSync(path.join(carpeta, nombre), file.buffer);
    return nombre;
  }

  private borrarFoto(speakerId: string, nombre?: string | null) {
    if (!nombre) return;
    fs.rm(path.join(CARPETA_FOTOS, path.basename(speakerId), path.basename(nombre)), { force: true }, () => {});
  }

  private validarFoto(file: any) {
    if (!file) return;
    if (!TIPOS_FOTO.includes(file.mimetype)) throw new HttpException('La foto debe ser JPG, PNG o WEBP.', 400);
    if (file.size > 5 * 1024 * 1024) throw new HttpException('La foto no puede pasar de 5 MB.', 400);
  }

  // ---------- Público ----------

  @Get('program')
  async getProgram(@Res() res: Response) {
    try {
      return res.status(200).json(await this.service.getPublicProgram());
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Get('speakers/:id/img/:name')
  getPhoto(
    @Param('id') id: string,
    @Param('name') name: string,
    @Res({ passthrough: true }) res: Response,
  ): StreamableFile {
    const imgPath = path.join(CARPETA_FOTOS, path.basename(id), path.basename(name));
    if (!fs.existsSync(imgPath)) throw new HttpException('No existe.', 404);
    const mimeType = mime.lookup(name);
    if (mimeType) res.set({ 'Content-Type': mimeType, 'Cache-Control': 'public, max-age=604800' });
    return new StreamableFile(fs.createReadStream(imgPath));
  }

  // ---------- Admin ----------

  @Get('admin')
  getAdmin(@Res() res: Response) {
    return this.protegido(res, 200, () => this.service.getAdmin());
  }

  @Put('settings')
  updateSettings(@Body() body: any, @Res() res: Response) {
    return this.protegido(res, 200, () => this.service.updateSettings(body));
  }

  @Post('days')
  createDay(@Body() body: any, @Res() res: Response) {
    return this.protegido(res, 201, () => this.service.createDay(body));
  }

  // Antes que days/:id para que "order" no se tome como id.
  @Patch('days/order')
  reorderDays(@Body() body: any, @Res() res: Response) {
    return this.protegido(res, 200, () => this.service.reorderDays(body.ids));
  }

  @Patch('days/:id')
  updateDay(@Param('id') id: string, @Body() body: any, @Res() res: Response) {
    return this.protegido(res, 200, () => this.service.updateDay(id, body));
  }

  @Delete('days/:id')
  deleteDay(@Param('id') id: string, @Res() res: Response) {
    return this.protegido(res, 200, () => this.service.deleteDay(id));
  }

  @Post('sessions')
  createSession(@Body() body: any, @Res() res: Response) {
    return this.protegido(res, 201, () => this.service.createSession(body));
  }

  @Patch('sessions/:id/visible')
  setVisible(@Param('id') id: string, @Body() body: any, @Res() res: Response) {
    return this.protegido(res, 200, () => this.service.setSessionVisible(id, body.visible));
  }

  @Patch('sessions/:id')
  updateSession(@Param('id') id: string, @Body() body: any, @Res() res: Response) {
    return this.protegido(res, 200, () => this.service.updateSession(id, body));
  }

  @Delete('sessions/:id')
  deleteSession(@Param('id') id: string, @Res() res: Response) {
    return this.protegido(res, 200, () => this.service.deleteSession(id));
  }

  @Post('speakers')
  @UseInterceptors(FileInterceptor('photo'))
  createSpeaker(@Body() body: any, @UploadedFile() file, @Res() res: Response) {
    return this.protegido(res, 201, async () => {
      this.validarFoto(file);
      const speaker = await this.service.createSpeaker(this.service.datosPonente(body));
      if (!file) return speaker;
      return this.service.updateSpeaker(speaker.id, { photo: this.guardarFoto(speaker.id, file) });
    });
  }

  @Patch('speakers/:id')
  @UseInterceptors(FileInterceptor('photo'))
  updateSpeaker(@Param('id') id: string, @Body() body: any, @UploadedFile() file, @Res() res: Response) {
    return this.protegido(res, 200, async () => {
      this.validarFoto(file);
      const actual = await this.service.getSpeaker(id);
      const data: any = this.service.datosPonente(body);
      if (file) {
        this.borrarFoto(id, actual.photo);
        data.photo = this.guardarFoto(id, file);
      } else if (body.removePhoto === '1') {
        this.borrarFoto(id, actual.photo);
        data.photo = null;
      }
      return this.service.updateSpeaker(id, data);
    });
  }

  @Delete('speakers/:id')
  deleteSpeaker(@Param('id') id: string, @Res() res: Response) {
    return this.protegido(res, 200, async () => {
      const result = await this.service.deleteSpeaker(id);
      fs.rm(path.join(CARPETA_FOTOS, path.basename(id)), { recursive: true, force: true }, () => {});
      return result;
    });
  }
}
