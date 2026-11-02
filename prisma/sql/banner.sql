-- Banners de la home administrables desde el admin: agregar, ocultar, eliminar.
--
-- Ejecutar por base de datos (pruebas y produccion) ANTES de desplegar el
-- codigo que usa la tabla "Banner":
--
--   psql "$DATABASE_URL" -f prisma/sql/banner.sql
--
-- Aditivo e idempotente. Crea una tabla nueva y no toca datos existentes.
-- Correrlo dos veces no rompe nada.

BEGIN;

CREATE TABLE IF NOT EXISTS "Banner" (
  "id"         TEXT NOT NULL,
  "image"      TEXT NOT NULL,
  "title"      TEXT NOT NULL,
  "link"       TEXT,
  "external"   BOOLEAN NOT NULL DEFAULT true,
  -- 'es' | 'en'. NULL = sale en todos los idiomas.
  "locale"     TEXT,
  "order"      INTEGER NOT NULL DEFAULT 0,
  -- false = oculto: sigue guardado pero no sale en la home.
  "visible"    BOOLEAN NOT NULL DEFAULT true,
  "created_At" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  "updated_At" TIMESTAMP(3),
  "created_By" TEXT,
  "updated_By" TEXT,
  CONSTRAINT "Banner_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Banner_visible_order_idx" ON "Banner" ("visible", "order");

COMMIT;
