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
  Header,
  NotFoundException,
  Query,
} from '@nestjs/common';
import { NewsService } from './news.service';
import { validateUser } from 'src/validation/validation';
import { NewsDto } from './dto/news.dto';
import { Response } from 'express';
import { FilesInterceptor } from '@nestjs/platform-express';
import { rimraf } from 'rimraf';
import { existsSync, readdirSync } from 'fs';
const CryptoJS = require('crypto-js');

const fs = require('fs');
const path = require('path');
const mime = require('mime-types');

@Controller('apiv2/')
export class NewsController {
  constructor(private readonly newsService: NewsService) { }
  private sanitizeFilename(filename: string): string {
    const ext = path.extname(filename);
    const nameWithoutExt = filename.replace(ext, '');

    // ✅ Mapeo manual de caracteres con tilde (más confiable en Windows)
    const accentMap = {
      'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u',
      'Á': 'A', 'É': 'E', 'Í': 'I', 'Ó': 'O', 'Ú': 'U',
      'ñ': 'n', 'Ñ': 'N',
      'ü': 'u', 'Ü': 'U'
    };

    let sanitized = nameWithoutExt;

    // Reemplaza caracteres acentuados manualmente
    Object.keys(accentMap).forEach(char => {
      sanitized = sanitized.replace(new RegExp(char, 'g'), accentMap[char]);
    });

    // Limpia el resto
    sanitized = sanitized
      .replace(/[^a-zA-Z0-9]/g, '-') // Todo excepto letras/números → guión
      .replace(/-+/g, '-') // Múltiples guiones → uno solo
      .replace(/^-|-$/g, '') // Quita guiones al inicio/final
      .substring(0, 100); // Máximo 100 caracteres

    return sanitized + ext;
  }

  /* Crear una noticia */
  @Post('news')
  @UseInterceptors(FilesInterceptor('files'))
  async createNews(@Body() body: any, @Res() res, @UploadedFiles() files?) {
    try {
      const id = res.req.headers.authorization;
      const idBytes = CryptoJS.AES.decrypt(id, process.env.CRYPTO_KEY);
      const idDecrypted = idBytes.toString(CryptoJS.enc.Utf8);
      const auth0Token = await validateUser(idDecrypted, 'create:news');
      if (!auth0Token) return res.status(401).json({ error: 'Unauthorized' });
      // console.log(body);
      const news = await this.newsService.create(body);
      /* Crear ruta de las noticias */
      // console.log(news);
      if (files === undefined) return res.status(201).json(news);
      /* Guardar archivos */
      // console.log(files);
      await files.forEach(async (file) => {
        const pathFolder = path.join(process.cwd(), `/public/news/${news.id}`);
        if (!fs.existsSync(pathFolder)) {
          fs.mkdirSync(pathFolder, { recursive: true });
        }
        const fileName = file.originalname;
        await fs.writeFileSync(path.join(pathFolder, fileName), file.buffer);
      });
      return res.status(201).json(news);
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error });
    }
  }

  /* Editar una noticia */
@Patch('news/:id')
@UseInterceptors(FilesInterceptor('files'))
async updateNews(
  @Param('id') id: string,
  @Body() body: any,
  @Res() res,
  @UploadedFiles() files?,
) {
  try {
    const _id = res.req.headers.authorization;
    const idBytes = CryptoJS.AES.decrypt(_id, process.env.CRYPTO_KEY);
    const idDecrypted = idBytes.toString(CryptoJS.enc.Utf8);
    const auth0Token = await validateUser(idDecrypted, 'create:news');
    if (!auth0Token) return res.status(401).json({ error: 'Unauthorized' });

    // ✅ Si no hay archivos nuevos, actualiza sin tocar imágenes
    if (!files || files.length === 0) {
      const { images, cover, ...bodyWithoutImages } = body;
      const news = await this.newsService.update(id, bodyWithoutImages);
      return res.status(200).json(news);
    }

    // ✅ Si hay archivos nuevos, procesa normalmente
    const news = await this.newsService.update(id, body);

    const pathFolder = path.join(process.cwd(), `/public/news/${news.id}`);

    if (fs.existsSync(pathFolder)) {
      await rimraf(pathFolder);
    }

    await new Promise(resolve => setTimeout(resolve, 100));

    fs.mkdirSync(pathFolder, { recursive: true });

    const savedFiles = [];

    for (const file of files) {
      const safeFileName = this.sanitizeFilename(file.originalname);
      const filePath = path.join(pathFolder, safeFileName);

      await fs.promises.writeFile(filePath, file.buffer);
      savedFiles.push(safeFileName);
    }

    news.images = savedFiles;
    const updatedNews = await this.newsService.update(news.id, {
      ...body,
      images: JSON.stringify(savedFiles),
       cover: savedFiles[0],
    });

    return res.status(200).json(updatedNews);

  } catch (error) {
    console.error('Error en updateNews:', error);
    return res.status(500).json({ error: error.message });
  }
}
  @Get('/news/images/:id/:name')
  getImages(
    @Param('id') id: string,
    @Param('name') imageName: string,
    @Res({ passthrough: true }) res: Response,
  ): StreamableFile {
    const dirPath = path.join(process.cwd(), `public/news/${id}`);

    if (!existsSync(dirPath)) {
      console.error('❌ Directorio no existe:', dirPath);
      throw new NotFoundException('Directorio no encontrado');
    }

    const files = readdirSync(dirPath);

    if (files.length === 0) {
      throw new NotFoundException('No hay imágenes en este directorio');
    }

    let matchingFile = null;

    // Intento 1: Nombre exacto
    if (files.includes(imageName)) {
      matchingFile = imageName;
    }

    // Intento 2: Sanitizados
    if (!matchingFile) {
      const requestedSanitized = this.sanitizeFilename(imageName);

      matchingFile = files.find(f =>
        this.sanitizeFilename(f) === requestedSanitized
      );
    }

    // Intento 3: Solo letras y números (ignora TODO lo demás)
    if (!matchingFile) {
      const cleanRequested = imageName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Quita tildes
        .replace(/[^a-z0-9.]/g, ''); // Solo letras, números y punto

      matchingFile = files.find(f => {
        const cleanFile = f
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9.]/g, '');

        const matches = cleanFile === cleanRequested;
        if (matches)
        return matches;
      });

      // if (matchingFile) console.log(' Match alfanumérico');
    }

    // Intento 4: Primera imagen (fallback final)
    if (!matchingFile) {
      matchingFile = files.find(f =>
        /\.(jpg|jpeg|png|gif|webp)$/i.test(f)
      );
      // if (matchingFile) console.log(' Usando primera imagen disponible');
    }

    if (!matchingFile) {
      console.error('No se pudo encontrar ninguna coincidencia');
      console.error('Se buscaba:', imageName);
      console.error('Disponibles:', files);
      throw new NotFoundException('Imagen no encontrada');
    }

    // console.log(' Sirviendo archivo:', matchingFile);

    const finalPath = path.join(dirPath, matchingFile);

    const ext = path.extname(finalPath).toLowerCase();
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
    };

    res.set({ 'Content-Type': mimeTypes[ext] || 'image/jpeg' });

    return new StreamableFile(fs.createReadStream(finalPath));
  }

  /* Obtener todos las noticias */
 @Get(':lang/news')
