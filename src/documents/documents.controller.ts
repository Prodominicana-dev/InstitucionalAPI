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
import { FilesInterceptor } from '@nestjs/platform-express';
import { DocumentsService } from './documents.service';
import { DocumentSectionSubsectionDto } from './dto/documents.dto';
import { validateUser } from 'src/validation/validation';
import { Response } from 'express';
import mime from 'mime-types';
import { Multer } from 'multer';
const CryptoJS = require('crypto-js');
const fs = require('fs');
const path = require('path');

@Controller('apiv2/documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get()
  async getAllDocuments(@Res() res) {
    try {
      const documents = await this.documentsService.getAllDocuments();
      return res.status(200).json({ documents });
    } catch (error) {
      return res.status(404).json({ error });
    }
  }

  @Get('/s')
  async getDocumentsBySectionOrSubsection(
    @Param('id') id: number,
    @Body() body: DocumentSectionSubsectionDto,
    @Res() res,
  ) {
    try {
      const documents =
        await this.documentsService.getDocumentsBySectionOrSubsection(
          body?.sectionId,
          body?.subsectionId,
        );
      return res.status(200).json({ documents });
    } catch (error) {
      return res.status(404).json({ error });
    }
  }

  @Post()
  @UseInterceptors(FilesInterceptor('files'))
  async create(
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Body() body: DocumentSectionSubsectionDto,
    @Res() res,
  ) {
    try {
      console.log(body);
      const _id = res.req.headers.authorization;
      const idBytes = CryptoJS.AES.decrypt(_id, process.env.CRYPTO_KEY);
      const idDecrypted = idBytes.toString(CryptoJS.enc.Utf8);
      const auth0Token = await validateUser(idDecrypted, 'create:transparency');
      if (!auth0Token) return res.status(401).json({ error: 'Unauthorized' });
      // Si no tiene files, significa que es una url
      if (!files) {
        console.log('no tiene files');
        const data = {
          date: body.date,
          name: body.name,
          url: body.url,
          sectionId: body.sectionId,
          subsectionId: body.subsectionId ? body.subsectionId : null,
        };
        console.log(data);
        const document = await this.documentsService.create(data);
        console.log(document);
        return res.status(201).json({ document });
      }
      /* Crear la carpeta del documento */
      const pathFolder = path.join(
        process.cwd(),
        `public/docs/${body.sectionId}${
          body.subsectionId ? `/${body.subsectionId}` : ''
        }`,
      );

      if (!fs.existsSync(pathFolder)) {
        fs.mkdirSync(pathFolder, { recursive: true });
      }

      files.forEach(async (file) => {
        const fileName = file.originalname;
        const size = file.size;
        const data = {
          date: body.date,
          name: fileName,
          size: size.toString(),
          path: body.subsectionId
            ? `docs/${body.sectionId}/${body.subsectionId}/${fileName}`
            : `docs/${body.sectionId}/${fileName}`,
          sectionId: body.sectionId,
          subsectionId: body.subsectionId ? body.subsectionId : null,
        };

        await fs.writeFileSync(path.join(pathFolder, fileName), file.buffer);
        await this.documentsService.create(data);
      });

      return res.status(201).json({ message: 'Documentos creados' });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error });
    }
  }

  /* Editar un documento o los documentos de una seccion o subseccion */
  @Patch(':id')
  @UseInterceptors(FilesInterceptor('files'))
  async update(
    @Param('id') id: string,
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Body() body: DocumentSectionSubsectionDto,
    @Res() res,
  ) {
    try {
      const _id = res.req.headers.authorization;
      const idBytes = CryptoJS.AES.decrypt(_id, process.env.CRYPTO_KEY);
      const idDecrypted = idBytes.toString(CryptoJS.enc.Utf8);
      const auth0Token = await validateUser(idDecrypted, 'create:transparency');
      if (!auth0Token) return res.status(401).json({ error: 'Unauthorized' });

      /* Verificamos si files tiene algun documento. Si tiene alguno eliminamos el ya existente y agregamos ese, sino solo actualizamos la nueva data. */
      if (files.length > 0) {
        /* Buscamos el documento */
        const doc = await this.documentsService.getById(id);
        const pathFolder = path.join(process.cwd(), `public/${doc.path}`);
        if (fs.existsSync(pathFolder)) await fs.unlinkSync(pathFolder);
        const fileName = files[0].originalname;
        const size = files[0].size;
        const data = {
          date: body.date,
          name: fileName,
          size: size.toString(),
          path: body.subsectionId
            ? `docs/${body.sectionId}/${body.subsectionId}/${fileName}`
            : `docs/${body.sectionId}/${fileName}`,
          sectionId: body.sectionId,
          subsectionId: body.subsectionId ? body.subsectionId : null,
        };
        const documentPath = path.join(process.cwd(), `public/${data.path}`);
        await fs.writeFileSync(documentPath, files[0].buffer);
        const document = await this.documentsService.update(id, data);
        return res.status(200).json({ document });
      }
      const document = await this.documentsService.update(id, body);
      return res.status(200).json({ document });
    } catch (error) {
      return res.status(500).json({ error });
    }
  }

  /* Borrar un documento */
  @Delete(':id')
  async delete(@Param('id') id: string, @Res() res) {
    try {
      const _id = res.req.headers.authorization;
      const idBytes = CryptoJS.AES.decrypt(_id, process.env.CRYPTO_KEY);
      const idDecrypted = idBytes.toString(CryptoJS.enc.Utf8);
      const auth0Token = await validateUser(idDecrypted, 'create:transparency');
      if (!auth0Token) return res.status(401).json({ error: 'Unauthorized' });
      const document = await this.documentsService.getById(id);
      const pathFolder = path.join(process.cwd(), `public/${document.path}`);
      await fs.unlinkSync(pathFolder);
      const documentDeleted = await this.documentsService.delete(id);
      return res.status(200).json({ documentDeleted });
    } catch (error) {
      return res.status(500).json({ error });
    }
  }

  /* Obtener los documentos si tiene subsectionId */
  @Get('/:id/:sid/:document')
  getImage(
    @Param(':id') sectionId: number,
    @Param(':sid') subsectionId: number,
    @Param(':document') document: string,
    @Res({ passthrough: true }) res: Response,
  ): StreamableFile {
    console.log(sectionId, subsectionId, document);
    res.set({ 'Content-Type': 'application/pdf' });
    const documentPath = path.join(
      process.cwd(),
      `public/docs/${sectionId}/${subsectionId}/${document}`,
    );
    const mimeType = mime.lookup(documentPath);
    if (!mimeType) {
      return undefined;
    }
    console.log(mimeType);
    const file = fs.createReadStream(documentPath);
    const streamableFile = new StreamableFile(file);
    return streamableFile;
  }
}
