-- Noticias Pro: seccion de las portadas diarias.
--
-- Ejecutar por base de datos (pruebas y produccion) ANTES de desplegar el
-- codigo que usa la columna "section":
--
--   psql "$DATABASE_URL" -f prisma/sql/proeconomia_seccion_portadas.sql
--
-- Aditivo e idempotente. Correrlo dos veces no rompe nada.
--
-- Para que sirve: indica a que seccion de Noticias Pro pertenece cada portada
-- (exportación, inversión, internacional o finanzas), igual que la categoria
-- indica la seccion de una noticia. Las portadas ya cargadas se quedan sin
-- seccion y siguen saliendo en todas, que es el comportamiento de hoy.

BEGIN;

ALTER TABLE "NewspaperCover" ADD COLUMN IF NOT EXISTS "section" TEXT;

COMMIT;
