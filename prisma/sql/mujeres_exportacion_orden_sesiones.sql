-- Mujeres en Exportación: orden manual entre las sesiones que empiezan a la
-- misma hora. Ejecutar en la base "institucional" ANTES de desplegar la API.
-- Solo agrega una columna (IF NOT EXISTS): se puede repetir sin romper.
-- Las existentes quedan en 0 y siguen saliendo como hasta ahora (por creación).

ALTER TABLE "MexSession" ADD COLUMN IF NOT EXISTS "order" INTEGER NOT NULL DEFAULT 0;
