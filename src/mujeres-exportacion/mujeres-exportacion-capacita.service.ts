import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from 'src/prisma/prisma.service';

/* Trae al programa de Mujeres en Exportación las actividades de la agenda de
   ProDominicana Capacita cuyas fechas caen en los días del programa.

   - Capacita es la fuente: título, horas, lugar, tipo e instructor se
     actualizan en cada sincronización.
   - Lo que decide el admin del programa no se toca: si se muestra (visible)
     y el color propio de cada categoría (MexCategory.customColor).
   - Las actividades nuevas llegan ocultas y marcadas como nuevas (isNew).
   - Si una actividad desaparece de Capacita (eliminada, oculta o movida a
     otra fecha) se quita del programa. */

const CAPACITA_URL = (process.env.CAPACITA_URL || 'https://capacita.prodominicana.gob.do').replace(/\/+$/, '');
const CLAVE_ESTADO = 'capacitaSync';
const COLOR = /^#[0-9a-fA-F]{6}$/;
const HORA = /^([01]\d|2[0-3]):[0-5]\d$/;

export interface ResultadoSync {
  ok: boolean;
  at: string;
  nuevas: number;
  actualizadas: number;
  quitadas: number;
  ignoradas: number;
  error?: string;
}

const texto = (v: any, max: number): string | null => {
  const t = String(v ?? '').trim();
  return t ? t.slice(0, max) : null;
};

async function leerJson(url: string) {
  const res = await fetch(url, { signal: AbortSignal.timeout(15000), headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`Capacita respondió ${res.status} en ${url}`);
  return res.json();
}

@Injectable()
export class MexCapacitaService {
  private readonly logger = new Logger('MexCapacita');
  private enCurso: Promise<ResultadoSync> | null = null;

  constructor(private readonly prismaService: PrismaService) {}

  // Cada 5 minutos. CAPACITA_SYNC=off lo apaga (p. ej. en desarrollo).
  @Cron('0 */5 * * * *')
  async automatica() {
    if (process.env.CAPACITA_SYNC === 'off') return;
    const r = await this.sincronizar();
    if (!r.ok) this.logger.warn(`Sincronización con Capacita falló: ${r.error}`);
  }

  // Si ya hay una en curso (la automática y el botón a la vez), se reutiliza.
  sincronizar(): Promise<ResultadoSync> {
    if (!this.enCurso) this.enCurso = this.ejecutar().finally(() => (this.enCurso = null));
    return this.enCurso;
  }

  private async ejecutar(): Promise<ResultadoSync> {
    const at = new Date().toISOString();
    let resultado: ResultadoSync;
    try {
      resultado = { ok: true, at, ...(await this.traer()) };
    } catch (e: any) {
      resultado = { ok: false, at, nuevas: 0, actualizadas: 0, quitadas: 0, ignoradas: 0, error: e?.message || String(e) };
    }
    await this.prismaService.mexSetting.upsert({
      where: { key: CLAVE_ESTADO },
      create: { key: CLAVE_ESTADO, value: JSON.stringify(resultado) },
      update: { value: JSON.stringify(resultado) },
    });
    return resultado;
  }

  private async traer() {
    const [eventos, tipos] = await Promise.all([
      leerJson(`${CAPACITA_URL}/api/agenda`),
      leerJson(`${CAPACITA_URL}/api/agenda-tipos`).catch(() => []),
    ]);
    if (!Array.isArray(eventos)) throw new Error('Capacita devolvió una agenda no válida');

    // Categorías: nombre y color de Capacita; el color propio no se toca.
    for (const t of Array.isArray(tipos) ? tipos : []) {
      const id = texto(t?.id, 60);
      if (!id) continue;
      const label = texto(t.label, 60) || id;
      const color = COLOR.test(t.color || '') ? t.color : '#1495E8';
      await this.prismaService.mexCategory.upsert({ where: { id }, create: { id, label, color }, update: { label, color } });
    }

    const dias = await this.prismaService.mexDay.findMany();
    const diaPorFecha = new Map(dias.map((d) => [d.date, d.id]));
    const existentes = await this.prismaService.mexSession.findMany({
      where: { capacitaId: { not: null } },
      select: { id: true, capacitaId: true },
    });
    const porCapacitaId = new Map(existentes.map((s) => [s.capacitaId, s.id]));

    let nuevas = 0, actualizadas = 0, ignoradas = 0;
    const vistos = new Set<number>();

    for (const ev of eventos) {
      const capacitaId = Number(ev?.id);
      const fecha = String(ev?.date || '').substring(0, 10);
      const dayId = diaPorFecha.get(fecha);
      if (!Number.isInteger(capacitaId) || !dayId || ev.activo === false) continue;
      const titulo = texto(ev.title, 300);
      if (!titulo) { ignoradas++; continue; }
      const inicio = String(ev.start_time || ev.startTime || '').substring(0, 5);
      const fin = String(ev.end_time || ev.endTime || '').substring(0, 5);
      // Sin hora de inicio válida se pone al final del día para no perderla.
      const startTime = HORA.test(inicio) ? inicio : '23:59';
      const tipo = texto(ev.tipo, 60);
      const categoria = tipo ? await this.prismaService.mexCategory.findUnique({ where: { id: tipo } }) : null;

      const datos = {
        dayId,
        startTime,
        endTime: HORA.test(fin) && fin > startTime ? fin : null,
        title: titulo,
        type: categoria?.label || tipo,
        capacitaTipo: tipo,
        location: texto(ev.lugar, 200) || (ev.modalidad === 'virtual' ? 'Virtual' : null),
        speakerText: texto(ev.instructor, 300),
        registrationUrl: `${CAPACITA_URL}/agenda?inscribir=${capacitaId}`,
      };

      vistos.add(capacitaId);
      const id = porCapacitaId.get(capacitaId);
      if (id) {
        await this.prismaService.mexSession.update({ where: { id }, data: { ...datos, updated_At: new Date() } });
        actualizadas++;
      } else {
        await this.prismaService.mexSession.create({ data: { ...datos, capacitaId, visible: false, isNew: true } });
        nuevas++;
      }
    }

    // Las que ya no vienen de Capacita (o cambiaron a una fecha fuera del programa) se quitan.
    // Si Capacita devolvió la agenda vacía no se borra nada, por si fue una falla momentánea.
    const sobran = existentes.filter((s) => !vistos.has(s.capacitaId as number)).map((s) => s.id);
    let quitadas = 0;
    if (sobran.length && eventos.length) {
      quitadas = (await this.prismaService.mexSession.deleteMany({ where: { id: { in: sobran } } })).count;
    }
    return { nuevas, actualizadas, quitadas, ignoradas };
  }

  async estado(): Promise<ResultadoSync | null> {
    const fila = await this.prismaService.mexSetting.findUnique({ where: { key: CLAVE_ESTADO } });
    try { return fila?.value ? JSON.parse(fila.value) : null; } catch { return null; }
  }

  categorias() {
    return this.prismaService.mexCategory.findMany({ orderBy: { label: 'asc' } });
  }

  // color = null vuelve al color de Capacita.
  async colorCategoria(id: string, color: any) {
    const cat = await this.prismaService.mexCategory.findUnique({ where: { id } });
    if (!cat) throw new NotFoundException('Categoría no encontrada.');
    if (color !== null && !COLOR.test(String(color || ''))) throw new BadRequestException('Color no válido.');
    return this.prismaService.mexCategory.update({ where: { id }, data: { customColor: color } });
  }

  marcarRevisada(id: string) {
    return this.prismaService.mexSession.update({ where: { id }, data: { isNew: false } });
  }
}
