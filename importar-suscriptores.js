/* Vuelca una lista de empleados internos en NewsletterSubscriber para que
   reciban el boletín de Noticias Pro.

   Uso:
     node importar-suscriptores.js empleados.csv            (simulación, no escribe)
     node importar-suscriptores.js empleados.csv --aplicar  (da de alta)

   El archivo puede ser CSV separado por coma o por punto y coma, con o sin
   cabecera. Si la trae, se buscan las columnas "correo"/"email" y
   "nombre"/"name"; si no, se asume correo en la primera columna y nombre en la
   segunda.

   No se envía el correo de bienvenida: estos empleados no se suscribieron. Por
   eso el alta va contra Prisma y no por SubscriberService, que sí lo manda.
   A quien ya se dio de baja NO se le reactiva. */

const fs = require('fs');
const { PrismaClient } = require('@prisma/client');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function celdas(linea, sep) {
  return linea.split(sep).map((c) => c.trim().replace(/^"|"$/g, ''));
}

function leerCsv(ruta) {
  const texto = fs.readFileSync(ruta, 'utf8').replace(/^﻿/, '');
  const lineas = texto.split(/\r?\n/).filter((l) => l.trim() !== '');
  if (lineas.length === 0) return [];

  const sep = (lineas[0].match(/;/g) || []).length > (lineas[0].match(/,/g) || []).length ? ';' : ',';
  const primera = celdas(lineas[0], sep);

  let iCorreo = 0;
  let iNombre = 1;
  let desde = 0;

  const hayCabecera = !primera.some((c) => EMAIL_REGEX.test(c));
  if (hayCabecera) {
    const bajas = primera.map((c) => c.toLowerCase());
    const buscar = (claves) => bajas.findIndex((c) => claves.some((k) => c.includes(k)));
    iCorreo = buscar(['correo', 'email', 'e-mail']);
    iNombre = buscar(['nombre', 'name']);
    desde = 1;
    if (iCorreo === -1) {
      throw new Error(`No se encontró columna de correo en la cabecera: ${primera.join(' | ')}`);
    }
  }

  return lineas.slice(desde).map((linea) => {
    const c = celdas(linea, sep);
    return {
      email: (c[iCorreo] || '').toLowerCase(),
      name: iNombre >= 0 ? c[iNombre] || null : null,
    };
  });
}

async function main() {
  const ruta = process.argv[2];
  const aplicar = process.argv.includes('--aplicar');

  if (!ruta) {
    console.error('Falta el archivo. Uso: node importar-suscriptores.js empleados.csv [--aplicar]');
    process.exit(1);
  }

  const filas = leerCsv(ruta);
  const invalidos = filas.filter((f) => !EMAIL_REGEX.test(f.email));

  const porCorreo = new Map();
  for (const f of filas) {
    if (EMAIL_REGEX.test(f.email) && !porCorreo.has(f.email)) porCorreo.set(f.email, f);
  }

  const prisma = new PrismaClient();
  const existentes = await prisma.newsletterSubscriber.findMany({
    where: { email: { in: [...porCorreo.keys()] } },
    select: { email: true, status: true },
  });

  const activos = existentes.filter((e) => e.status).map((e) => e.email);
  const dadosDeBaja = existentes.filter((e) => !e.status).map((e) => e.email);
  const yaEstan = new Set(existentes.map((e) => e.email));
  const nuevos = [...porCorreo.values()].filter((f) => !yaEstan.has(f.email));

  console.log(`Archivo:            ${ruta}`);
  console.log(`Filas leídas:       ${filas.length}`);
  console.log(`Correos inválidos:  ${invalidos.length}${invalidos.length ? ' -> ' + invalidos.map((f) => f.email || '(vacío)').join(', ') : ''}`);
  console.log(`Duplicados:         ${filas.length - invalidos.length - porCorreo.size}`);
  console.log(`Ya suscritos:       ${activos.length}`);
  console.log(`Dados de baja:      ${dadosDeBaja.length} (no se reactivan)${dadosDeBaja.length ? ' -> ' + dadosDeBaja.join(', ') : ''}`);
  console.log(`Se darán de alta:   ${nuevos.length}`);

  if (!aplicar) {
    console.log('\nSimulación: no se escribió nada. Repita con --aplicar para dar de alta.');
    await prisma.$disconnect();
    return;
  }

  const { count } = await prisma.newsletterSubscriber.createMany({
    data: nuevos.map((f) => ({ email: f.email, name: f.name })),
    skipDuplicates: true,
  });

  const total = await prisma.newsletterSubscriber.count({ where: { status: true } });
  console.log(`\nAltas insertadas:   ${count}`);
  console.log(`Suscriptores activos ahora: ${total}`);

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
