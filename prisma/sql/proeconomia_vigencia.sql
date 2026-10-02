-- Proeconomia: vigencia de los indicadores del ticker.
--
-- Ejecutar por base de datos (pruebas y produccion) ANTES de desplegar el
-- codigo que usa la columna "maxAgeHours":
--
--   psql "$DATABASE_URL" -f prisma/sql/proeconomia_vigencia.sql
--
-- Aditivo e idempotente. Correrlo dos veces no rompe nada.
--
-- Para que sirve: pasada la vigencia, la pagina publica deja de mostrar la
-- cifra y la marca como desactualizada. Un indicador que nadie actualiza se
-- apaga solo, en vez de publicar un dato viejo como si fuera de hoy.

BEGIN;

ALTER TABLE "EconomicIndicator"
  ADD COLUMN IF NOT EXISTS "maxAgeHours" INTEGER DEFAULT 24;

-- Divisas y petroleo: se actualizan a diario.
UPDATE "EconomicIndicator" SET "maxAgeHours" = 24
  WHERE "key" IN ('usd', 'eur', 'oil') AND "maxAgeHours" IS DISTINCT FROM 24;

-- Flete maritimo: carga manual y el indice de referencia es semanal.
UPDATE "EconomicIndicator" SET "maxAgeHours" = 168
  WHERE "key" = 'freight' AND "maxAgeHours" IS DISTINCT FROM 168;

COMMIT;
