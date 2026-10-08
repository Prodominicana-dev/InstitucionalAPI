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
import { NewspaperCoverService } from './newspaper-cover.service';
import { FilesInterceptor } from '@nestjs/platform-express';
import { validateUser } from 'src/validation/validation';
import { Response } from 'express';
import { rimraf } from 'rimraf';

const fs = require('fs');
const path = require('path');
const mime = require('mime-types');
const CryptoJS = require('crypto-js');

@Controller('apiv2/newspaper-cover')
export class NewspaperCoverController {
  constructor(private readonly newspaperCoverService: NewspaperCoverService) {}

  // Sanitiza el nombre del archivo antes de guardarlo en disco
  private sanitizeFilename(filename: string): string {
    const ext = path.extname(filename);
    const nameWithoutExt = filename.replace(ext, '');
    const accentMap: Record<string, string> = {
      á: 'a', é: 'e', í: 'i', ó: 'o', ú: 'u',
      Á: 'A', É: 'E', Í: 'I', Ó: 'O', Ú: 'U',
      ñ: 'n', Ñ: 'N', ü: 'u', Ü: 'U',
    };
    let sanitized = nameWithoutExt;
    Object.keys(accentMap).forEach((char) => {
      sanitized = sanitized.replace(new RegExp(char, 'g'), accentMap[char]);
    });
    sanitized = sanitized
      .replace(/[^a-zA-Z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 100);
    return sanitized + ext;
  }

  // Crear una portada
  @Post()
  @UseInterceptors(FilesInterceptor('images'))
  async create(@Body() body: any, @UploadedFiles() files, @Res() res: Response) {
    try {
      const _id = res.req.headers.authorization;
      // Sin cabecera, decrypt lanza y caeria al catch como 500: eso es 401.
      if (!_id) return res.status(401).json({ error: 'Unauthorized' });
      const idBytes = CryptoJS.AES.decrypt(_id, process.env.CRYPTO_KEY);
      const idDecrypted = idBytes.toString(CryptoJS.enc.Utf8);
      const auth0Token = await validateUser(idDecrypted, 'create:news');
      if (!auth0Token) return res.status(401).json({ error: 'Unauthorized' });

      if (!files || files.length === 0) {
        return res.status(400).json({ error: 'Se requiere una imagen' });
      }

      const file = files[0];
      const sanitizedName = this.sanitizeFilename(file.originalname);

      const cover = await this.newspaperCoverService.create({
        media: body.media,
        link: body.link,
        section: body.section,
        date: body.date,
        created_By: body.created_By,
        image: sanitizedName,
      });

      const folder = path.join(process.cwd(), `public/newspaper-cover/${cover.id}`);
      fs.mkdirSync(folder, { recursive: true });
      fs.writeFileSync(path.join(folder, sanitizedName), file.buffer);

      return res.status(201).json(cover);
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: error.message });
    }
  }

  // Obtener portadas activas (con ?limit= opcional)
  @Get()
  async findAll(@Query('limit') limit: string, @Res() res: Response) {
    try {
      const take = limit ? parseInt(limit, 10) : undefined;
      const covers = await this.newspaperCoverService.findAll(take);
      return res.status(200).json(covers);
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: error.message });
    }
  }

  // Servir la imagen de una portada
  @Get(':id/img/:name')
  getImage(
    @Param('id') id: string,
    @Param('name') name: string,
    @Res({ passthrough: true }) res: Response,
  ): StreamableFile {
    const imgPath = path.join(process.cwd(), `public/newspaper-cover/${id}`, name);
    const mimeType = mime.lookup(name);
    if (mimeType) res.set({ 'Content-Type': mimeType });
    return new StreamableFile(fs.createReadStream(imgPath));
  }

  // Editar una portada
  @Patch(':id')
  @UseInterceptors(FilesInterceptor('images'))
  async update(
    @Param('id') id: string,
    @Body() body: any,
    @UploadedFiles() files,
    @Res() res: Response,
  ) {
    try {
      const _id = res.req.headers.authorization;
      // Sin cabecera, decrypt lanza y caeria al catch como 500: eso es 401.
      if (!_id) return res.status(401).json({ error: 'Unauthorized' });
      const idBytes = CryptoJS.AES.decrypt(_id, process.env.CRYPTO_KEY);
      const idDecrypted = idBytes.toString(CryptoJS.enc.Utf8);
      const auth0Token = await validateUser(idDecrypted, 'create:news');
      if (!auth0Token) return res.status(401).json({ error: 'Unauthorized' });

      const existing = await this.newspaperCoverService.getById(id);
      if (!existing) return res.status(404).json({ error: 'Portada no encontrada' });

      const updateData: any = {
        media: body.media,
        link: body.link,
        section: body.section,
        date: body.date,
        updated_By: body.updated_By,
      };

      if (files && files.length > 0) {
        const folder = path.join(process.cwd(), `public/newspaper-cover/${id}`);
        // Eliminar imagen anterior si existe
        const oldPath = path.join(folder, existing.image);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);

        const file = files[0];
        const sanitizedName = this.sanitizeFilename(file.originalname);
        fs.mkdirSync(folder, { recursive: true });
        fs.writeFileSync(path.join(folder, sanitizedName), file.buffer);
        updateData.image = sanitizedName;
      }

      const updated = await this.newspaperCoverService.update(id, updateData);
      return res.status(200).json(updated);
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: error.message });
    }
  }

  // Eliminar una portada y su carpeta de imágenes
  @Delete(':id')
  async delete(@Param('id') id: string, @Res() res: Response) {
    try {
      const _id = res.req.headers.authorization;
      // Sin cabecera, decrypt lanza y caeria al catch como 500: eso es 401.
      if (!_id) return res.status(401).json({ error: 'Unauthorized' });
      const idBytes = CryptoJS.AES.decrypt(_id, process.env.CRYPTO_KEY);
      const idDecrypted = idBytes.toString(CryptoJS.enc.Utf8);
      const auth0Token = await validateUser(idDecrypted, 'create:news');
      if (!auth0Token) return res.status(401).json({ error: 'Unauthorized' });

      const existing = await this.newspaperCoverService.getById(id);
      if (!existing) return res.status(404).json({ error: 'Portada no encontrada' });

      await this.newspaperCoverService.delete(id);
      const folder = path.join(process.cwd(), `public/newspaper-cover/${id}`);
      await rimraf(folder);

      return res.status(200).json({ message: 'Portada eliminada' });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: error.message });
    }
  }
}
