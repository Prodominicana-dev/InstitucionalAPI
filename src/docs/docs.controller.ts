import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UploadedFiles,
  UseInterceptors,
  StreamableFile,
  Res,
} from '@nestjs/common';
import { DocsService } from './docs.service';
import { Response } from 'express';
import { FilesInterceptor } from '@nestjs/platform-express';
import { rimraf } from 'rimraf';
const CryptoJS = require('crypto-js');

const fs = require('fs');
const path = require('path');
const mime = require('mime-types');
const { Poppler } = require('node-poppler');

const poppler = new Poppler(process.env.POPPLER_PATH);

@Controller('apiv2/docs')
export class DocsController {
  constructor(private docsService: DocsService) {}

  // Crear un documento
  @Post()
  @UseInterceptors(FilesInterceptor('files'))
  async createDocument(@Body() body: any, @UploadedFiles() files?) {
    try {
      // Convertir tags a array de strings
      if (body.tags) {
        console.log(body.tags);
        const tags = body.tags.split(',');
        console.log(tags);
        body.tags = tags;
      }

      const document = await this.docsService.createDocument(body);
      if (files === undefined) return document;
      await files.forEach(async (file) => {
        const currentDirectory = process.cwd();
        const parentDirectory = path.dirname(currentDirectory);
        const targetDirectory = path.join(parentDirectory, 'Institucional');

        const pathFolder = path.join(targetDirectory, '/public/Documentos');

        const imageFolder = path.join(
          currentDirectory,
          'public/gen-docs',
          `${document.id}`,
        );

        if (!fs.existsSync(pathFolder)) {
          fs.mkdirSync(pathFolder, { recursive: true });
        }

        if (!fs.existsSync(imageFolder)) {
          fs.mkdirSync(imageFolder, { recursive: true });
        }

        const options = {
          firstPageToConvert: 1,
          lastPageToConvert: 1,
          pngFile: true,
        };
        const fileName = `${new Date().getTime()}.${mime.extension(file.mimetype)}`;
        await fs.writeFileSync(
          path.join(pathFolder, file.originalname),
          file.buffer,
        );
        const imageName = `${new Date().getTime()}`;
        const firstPageName = `${imageFolder}/${imageName}`;
        await poppler.pdfToCairo(
          `${pathFolder}/${files[0].originalname}`,
          firstPageName,
          options,
        );

        // Editar el filename
        await this.docsService.updateDocument(document.id, {
          name: files[0].originalname,
          image: `${imageName}`,
          size: files[0].size.toString(),
        });
      });
      return document;
    } catch (error) {
      throw new Error(error);
    }
  }

  // Editar un documento
  @Patch(':id')
  @UseInterceptors(FilesInterceptor('files'))
  async updateDocument(
    @Param('id') id: string,
    @UploadedFiles() files,
    @Body() body: any,
  ) {
    try {
      // Convertir tags a array de strings
      if (body.tags) {
        const tags = body.tags.split(',');
        body.tags = tags;
      }

      const document = await this.docsService.updateDocument(id, body);
      if (files === undefined) return document;
      await files.forEach(async (file) => {
        const currentDirectory = process.cwd();
        const parentDirectory = path.dirname(currentDirectory);
        const targetDirectory = path.join(parentDirectory, 'Institucional');

        const pathFolder = path.join(targetDirectory, '/public/Documentos');

        const imageFolder = path.join(
          currentDirectory,
          'public/gen-docs',
          `${document.id}`,
        );

        // Verificar si existe el documento en pathFolder. SI existe, lo eliminamos
        if (fs.existsSync(path.join(pathFolder, document.name))) {
          await fs.unlinkSync(path.join(pathFolder, document.name));
        }

        // Verificar si existe la carpeta de la imagen. SI existe, la eliminamos y la creamos de nuevo
        if (fs.existsSync(imageFolder)) {
          await rimraf(imageFolder);
          await fs.mkdirSync(imageFolder, { recursive: true });
        }

        // if (!fs.existsSync(pathFolder)) {
        //   await fs.mkdirSync(pathFolder, { recursive: true });
        // } else {
        //   await rimraf(pathFolder);
        //   await fs.mkdirSync(pathFolder, { recursive: true });
        // }
        const options = {
          firstPageToConvert: 1,
          lastPageToConvert: 1,
          pngFile: true,
        };
        const fileName = `${new Date().getTime()}.${mime.extension(file.mimetype)}`;
        await fs.writeFileSync(
          path.join(pathFolder, file.originalname),
          file.buffer,
        );
        const imageName = `${new Date().getTime()}`;
        const firstPageName = `${imageFolder}/${imageName}`;
        await poppler.pdfToCairo(
          `${pathFolder}/${files[0].originalname}`,
          firstPageName,
          options,
        );

        // Editar el filename
        await this.docsService.updateDocument(document.id, {
          name: files[0].originalname,
          image: `${imageName}`,
          size: files[0].size.toString(),
        });
      });
      return document;
    } catch (error) {
      throw new Error(error);
    }
  }

