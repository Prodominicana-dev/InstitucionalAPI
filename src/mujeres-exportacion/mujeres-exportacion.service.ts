import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

// Claves de ajustes que el panel puede editar.
export const AJUSTES = ['title', 'dates', 'intro', 'location', 'downloadUrl', 'published'];

const HORA = /^([01]\d|2[0-3]):[0-5]\d$/;
const FECHA = /^\d{4}-\d{2}-\d{2}$/;

const texto = (v: any, max = 5000): string => String(v ?? '').trim().slice(0, max);
const opcional = (v: any, max = 5000): string | null => texto(v, max) || null;

@Injectable()
export class MujeresExportacionService {
  constructor(private readonly prismaService: PrismaService) {}

  async getSettings(): Promise<Record<string, string>> {
    const rows = await this.prismaService.mexSetting.findMany();
    return Object.fromEntries(rows.map((r) => [r.key, r.value]));
  }

  async updateSettings(body: any) {
    const ops = AJUSTES.filter((k) => k in body).map((key) => {
      const value = key === 'published' ? (body[key] ? '1' : '0') : texto(body[key]);
      return this.prismaService.mexSetting.upsert({
        where: { key },
        create: { key, value },
        update: { value },
      });
    });
    await this.prismaService.$transaction(ops);
    return this.getSettings();
  }

  // Días con sus sesiones (ordenadas por hora) y los ponentes de cada sesión.
  // Las que vienen de Capacita llevan el color de su categoría (el propio del
  // admin si lo puso, si no el de Capacita).
  async getDays(includeHidden: boolean) {
    const categorias = await this.prismaService.mexCategory.findMany();
    const colorDe = new Map(categorias.map((c) => [c.id, c.customColor || c.color]));
    const days = await this.prismaService.mexDay.findMany({
      orderBy: [{ order: 'asc' }, { date: 'asc' }],
      include: {
        sessions: {
          where: includeHidden ? {} : { visible: true },
          orderBy: [{ startTime: 'asc' }, { order: 'asc' }, { created_At: 'asc' }],
          include: {
            speakers: { orderBy: { order: 'asc' }, include: { speaker: true } },
          },
        },
      },
    });
    return days.map((d) => ({
      ...d,
      sessions: d.sessions.map(({ speakers, ...s }) => ({
        ...s,
        categoryColor: s.capacitaTipo ? colorDe.get(s.capacitaTipo) || null : null,
        speakers: speakers.map((sp) => ({ ...sp.speaker, role: sp.role })),
      })),
    }));
  }

  async getPublicProgram() {
    const settings = await this.getSettings();
    if (settings.published !== '1') {
      return { settings: { title: settings.title, dates: settings.dates }, days: [], unpublished: true };
    }
    // Solo los ajustes editables (no el estado interno de la sincronización).
    const publicos = Object.fromEntries(AJUSTES.filter((k) => k in settings).map((k) => [k, settings[k]]));
    return { settings: publicos, days: await this.getDays(false) };
  }

  async getAdmin() {
    const [settings, days, speakers, categories] = await Promise.all([
      this.getSettings(),
      this.getDays(true),
      this.prismaService.mexSpeaker.findMany({ orderBy: { name: 'asc' } }),
      this.prismaService.mexCategory.findMany({ orderBy: { label: 'asc' } }),
    ]);
    return { settings, days, speakers, categories };
  }

  // Días
  private validarDia(body: any) {
    if (!FECHA.test(body.date || '')) throw new BadRequestException('La fecha no es válida.');
    if (!texto(body.label)) throw new BadRequestException('Escribe la etiqueta del día (por ejemplo, "18 de noviembre").');
    return { date: body.date, label: texto(body.label, 200), subtitle: opcional(body.subtitle, 300) };
  }

  async createDay(body: any) {
    const data = this.validarDia(body);
    const max = await this.prismaService.mexDay.aggregate({ _max: { order: true } });
    return this.prismaService.mexDay.create({ data: { ...data, order: (max._max.order || 0) + 1 } });
  }

  updateDay(id: string, body: any) {
    return this.prismaService.mexDay.update({ where: { id }, data: this.validarDia(body) });
  }

  async reorderDays(ids: string[]) {
    if (!Array.isArray(ids)) throw new BadRequestException('Lista de días no válida.');
    await this.prismaService.$transaction(
      ids.map((id, i) => this.prismaService.mexDay.update({ where: { id }, data: { order: i + 1 } })),
    );
  }

  deleteDay(id: string) {
    return this.prismaService.mexDay.delete({ where: { id } });
  }

  // Sesiones
  private async validarSesion(body: any) {
    const day = body.dayId ? await this.prismaService.mexDay.findUnique({ where: { id: body.dayId } }) : null;
    if (!day) throw new BadRequestException('Selecciona un día válido.');
    if (!HORA.test(body.startTime || '')) throw new BadRequestException('La hora de inicio no es válida.');
    if (body.endTime && !HORA.test(body.endTime)) throw new BadRequestException('La hora de fin no es válida.');
    if (body.endTime && body.endTime <= body.startTime)
      throw new BadRequestException('La hora de fin debe ser posterior a la de inicio.');
    if (!texto(body.title)) throw new BadRequestException('Escribe el título de la sesión.');
    return {
      dayId: body.dayId,
      startTime: body.startTime,
      endTime: body.endTime || null,
      title: texto(body.title, 300),
      type: opcional(body.type, 60),
      location: opcional(body.location, 200),
      description: opcional(body.description),
      note: opcional(body.note, 200),
      visible: body.visible !== false,
    };
  }

