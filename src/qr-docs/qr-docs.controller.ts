import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Res,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { validateUser } from 'src/validation/validation';

const CryptoJS = require('crypto-js');
const fs = require('fs');
const path = require('path');

/* Destino de los PDF de los códigos QR: public/QRDocs del portal.
   En producción resuelve a /var/www/Institucional/public/QRDocs.

   Es una carpeta propia, y no la de documentos, porque aquella la administra
   el módulo de documentos, que borra archivos al editar o eliminar registros.
   En QRDocs no escribe nadie más que este módulo. */
function carpetaDestino(): string {
  if (process.env.QR_DOCS_PATH) return process.env.QR_DOCS_PATH;
  const directorioPadre = path.dirname(process.cwd());
  return path.join(directorioPadre, 'Institucional', 'public', 'QRDocs');
}

/* Copia del archivo anterior antes de cada reemplazo. Se guarda dentro de la
   API y no del portal, para que no quede accesible al público. */
function carpetaRespaldos(): string {
  return path.join(process.cwd(), 'qr-backups');
}

/* Copias que se conservan de cada documento. Una sola: la versión que se acaba
   de sustituir, que es la que sirve para deshacer un reemplazo equivocado. Las
   anteriores solo ocuparían espacio en el servidor. */
const COPIAS_POR_DOCUMENTO = 1;

/* Guarda una copia del archivo antes de sustituirlo o borrarlo, y descarta las
   copias sobrantes de ese mismo documento.

   El nombre queda como <fecha>__<archivo> —o <fecha>__eliminado__<archivo>—.
   La fecha en milisegundos por delante ordena cronológicamente, y el doble
   guion bajo permite identificar a qué documento pertenece cada copia sin
   confundir, por ejemplo, "guia.pdf" con "mi-guia.pdf". */
function respaldar(rutaOrigen: string, nombre: string, motivo = '') {
  const respaldos = carpetaRespaldos();
  asegurarCarpeta(respaldos);

  const marca = motivo ? `${motivo}__` : '';
  fs.copyFileSync(
    rutaOrigen,
    path.join(respaldos, `${Date.now()}__${marca}${nombre}`),
  );

  fs.readdirSync(respaldos)
    .filter((copia: string) => documentoDeLaCopia(copia) === nombre)
    .sort()
    .reverse()
    .slice(COPIAS_POR_DOCUMENTO)
    .forEach((copia: string) => fs.unlinkSync(path.join(respaldos, copia)));
}

/* Recupera a qué documento pertenece una copia, descartando la fecha y la
   marca inicial. Se reconstruye el resto en lugar de tomar el último tramo,
   porque el propio archivo puede contener dobles guiones bajos y en ese caso
   se confundiría con otro documento. */
function documentoDeLaCopia(copia: string): string {
  const partes = copia.split('__');
  partes.shift();
  if (partes[0] === 'eliminado') partes.shift();
  return partes.join('__');
}

function asegurarCarpeta(ruta: string) {
  if (!fs.existsSync(ruta)) fs.mkdirSync(ruta, { recursive: true });
}

/* Deja el nombre en su forma segura: sin rutas, sin caracteres que rompan una
   URL y siempre con extensión .pdf. */
