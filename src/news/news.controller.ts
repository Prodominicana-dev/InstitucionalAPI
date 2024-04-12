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
} from '@nestjs/common';
import { NewsService } from './news.service';
import { validateUser } from 'src/validation/validation';
import { NewsDto } from './dto/news.dto';
import { Response } from 'express';
import { FilesInterceptor } from '@nestjs/platform-express';
import { rimraf } from 'rimraf';
const CryptoJS = require('crypto-js');

const fs = require('fs');
const path = require('path');
const mime = require('mime-types');

@Controller('apiv2/')
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

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
      console.log(body);
      const news = await this.newsService.create(body);
      /* Crear ruta de las noticias */
      console.log(news);
      if (files === undefined) return res.status(201).json(news);
      /* Guardar archivos */
      console.log(files);
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
      const news = await this.newsService.update(id, body);
      if (files === undefined || files.length === 0) {
        return res.status(200).json(news);
      }

      /* Crear ruta de las noticias */
      const pathFolder = path.join(process.cwd(), `/public/news/${news.id}`);

      /* Eliminar la carpeta, si existe */
      await rimraf(pathFolder);

      if (!fs.existsSync(pathFolder)) {
        fs.mkdirSync(pathFolder, { recursive: true });
      }
      /* Guardar archivos */
      await files.forEach(async (file) => {
        const fileName = file.originalname;
        await fs.writeFileSync(path.join(pathFolder, fileName), file.buffer);
        news.image = `${fileName}`;
        await this.newsService.update(news.id, news);
        return res.status(200).json(news);
      });
    } catch (error) {
      return res.status(500).json({ error });
    }
  }

  @Get('/news/images/:id/:name')
  getImages(
    @Param('id') id: string,
    @Param('name') imageName: string,
    @Res({ passthrough: true }) res: Response,
  ): StreamableFile {
    res.set({ 'Content-Type': 'image/jpeg' });
    const imagePath = path.join(process.cwd(), `public/news/${id}`, imageName);
    //   const mimeType = mime.lookup(imageName);
    //   if (!mimeType) {
    //     return undefined;
    //   }
    const fileStream = fs.createReadStream(imagePath);
    const streamableFile = new StreamableFile(fileStream);
    //   streamableFile.options.type = mimeType
    return streamableFile;
  }
  /* Obtener todos las noticias */
  @Get(':lang/news')
  async getAllEsNews(@Param('lang') lang: string, @Res() res) {
    try {
      const news = await this.newsService.findAll(lang);
      console.log(news);
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
      console.log(news);
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
      console.log(news);
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
