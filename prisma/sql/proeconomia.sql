-- Proeconomia / Radar Economico: boletin, suscriptores, metricas,
-- portadas diarias e indicadores economicos.
--
-- Ejecutar por base de datos (pruebas y produccion) ANTES de desplegar el
-- codigo que usa estas tablas:
--
--   psql "$DATABASE_URL" -f prisma/sql/proeconomia.sql
--
-- Todo es aditivo: crea tablas nuevas y agrega una columna a "News".
-- No borra ni modifica datos existentes. Es repetible: correrlo dos veces
-- no rompe nada.

BEGIN;

-- 1. Noticia destacada del apartado. Sin esta columna, el endpoint de
--    destacados y el admin de Proeconomia fallan.
ALTER TABLE "News" ADD COLUMN IF NOT EXISTS "featured" BOOLEAN DEFAULT false;

-- 2. Boletin.
CREATE TABLE IF NOT EXISTS "Newsletter" (
  "id"                TEXT PRIMARY KEY,
  "title"             TEXT NOT NULL,
  "titleEn"           TEXT,
  "subject"           TEXT NOT NULL,
  "html"              TEXT NOT NULL,
  "state"             TEXT NOT NULL DEFAULT 'draft',
  "cover"             TEXT,
  "tags"              TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "publishDate"       TIMESTAMP(3),
  "scheduledSendDate" TIMESTAMP(3),
  "sentAt"            TIMESTAMP(3),
  "totalSent"         INTEGER NOT NULL DEFAULT 0,
  "totalOpened"       INTEGER NOT NULL DEFAULT 0,
  "totalClicks"       INTEGER NOT NULL DEFAULT 0,
  "created_At"        TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  "updated_At"        TIMESTAMP(3),
  "status"            BOOLEAN DEFAULT true,
  "created_By"        TEXT,
  "updated_By"        TEXT
);

-- 3. Suscriptores del boletin. Lista propia: no se mezcla con
--    "MeSubscriber" (Mujer Exporta), que tiene otro consentimiento.
CREATE TABLE IF NOT EXISTS "NewsletterSubscriber" (
  "id"                TEXT PRIMARY KEY,
  "email"             TEXT NOT NULL,
  "name"              TEXT,
  "status"            BOOLEAN NOT NULL DEFAULT true,
  "unsubscribeToken"  TEXT NOT NULL,
  "unsubscribeReason" TEXT,
  "ipAddress"         TEXT,
  "userAgent"         TEXT,
  "created_At"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "unsubscribed_At"   TIMESTAMP(3)
);

CREATE UNIQUE INDEX IF NOT EXISTS "NewsletterSubscriber_email_key"
  ON "NewsletterSubscriber" ("email");
CREATE UNIQUE INDEX IF NOT EXISTS "NewsletterSubscriber_unsubscribeToken_key"
  ON "NewsletterSubscriber" ("unsubscribeToken");

-- 4. Metricas. Al enviar por el SMTP interno no hay proveedor que las
--    reporte, asi que las contamos aqui: pixel de apertura y redirector
--    de clics.
CREATE TABLE IF NOT EXISTS "NewsletterOpen" (
  "id"           TEXT PRIMARY KEY,
  "newsletterId" TEXT NOT NULL,
  "subscriberId" TEXT,
  "openedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "ipAddress"    TEXT,
  "userAgent"    TEXT
);

CREATE TABLE IF NOT EXISTS "NewsletterClick" (
  "id"           TEXT PRIMARY KEY,
  "newsletterId" TEXT NOT NULL,
  "subscriberId" TEXT,
  "url"          TEXT NOT NULL,
  "clickedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "ipAddress"    TEXT,
  "userAgent"    TEXT
);

-- Claves foraneas aparte, con guarda: ADD CONSTRAINT no admite IF NOT EXISTS.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'NewsletterOpen_newsletterId_fkey') THEN
    ALTER TABLE "NewsletterOpen" ADD CONSTRAINT "NewsletterOpen_newsletterId_fkey"
      FOREIGN KEY ("newsletterId") REFERENCES "Newsletter"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'NewsletterOpen_subscriberId_fkey') THEN
    ALTER TABLE "NewsletterOpen" ADD CONSTRAINT "NewsletterOpen_subscriberId_fkey"
      FOREIGN KEY ("subscriberId") REFERENCES "NewsletterSubscriber"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'NewsletterClick_newsletterId_fkey') THEN
    ALTER TABLE "NewsletterClick" ADD CONSTRAINT "NewsletterClick_newsletterId_fkey"
      FOREIGN KEY ("newsletterId") REFERENCES "Newsletter"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'NewsletterClick_subscriberId_fkey') THEN
    ALTER TABLE "NewsletterClick" ADD CONSTRAINT "NewsletterClick_subscriberId_fkey"
      FOREIGN KEY ("subscriberId") REFERENCES "NewsletterSubscriber"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS "NewsletterOpen_newsletterId_idx"
  ON "NewsletterOpen" ("newsletterId");
CREATE INDEX IF NOT EXISTS "NewsletterClick_newsletterId_idx"
  ON "NewsletterClick" ("newsletterId");

-- 5. Portadas diarias de periodicos.
CREATE TABLE IF NOT EXISTS "NewspaperCover" (
  "id"         TEXT PRIMARY KEY,
  "image"      TEXT NOT NULL,
  "media"      TEXT NOT NULL,
  "link"       TEXT,
  "date"       TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  "created_At" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  "updated_At" TIMESTAMP(3),
  "status"     BOOLEAN DEFAULT true,
  "created_By" TEXT,
  "updated_By" TEXT
);

CREATE INDEX IF NOT EXISTS "NewspaperCover_date_idx"
  ON "NewspaperCover" ("date" DESC);

-- 6. Indicadores del ticker. Carga manual desde el admin.
CREATE TABLE IF NOT EXISTS "EconomicIndicator" (
  "id"         TEXT PRIMARY KEY,
  "key"        TEXT NOT NULL,
  "label"      TEXT NOT NULL,
  "labelEn"    TEXT NOT NULL,
  "value"      TEXT NOT NULL,
  "note"       TEXT,
  "noteEn"     TEXT,
  "order"      INTEGER,
  "created_At" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  "updated_At" TIMESTAMP(3),
  "status"     BOOLEAN DEFAULT true,
  "updated_By" TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS "EconomicIndicator_key_key"
  ON "EconomicIndicator" ("key");

-- 7. Las cuatro filas del ticker, para que la pantalla del admin tenga
--    algo que editar desde el primer momento. ON CONFLICT las deja
--    intactas si ya existen.
INSERT INTO "EconomicIndicator" ("id", "key", "label", "labelEn", "value", "note", "noteEn", "order")
VALUES
  (md5(random()::TEXT || clock_timestamp()::TEXT), 'usd',     'Dolar RD',       'USD RD',           '0.00', 'Referencia diaria',     'Daily reference',     1),
  (md5(random()::TEXT || clock_timestamp()::TEXT), 'eur',     'Euro RD',        'EUR RD',           '0.00', 'Referencia diaria',     'Daily reference',     2),
  (md5(random()::TEXT || clock_timestamp()::TEXT), 'oil',     'Petroleo WTI',   'WTI Oil',          '0.00', 'Precio por barril',     'Price per barrel',    3),
  (md5(random()::TEXT || clock_timestamp()::TEXT), 'freight', 'Flete maritimo', 'Maritime freight', '0.00', 'Contenedor referencial','Reference container', 4)
ON CONFLICT ("key") DO NOTHING;

COMMIT;