function nombreSeguro(nombre: string): string {
  const base = path.basename(`${nombre}`).replace(/[/\\?%*:|"<>]/g, '');
  return base.toLowerCase().endsWith('.pdf') ? base : `${base}.pdf`;
}

@Controller('apiv2/qr-docs')
export class QrDocsController {
  /* Listado de los PDF disponibles en la carpeta de los códigos QR */
  @Get()
  async listarDocumentos(@Res() res) {
    try {
      const carpeta = carpetaDestino();
      asegurarCarpeta(carpeta);

      const archivos = fs
        .readdirSync(carpeta)
        .filter((nombre: string) => nombre.toLowerCase().endsWith('.pdf'))
        .map((nombre: string) => {
          const datos = fs.statSync(path.join(carpeta, nombre));
          return {
            name: nombre,
            size: datos.size,
            updatedAt: datos.mtime,
            url: `${process.env.PORTAL_BASE_URL || ''}/QRDocs/${encodeURIComponent(nombre)}`,
          };
        })
        .sort((a: any, b: any) => a.name.localeCompare(b.name));

      return res.status(200).send(archivos);
    } catch (error) {
      return res
        .status(500)
        .send({ message: 'Error al obtener los documentos' });
    }
  }

  /* Sube un PDF nuevo o reemplaza uno existente conservando su nombre.

     Se usa el interceptor sin opciones, igual que los módulos de documentos y
     eventos: el archivo llega en memoria y se escribe de una vez. Es la forma
     que ya funciona en este servidor. */
  @Post()
  @UseInterceptors(FilesInterceptor('files'))
  async subirDocumento(@UploadedFiles() files, @Body() body: any, @Res() res) {
    try {
      const _id = res.req.headers.authorization;
      const idBytes = CryptoJS.AES.decrypt(_id, process.env.CRYPTO_KEY);
      const idDecrypted = idBytes.toString(CryptoJS.enc.Utf8);
      const auth0Token = await validateUser(idDecrypted, 'create:transparency');
      if (!auth0Token) {
        return res.status(401).send({ message: 'Unauthorized' });
      }

      if (!files || files.length === 0) {
        return res
          .status(400)
          .send({ message: 'No se recibió ningún archivo' });
      }

      const archivo = files[0];
      if (archivo.mimetype !== 'application/pdf') {
        return res
          .status(400)
          .send({ message: 'Solo se admiten archivos en formato PDF' });
      }

      /* El nombre lo decide quien administra: en un reemplazo llega el del
         archivo que se está sustituyendo, para que la dirección del código QR
         no cambie. */
      const nombre = nombreSeguro(body.name || archivo.originalname);
      const carpeta = carpetaDestino();
      asegurarCarpeta(carpeta);

      const destino = path.join(carpeta, nombre);
      const existia = fs.existsSync(destino);

      if (existia) respaldar(destino, nombre);

      fs.writeFileSync(destino, archivo.buffer);

      const datos = fs.statSync(destino);

      return res.status(201).send({
        name: nombre,
        size: datos.size,
        updatedAt: datos.mtime,
        replaced: existia,
        url: `${process.env.PORTAL_BASE_URL || ''}/QRDocs/${encodeURIComponent(nombre)}`,
      });
    } catch (error) {
      return res.status(500).send({ message: 'Error al guardar el documento' });
    }
  }

  /* Elimina un documento de la carpeta de los códigos QR.

     Sirve para corregir un nombre mal escrito: como el nombre no se puede
     cambiar al reemplazar —es la dirección impresa en el código—, la única
     forma de arreglar una errata es borrar el archivo y volver a subirlo.

     Antes de borrar se guarda una copia en qr-backups, de modo que un
     borrado por equivocación siga siendo recuperable desde el servidor. */
  @Delete(':nombre')
  async eliminarDocumento(@Param('nombre') nombre: string, @Res() res) {
    try {
      const _id = res.req.headers.authorization;
      const idBytes = CryptoJS.AES.decrypt(_id, process.env.CRYPTO_KEY);
      const idDecrypted = idBytes.toString(CryptoJS.enc.Utf8);
      const auth0Token = await validateUser(idDecrypted, 'create:transparency');
      if (!auth0Token) {
        return res.status(401).send({ message: 'Unauthorized' });
      }

      const archivo = nombreSeguro(decodeURIComponent(nombre));
      const ruta = path.join(carpetaDestino(), archivo);

      if (!fs.existsSync(ruta)) {
        return res.status(404).send({ message: 'El documento no existe' });
      }

      respaldar(ruta, archivo, 'eliminado');
      fs.unlinkSync(ruta);

      return res.status(200).send({ name: archivo, deleted: true });
    } catch (error) {
      return res
        .status(500)
        .send({ message: 'Error al eliminar el documento' });
    }
  }
}