async getAllEsNews(
  @Param('lang') lang: string,
  @Query('all') all: string,
  @Res() res
) {
  try {
    const showAll = all === 'true';
    const news = await this.newsService.findAll(lang, showAll);
    return res.status(200).json(news);
  } catch (error) {
    return res.status(404).json({ error });
  }
}


  @Get(':lang/lastTwoNews')
  async getLastTwoNews(@Param('lang') lang: string): Promise<any> {
    try {
      const lastTwoNews = await this.newsService.findLastTwo(lang);
      return lastTwoNews;
    } catch (error) {
      // Manejar errores adecuadamente
      throw new Error(error);
    }
  }

  // Obtener por id
  @Get('news/:id')
  async getOneNewsById(@Param('id') id: string, @Res() res) {
    try {
      const news = await this.newsService.findOneById(id);
      // console.log(news);
      return res.status(200).json(news);
    } catch (error) {
      return res.status(404).json({ error });
    }
  }

  /* Obtener una noticia por id */
  @Get(':lang/news/:id')
  async getOneNews(
    @Param('lang') lang: string,
    @Param('id') id: string,
    @Res() res,
  ) {
    try {
      const news = await this.newsService.findOne(id, lang);
      // console.log(news);
      return res.status(200).json(news);
    } catch (error) {
      return res.status(404).json({ error });
    }
  }

  /* Obtener todas las categorias dependiendo el idioma */
  @Get('news/c/all')
  async getAllCategories(@Res() res) {
    try {
      const categories = await this.newsService.getCategories();
      return res.status(200).json(categories);
    } catch (error) {
      return res.status(404).json({ error });
    }
  }
  // Obtener prev y next por id de la noticia actual
  @Get(':lang/news/prnxt/:id')
  async getPrevNextNews(@Param('id') id: string, @Param('lang') lang: string) {
    try {
      const news = await this.newsService.getPrevNextNews(id, lang);
      return news;
    } catch (error) {
      return { error };
    }
  }

  /* Borrar una noticia */
  @Delete('news/:id')
  async deleteNews(@Param('id') id: string, @Res() res) {
    try {
      // const _id = res.req.headers.authorization;
      // const idBytes = CryptoJS.AES.decrypt(_id, process.env.CRYPTO_KEY);
      // const idDecrypted = idBytes.toString(CryptoJS.enc.Utf8);
      // const auth0Token = await validateUser(idDecrypted, 'create:news');
      // if (!auth0Token) return res.status(401).json({ error: 'Unauthorized' });
      const news = await this.newsService.delete(id);
      return res.status(200).json(news);
    } catch (error) {
      return res.status(404).json({ error });
    }
  }

  /* Deshabilitar una noticia */
  @Patch('news/disable/:id')
  async disableNews(@Param('id') id: string, @Res() res) {
    try {
      const _id = res.req.headers.authorization;
      const idBytes = CryptoJS.AES.decrypt(_id, process.env.CRYPTO_KEY);
      const idDecrypted = idBytes.toString(CryptoJS.enc.Utf8);
      const auth0Token = await validateUser(idDecrypted, 'create:news');
      if (!auth0Token) return res.status(401).json({ error: 'Unauthorized' });
      const news = await this.newsService.disable(id);
      return res.status(200).json(news);
    } catch (error) {
      return res.status(404).json({ error });
    }
  }

  /* Habilitar una noticia */
  @Patch('news/enable/:id')
  async enableNews(@Param('id') id: string, @Res() res) {
    try {
      const _id = res.req.headers.authorization;
      const idBytes = CryptoJS.AES.decrypt(_id, process.env.CRYPTO_KEY);
      const idDecrypted = idBytes.toString(CryptoJS.enc.Utf8);
      const auth0Token = await validateUser(idDecrypted, 'create:news');
      if (!auth0Token) return res.status(401).json({ error: 'Unauthorized' });
      const news = await this.newsService.enable(id);
      return res.status(200).json(news);
    } catch (error) {
      return res.status(404).json({ error });
    }
  }
}
