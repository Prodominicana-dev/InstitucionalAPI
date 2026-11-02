import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  Res,
  UseInterceptors,
  UploadedFiles,
  StreamableFile,
} from '@nestjs/common';
import { BannerService } from './banner.service';
import { FilesInterceptor } from '@nestjs/platform-express';
import { validateUser } from 'src/validation/validation';
import { Response } from 'express';
import { rimraf } from 'rimraf';

const fs = require('fs');
const path = require('path');
const mime = require('mime-types');
const CryptoJS = require('crypto-js');

const LOCALES = ['es', 'en'];

@Controller('apiv2/banner')
export class BannerController {
  constructor(private readonly bannerService: BannerService) {}

  // Verifica que quien llama sea un usuario con permiso de administrar contenido.
  // Sin cabecera, decrypt lanza y caeria al catch como 500: eso es 401.
  private async isAuthorized(res: Response): Promise<boolean> {
    const _id = res.req.headers.authorization;
    if (!_id) return false;
    const idBytes = CryptoJS.AES.decrypt(_id, process.env.CRYPTO_KEY);
    const idDecrypted = idBytes.toString(CryptoJS.enc.Utf8);
    if (!idDecrypted) return false;
    return !!(await validateUser(idDecrypted, 'create:news'));
  }

  // Sanitiza el nombre del archivo antes de guardarlo en disco
  private sanitizeFilename(filename: string): string {
    const ext = path.extname(filename);
    const nameWithoutExt = filename.replace(ext, '');
    const sanitized = nameWithoutExt
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-zA-Z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 100);
    return (sanitized || 'banner') + ext.toLowerCase();
  }

  // Los campos de un form-data llegan como texto
  private toBool(value: any, fallback: boolean): boolean {
    if (value === undefined || value === null || value === '') return fallback;
    return value === true || value === 'true';
  }

  // Idioma valido o null (null = el banner sale en todos los idiomas)
  private toLocale(value: any): string | null {
    return LOCALES.includes(value) ? value : null;
  }

  // Banners publicos: solo los visibles (con ?locale=es|en opcional)
  @Get()
  async findPublic(@Query('locale') locale: string, @Res() res: Response) {
    try {
      const banners = await this.bannerService.findPublic(
        LOCALES.includes(locale) ? locale : undefined,
      );
      return res.status(200).json(banners);
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: error.message });
    }
  }

  // Todos los banners, tambien los ocultos, para el admin
  @Get('admin')
  async findAll(@Res() res: Response) {
    try {
      if (!(await this.isAuthorized(res))) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      return res.status(200).json(await this.bannerService.findAll());
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: error.message });
    }
  }

  // Servir la imagen de un banner
  @Get(':id/img/:name')
  getImage(
    @Param('id') id: string,
    @Param('name') name: string,
    @Res({ passthrough: true }) res: Response,
  ): StreamableFile {
    // basename evita que el nombre se salga de la carpeta del banner
    const safeName = path.basename(name);
    const imgPath = path.join(
      process.cwd(),
      'public/banner',
      path.basename(id),
      safeName,
    );
    const mimeType = mime.lookup(safeName);
    if (mimeType) res.set({ 'Content-Type': mimeType });
    return new StreamableFile(fs.createReadStream(imgPath));
  }

  // Crear un banner
  @Post()
  @UseInterceptors(FilesInterceptor('images'))
  async create(@Body() body: any, @UploadedFiles() files, @Res() res: Response) {
    try {
      if (!(await this.isAuthorized(res))) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      if (!files || files.length === 0) {
        return res.status(400).json({ error: 'Se requiere una imagen' });
      }
      if (!body.title?.trim()) {
        return res.status(400).json({ error: 'Se requiere un titulo' });
      }

      const file = files[0];
      const sanitizedName = this.sanitizeFilename(file.originalname);

      const banner = await this.bannerService.create({
        title: body.title.trim(),
        link: body.link?.trim() || null,
        external: this.toBool(body.external, true),
        locale: this.toLocale(body.locale),
        visible: this.toBool(body.visible, true),
        created_By: body.created_By,
        image: sanitizedName,
      });

      const folder = path.join(process.cwd(), `public/banner/${banner.id}`);
      fs.mkdirSync(folder, { recursive: true });
      fs.writeFileSync(path.join(folder, sanitizedName), file.buffer);

      return res.status(201).json(banner);
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: error.message });
    }
  }

  // Ocultar o mostrar un banner sin borrarlo
  @Patch(':id/visibility')
  async setVisibility(
    @Param('id') id: string,
    @Body() body: any,
    @Res() res: Response,
  ) {
    try {
      if (!(await this.isAuthorized(res))) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const existing = await this.bannerService.getById(id);
      if (!existing) return res.status(404).json({ error: 'Banner no encontrado' });

      const updated = await this.bannerService.update(id, {
        visible: this.toBool(body.visible, existing.visible),
        updated_By: body.updated_By,
      });
      return res.status(200).json(updated);
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: error.message });
    }
  }

  // Editar un banner (la imagen es opcional: si no llega se conserva la actual)
  @Patch(':id')
  @UseInterceptors(FilesInterceptor('images'))
  async update(
    @Param('id') id: string,
    @Body() body: any,
    @UploadedFiles() files,
    @Res() res: Response,
  ) {
    try {
      if (!(await this.isAuthorized(res))) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const existing = await this.bannerService.getById(id);
      if (!existing) return res.status(404).json({ error: 'Banner no encontrado' });

      const updateData: any = { updated_By: body.updated_By };
      if (body.title !== undefined) {
        if (!body.title.trim()) {
          return res.status(400).json({ error: 'Se requiere un titulo' });
        }
        updateData.title = body.title.trim();
      }
      if (body.link !== undefined) updateData.link = body.link.trim() || null;
      if (body.external !== undefined) {
        updateData.external = this.toBool(body.external, existing.external);
      }
      if (body.locale !== undefined) updateData.locale = this.toLocale(body.locale);
      if (body.visible !== undefined) {
        updateData.visible = this.toBool(body.visible, existing.visible);
      }

      if (files && files.length > 0) {
        const folder = path.join(process.cwd(), `public/banner/${id}`);
        const oldPath = path.join(folder, path.basename(existing.image));
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);

        const file = files[0];
        const sanitizedName = this.sanitizeFilename(file.originalname);
        fs.mkdirSync(folder, { recursive: true });
        fs.writeFileSync(path.join(folder, sanitizedName), file.buffer);
        updateData.image = sanitizedName;
      }

      const updated = await this.bannerService.update(id, updateData);
      return res.status(200).json(updated);
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: error.message });
    }
  }

  // Cambiar el orden: recibe los ids en el orden en que deben salir
  @Post('reorder')
  async reorder(@Body() body: any, @Res() res: Response) {
    try {
      if (!(await this.isAuthorized(res))) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const ids: string[] = Array.isArray(body.ids) ? body.ids : [];
      for (let i = 0; i < ids.length; i++) {
        await this.bannerService.update(ids[i], { order: i });
      }
      return res.status(200).json({ message: 'Orden actualizado' });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: error.message });
    }
  }

  // Eliminar un banner y su carpeta de imagenes
  @Delete(':id')
  async delete(@Param('id') id: string, @Res() res: Response) {
    try {
      if (!(await this.isAuthorized(res))) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const existing = await this.bannerService.getById(id);
      if (!existing) return res.status(404).json({ error: 'Banner no encontrado' });

      await this.bannerService.delete(id);
      await rimraf(path.join(process.cwd(), 'public/banner', path.basename(id)));

      return res.status(200).json({ message: 'Banner eliminado' });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: error.message });
    }
  }
}