  // Eliminar un documento
  @Delete(':id')
  async deleteDocument(@Param('id') id: string) {
    try {
      // Buscar el documento
      const document = await this.docsService.getDocumentById(id);
      const currentDirectory = process.cwd();
      const parentDirectory = path.dirname(currentDirectory);
      const targetDirectory = path.join(parentDirectory, 'Institucional');

      const pathFolder = path.join(targetDirectory, '/public/Documentos');

      const imageFolder = path.join(
        currentDirectory,
        'public/gen-docs',
        `${document.id}`,
      );

      // Verificar si existe el documento en pathFolder. SI existe, lo eliminamos
      if (fs.existsSync(path.join(pathFolder, document.name))) {
        await fs.unlinkSync(path.join(pathFolder, document.name));
      }

      // Verificar si existe la carpeta de la imagen. SI existe, la eliminamos
      if (fs.existsSync(imageFolder)) {
        await rimraf(imageFolder);
      }

      return await this.docsService.deleteDocument(id);
    } catch (error) {
      throw new Error(error);
    }
  }

  // Obtener todos los documentos
  @Get()
  async getAllDocuments() {
    try {
      return await this.docsService.getAllDocuments();
    } catch (error) {
      throw new Error(error);
    }
  }

  // Obtener un documento por id
  @Get(':id')
  async getDocumentById(@Param('id') id: string) {
    try {
      return await this.docsService.getDocumentById(id);
    } catch (error) {
      throw new Error(error);
    }
  }

  // Obtener la portada de un documento
  @Get('cover/:id/:image')
  getImages(
    @Param('id') id: string,
    @Param('image') imageName: string,
    @Res({ passthrough: true }) res: Response,
  ): StreamableFile | undefined {
    // Buscar documento por id
    const imagePath = path.join(process.cwd(), `public/gen-docs/${id}`);
    // Buscar en el imagePath la imagen que contenga el nombre de la imagen y la extension sea png
    const files = fs.readdirSync(imagePath);
    console.log(files);
    const image = files.find(
      (file) => file.includes(imageName) && file.includes('png'),
    );
    if (!image) {
      return undefined;
    }
    const mimeType = mime.lookup(image);
    if (!mimeType) {
      return undefined;
    }
    const imageFullPath = path.join(imagePath, image);
    const fileStream = fs.createReadStream(imageFullPath);
    const streamableFile = new StreamableFile(fileStream);
    streamableFile.options.type = mimeType;
    return streamableFile;
  }

  @Get('pdf/:id/:pdfName')
  getPostPdf(
    @Param('id') id: string,
    @Param('pdfName') pdfName: string,
    @Res({ passthrough: true }) res: Response,
  ): StreamableFile {
    res.set({ 'Content-Type': 'application/pdf' });
    const pdfPath = path.join(process.cwd(), `public/gen-docs/${id}`, pdfName);
    const fileStream = fs.createReadStream(pdfPath);
    const streamableFile = new StreamableFile(fileStream);
    return streamableFile;
  }
}
