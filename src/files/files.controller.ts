import { Controller, Get, Param, Res, StreamableFile } from '@nestjs/common';
import { Response } from 'express';

const fs = require('fs');
const path = require('path');
const mime = require('mime-types');

@Controller('apiv2/files')
export class FilesController {
  /* Obtener imagen */
  @Get('/news/:id/img/:image')
  getImage(
    @Param('id') id: string,
    @Param('image') imageName: string,
    @Res({ passthrough: true }) res: Response,
  ): StreamableFile {
    const imagePath = path.join(process.cwd(), `public/news/${id}/`, imageName);
    const mimeType = mime.lookup(imagePath);
    if (!mimeType) {
      return undefined;
    }
    res.set('Content-Type', mimeType);
    const file = fs.createReadStream(imagePath);
    return new StreamableFile(file);
  }

  @Get('/member/:id/img/:image')
  getMemberImage(
    @Param('id') id: string,
    @Param('image') imageName: string,
    @Res({ passthrough: true }) res: Response,
  ): StreamableFile {
    const imagePath = path.join(
      process.cwd(),
      `public/member/${id}/`,
      imageName,
    );
    const mimeType = mime.lookup(imagePath);
    if (!mimeType) {
      return undefined;
    }
    res.set('Content-Type', mimeType);
    const file = fs.createReadStream(imagePath);
    return new StreamableFile(file);
  }

  /* Obtener documento cuando tiene sectionID (id) y subsectionID (sid) */
  @Get('/docs/:id/:sid/:doc')
  getDoc(
    @Param('id') id: string,
    @Param('sid') subsectionid: string,
    @Param('doc') docName: string,
    @Res({ passthrough: true }) res: Response,
  ): StreamableFile {
    const imagePath = path.join(
      process.cwd(),
      `public/docs/${id}/${subsectionid}/${docName}`,
    );
    const mimeType = mime.lookup(imagePath);
    if (!mimeType) {
      return undefined;
    }
    res.set('Content-Type', mimeType);
    const file = fs.createReadStream(imagePath);
    return new StreamableFile(file);
  }

  /* Obtener documento cuando tiene sectionID (id) y no tiene subsectionID (sid) */
  @Get('/docs/:id/:doc')
  getDoc2(
    @Param('id') id: string,
    @Param('doc') docName: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const imagePath = path.join(process.cwd(), `public/docs/${id}/${docName}`);
    const file = fs.readFileSync(imagePath);
    const mimeType = mime.lookup(imagePath);
    if (!mimeType) {
      return undefined;
    }
    const blob = new Blob([file], { type: mimeType });

    res.setHeader('Content-Type', mimeType);
    res.attachment();
    res.send(blob);
  }
}
