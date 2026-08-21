-- Agenda: orden manual del admin.
-- Ejecutar por base de datos (pruebas y produccion) ANTES de desplegar el
-- codigo que usa la columna "order".
--
--   psql "$DATABASE_URL" -f prisma/sql/schedule_order.sql
--
-- El paso 1 es OBLIGATORIO: sin la columna, los endpoints de agenda fallan.
-- El paso 2 es opcional (el backend numera solo lo pendiente al crear una
-- agenda), pero deja la tabla consistente desde el primer momento.
-- Ambos pasos son aditivos: no borran ni modifican datos existentes.

BEGIN;

-- 1. Columna nueva. IF NOT EXISTS lo hace repetible sin romper.
ALTER TABLE "Schedule" ADD COLUMN IF NOT EXISTS "order" INTEGER;

-- 2. Numerar las agendas existentes por fecha ascendente (la mas cercana
--    primero). Sin esto quedan en NULL y la primera agenda creada despues
--    del despliegue se colaria al tope de la lista.
WITH ordenadas AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY date ASC NULLS LAST) AS rn
  FROM "Schedule"
)
UPDATE "Schedule" s
SET "order" = o.rn
FROM ordenadas o
WHERE s.id = o.id
  AND s."order" IS NULL;

COMMIT;
