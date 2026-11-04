-- Mujeres en Exportación: actividades traídas de ProDominicana Capacita.
-- Ejecutar en la base "institucional" ANTES de desplegar el código que usa
-- estas columnas. Solo agrega columnas/tablas (IF NOT EXISTS): no toca datos
-- existentes y se puede repetir sin romper.

BEGIN;

ALTER TABLE "MexSession" ADD COLUMN IF NOT EXISTS "capacitaId"      INTEGER;
ALTER TABLE "MexSession" ADD COLUMN IF NOT EXISTS "capacitaTipo"    TEXT;
ALTER TABLE "MexSession" ADD COLUMN IF NOT EXISTS "speakerText"     TEXT;
ALTER TABLE "MexSession" ADD COLUMN IF NOT EXISTS "registrationUrl" TEXT;
ALTER TABLE "MexSession" ADD COLUMN IF NOT EXISTS "isNew"           BOOLEAN NOT NULL DEFAULT false;
CREATE UNIQUE INDEX IF NOT EXISTS "MexSession_capacitaId_key" ON "MexSession"("capacitaId");

CREATE TABLE IF NOT EXISTS "MexCategory" (
  "id"          TEXT PRIMARY KEY,
  "label"       TEXT NOT NULL,
  "color"       TEXT NOT NULL,
  "customColor" TEXT,
  "updated_At"  TIMESTAMP(3)
);

COMMIT;