  // Ponentes de la sesión en el orden recibido, sin repetir.
  private enlaces(speakers: any) {
    const vistos = new Set<string>();
    return (Array.isArray(speakers) ? speakers : [])
      .filter((s) => s && s.speakerId && !vistos.has(s.speakerId) && vistos.add(s.speakerId))
      .map((s, i) => ({ speakerId: String(s.speakerId), role: texto(s.role, 60) || 'Panelista', order: i }));
  }

  async createSession(body: any) {
    const data = await this.validarSesion(body);
    const order = await siguienteOrden(this.prismaService, data.dayId, data.startTime);
    return this.prismaService.mexSession.create({
      data: { ...data, order, speakers: { create: this.enlaces(body.speakers) } },
    });
  }

  // Orden entre las sesiones que empiezan a la misma hora el mismo día.
  // Recibe los ids en el orden deseado; todas deben compartir día y hora.
  async reorderSessions(ids: any) {
    if (!Array.isArray(ids) || ids.length < 2 || ids.some((x) => typeof x !== 'string'))
      throw new BadRequestException('Lista de sesiones no válida.');
    const sesiones = await this.prismaService.mexSession.findMany({
      where: { id: { in: ids } },
      select: { id: true, dayId: true, startTime: true },
    });
    if (sesiones.length !== new Set(ids).size || sesiones.length !== ids.length)
      throw new BadRequestException('Alguna sesión ya no existe. Recarga la página.');
    const [p] = sesiones;
    if (sesiones.some((s) => s.dayId !== p.dayId || s.startTime !== p.startTime))
      throw new BadRequestException('Solo se pueden ordenar entre sí las sesiones del mismo día y la misma hora.');
    await this.prismaService.$transaction(
      ids.map((id, i) => this.prismaService.mexSession.update({ where: { id }, data: { order: i + 1 } })),
    );
  }

  // Las actividades de Capacita se editan allá; aquí solo se muestran u ocultan.
  private async noDeCapacita(id: string, accion: string) {
    const s = await this.prismaService.mexSession.findUnique({ where: { id }, select: { capacitaId: true } });
    if (!s) throw new NotFoundException('Sesión no encontrada.');
    if (s.capacitaId) throw new BadRequestException(`Esta actividad viene de Capacita: para ${accion}la hazlo en el admin de Capacita.`);
  }

  async updateSession(id: string, body: any) {
    await this.noDeCapacita(id, 'editar');
    const data = await this.validarSesion(body);
    return this.prismaService.$transaction(async (tx) => {
      await tx.mexSessionSpeaker.deleteMany({ where: { sessionId: id } });
      return tx.mexSession.update({
        where: { id },
        data: { ...data, updated_At: new Date(), speakers: { create: this.enlaces(body.speakers) } },
      });
    });
  }

  // Solo los ponentes de una sesión. Es lo único que se edita aquí de las
  // actividades de Capacita: la sincronización nunca toca los ponentes.
  async setSessionSpeakers(id: string, speakers: any) {
    const sesion = await this.prismaService.mexSession.findUnique({ where: { id }, select: { id: true } });
    if (!sesion) throw new NotFoundException('Sesión no encontrada.');
    const enlaces = this.enlaces(speakers);
    const existen = await this.prismaService.mexSpeaker.findMany({
      where: { id: { in: enlaces.map((e) => e.speakerId) } },
      select: { id: true },
    });
    const validos = new Set(existen.map((e) => e.id));
    return this.prismaService.$transaction(async (tx) => {
      await tx.mexSessionSpeaker.deleteMany({ where: { sessionId: id } });
      return tx.mexSession.update({
        where: { id },
        data: {
          updated_At: new Date(),
          speakers: { create: enlaces.filter((e) => validos.has(e.speakerId)).map((e, i) => ({ ...e, order: i })) },
        },
      });
    });
  }

  // Al mostrarla (o al ocultarla a propósito) deja de contar como nueva.
  setSessionVisible(id: string, visible: boolean) {
    return this.prismaService.mexSession.update({ where: { id }, data: { visible: !!visible, isNew: false, updated_At: new Date() } });
  }

  async deleteSession(id: string) {
    await this.noDeCapacita(id, 'eliminar');
    return this.prismaService.mexSession.delete({ where: { id } });
  }

  // Ponentes
  datosPonente(body: any) {
    if (!texto(body.name)) throw new BadRequestException('Escribe el nombre.');
    return {
      name: texto(body.name, 200),
      position: opcional(body.position, 200),
      organization: opcional(body.organization, 200),
      bio: opcional(body.bio),
    };
  }

  createSpeaker(data: any) {
    return this.prismaService.mexSpeaker.create({ data });
  }

  async getSpeaker(id: string) {
    const speaker = await this.prismaService.mexSpeaker.findUnique({ where: { id } });
    if (!speaker) throw new NotFoundException('Ponente no encontrada.');
    return speaker;
  }

  updateSpeaker(id: string, data: any) {
    return this.prismaService.mexSpeaker.update({ where: { id }, data });
  }

  deleteSpeaker(id: string) {
    return this.prismaService.mexSpeaker.delete({ where: { id } });
  }
}

// Siguiente posición para una sesión nueva: queda después de las que ya
// empiezan a esa misma hora ese día (respeta el orden que puso el admin).
export async function siguienteOrden(prisma: any, dayId: string, startTime: string) {
  const max = await prisma.mexSession.aggregate({ where: { dayId, startTime }, _max: { order: true } });
  return (max._max.order || 0) + 1;
}
