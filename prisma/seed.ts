import axios from 'axios';

const { exec } = require('child_process');
const util = require('util');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const products = require('../public/products.json');
const sectors = require('../public/sectors.json');
const exportersDirectory = require('../public/exportersDirectory.json');
const exporterProductRelation = require('../public/exporterProductRelation.json');
const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout,
});

let totalProcessed = 0;
let successfulRelations = 0;
let errors = 0;

async function seedDatabase() {
  console.log(
    'Creando las empresas exportadoras del directorio... Espere un momento.',
  );

  const rncCounts = {};
  const companiesWithSameRNC = [];

  // Contar cuántas empresas tienen el mismo RNC
  exportersDirectory.forEach((exporter) => {
    const { rnc, name } = exporter;
    if (!rncCounts[rnc]) {
      rncCounts[rnc] = 1;
    } else {
      rncCounts[rnc]++;
      if (rncCounts[rnc] === 2) {
        companiesWithSameRNC.push({ rnc, name });
      }
    }
  });

  console.log('Empresas con el mismo RNC:', companiesWithSameRNC);
  console.log(
    'Cantidad de empresas con el mismo RNC:',
    companiesWithSameRNC.length,
  );

  // Crear directorios de exportadores
  for (const exporter of exportersDirectory) {
    // Verificar si ya existe una empresa con el mismo RNC
    const existingCompany = await prisma.company.findUnique({
      where: {
        rnc: exporter.rnc,
      },
    });

    if (existingCompany) {
      console.log(
        `La empresa con RNC ${exporter.rnc} ya existe en la base de datos.`,
      );
    } else {
      // Si no existe, crear la empresa
      await prisma.company.create({
        data: {
          name: exporter.name,
          rnc: exporter.rnc,
          phone: exporter.phone || 'N/A',
          email: exporter.email || 'N/A',
          province: exporter.province || 'N/A',
          fob: exporter.fob,
          authorized: Boolean(exporter.authorized),
        },
      });
    }
  }

  setTimeout(async () => {
    console.log(
      'Empresas exportadoras creadas con éxito, en 3 segundos se crearán los productos',
    );
  }, 3000);

  console.log('Creando los productos... Espere un momento.');
  // Crear productos
  for (const product of products) {
    // Eliminar el número y el primer guion del nombre
    const nameWithoutPrefix = product.name.replace(/^\d+\.\d+ - /, '');
    // Eliminar el número y el primer guion del nombre en inglés
    const nameEnWithoutPrefix = product.nameEn.replace(/^\d+\.\d+ - /, '');

    await prisma.product.create({
      data: {
        code: product.code,
        name: nameWithoutPrefix,
        nameEn: nameEnWithoutPrefix,
      },
    });
  }
  setTimeout(async () => {
    console.log(
      'Productos creados con éxito, en 3 segundos se crearán las relaciones entre producto y exportador',
    );
  }, 3000);

  console.log('Creando los sectores... Espere un momento.');
  // Crear productos
  for (const sector of sectors) {
    await prisma.sector.create({
      data: {
        code: sector.code,
        name: sector.name,
        nameEn: sector.nameEn,
      },
    });
  }

  console.log(
    'Creando las relaciones entre producto y exportador... Espere un momento.',
  );
  // Crear relaciones entre producto y exportador
  for (const relation of exporterProductRelation) {
    try {
      const product = await prisma.product.findUnique({
        where: {
          code: relation.productId,
        },
      });

      const company = await prisma.company.findUnique({
        where: {
          rnc: relation.rnc,
        },
      });

      if (!product || !company) {
        !product
          ? console.log(
              `El producto con código ${relation.productId} no existe en la base de datos.`,
            )
          : console.log(
              `La empresa con RNC ${relation.rnc} no existe en la base de datos.`,
            );
        errors++;
        continue;
      }
      if (product && company) {
        await prisma.companyProduct.create({
          data: {
            companyId: relation.rnc,
            productId: relation.productId,
            chapter: relation.sectorId,
            fob: relation.fob,
          },
        });
        successfulRelations++;
      }
      totalProcessed++;
      readline.clearLine(process.stdout);
      readline.cursorTo(0);
      readline.write(
        `Procesados: ${totalProcessed} - Registros Exitosos: ${successfulRelations} - Errores: ${errors}`,
      );
    } catch (error) {
      console.error(
        `Error al buscar producto o empresa para la relación: ${relation.productId} - ${relation.rnc}`,
        error,
      );
    }
  }
  setTimeout(async () => {
    console.log('Relaciones entre producto y exportador creadas con éxito... ');
  }, 3000);

  console.log('Fin de la creación de datos, mi niño.');
}

async function main() {
  // await axios.get('http://127.0.0.1:3001/apiv2/data/deleteImages');
  await prisma.$connect();
  // try {
  //   const { stdout, stderr } = await executeCommandAsync('npx prisma db push');
  //   console.log(`Salida: ${stdout}`);
  //   if (stderr) {
  //     console.error(`Error: ${stderr}`);
  //   }
  // } catch (error) {
  //   console.error(`Error: ${error.message}`);
  // }
  await seedDatabase();
  await prisma.$disconnect();
  // }
}
main().catch((error) => {
  console.error(error);
  process.exit(1);
});
