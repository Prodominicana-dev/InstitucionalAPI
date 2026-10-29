-- Noticias Pro: registro de entregas, una fila por destinatario y boletin.
--
-- Ejecutar por base de datos (pruebas y produccion) ANTES de desplegar el
-- codigo que usa esta tabla:
--
--   psql "$DATABASE_URL" -f prisma/sql/newsletter_entregas.sql
--
-- Aditivo e idempotente. Correrlo dos veces no rompe nada.
--
-- Para que sirve: antes del envio solo quedaba el contador "totalSent" del
-- boletin, asi que si el relay fallaba a mitad de la lista no habia forma de
-- saber a quien le habia llegado, y reintentar duplicaba el correo a esa
-- gente. Con esta tabla el reintento salta a quien ya lo recibio. El indice
-- unico es la garantia de fondo: aunque el envio se dispare dos veces, no
-- puede haber dos entregas del mismo boletin al mismo correo.

BEGIN;

CREATE TABLE IF NOT EXISTS "NewsletterDelivery" (
  "id"           TEXT PRIMARY KEY,
  "newsletterId" TEXT NOT NULL,
  "email"        TEXT NOT NULL,
  "sentAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Clave foranea aparte, con guarda: ADD CONSTRAINT no admite IF NOT EXISTS.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'NewsletterDelivery_newsletterId_fkey') THEN
    ALTER TABLE "NewsletterDelivery" ADD CONSTRAINT "NewsletterDelivery_newsletterId_fkey"
      FOREIGN KEY ("newsletterId") REFERENCES "Newsletter"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;

CREATE UNIQUE INDEX IF NOT EXISTS "NewsletterDelivery_newsletterId_email_key"
  ON "NewsletterDelivery" ("newsletterId", "email");

COMMIT;
