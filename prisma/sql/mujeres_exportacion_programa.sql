-- Mujeres en Exportación: programa del Encuentro Nacional.
-- Ejecutar por base de datos (pruebas y produccion) ANTES de desplegar el
-- codigo que usa estas tablas:
--
--   psql "$DATABASE_URL" -f prisma/sql/mujeres_exportacion_programa.sql
--
-- Solo crea tablas nuevas (IF NOT EXISTS): no toca datos existentes y se puede
-- repetir sin romper. Los dias iniciales se insertan una sola vez.

BEGIN;

CREATE TABLE IF NOT EXISTS "MexSetting" (
  "key"   TEXT PRIMARY KEY,
  "value" TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS "MexDay" (
  "id"       TEXT PRIMARY KEY,
  "date"     TEXT NOT NULL,
  "label"    TEXT NOT NULL,
  "subtitle" TEXT,
  "order"    INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS "MexSession" (
  "id"          TEXT PRIMARY KEY,
  "dayId"       TEXT NOT NULL REFERENCES "MexDay"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "startTime"   TEXT NOT NULL,
  "endTime"     TEXT,
  "title"       TEXT NOT NULL,
  "type"        TEXT,
  "location"    TEXT,
  "description" TEXT,
  "note"        TEXT,
  "visible"     BOOLEAN NOT NULL DEFAULT true,
  "created_At"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_At"  TIMESTAMP(3)
);
CREATE INDEX IF NOT EXISTS "MexSession_dayId_idx" ON "MexSession"("dayId");

CREATE TABLE IF NOT EXISTS "MexSpeaker" (
  "id"           TEXT PRIMARY KEY,
  "name"         TEXT NOT NULL,
  "position"     TEXT,
  "organization" TEXT,
  "bio"          TEXT,
  "photo"        TEXT
);

CREATE TABLE IF NOT EXISTS "MexSessionSpeaker" (
  "sessionId" TEXT NOT NULL REFERENCES "MexSession"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "speakerId" TEXT NOT NULL REFERENCES "MexSpeaker"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "role"      TEXT NOT NULL DEFAULT 'Panelista',
  "order"     INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY ("sessionId", "speakerId")
);

-- Ajustes iniciales de la pagina.
INSERT INTO "MexSetting" ("key", "value") VALUES
  ('title', 'Programa'),
  ('dates', '18-19 de noviembre 2026'),
  ('intro', ''),
  ('location', ''),
  ('downloadUrl', ''),
  ('published', '0')
ON CONFLICT ("key") DO NOTHING;

-- Los dos dias del encuentro, solo si la tabla esta vacia.
INSERT INTO "MexDay" ("id", "date", "label", "order")
SELECT * FROM (VALUES
  (gen_random_uuid()::text, '2026-11-18', '18 de noviembre', 1),
  (gen_random_uuid()::text, '2026-11-19', '19 de noviembre', 2)
) AS v
WHERE NOT EXISTS (SELECT 1 FROM "MexDay");

COMMIT;
