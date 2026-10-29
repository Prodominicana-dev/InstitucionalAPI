/// <reference types="jest" />
// Igual que en newsletter-send.service.spec.ts: sanitize-html arrastra
// htmlparser2, que es ESM y jest no transforma node_modules.
jest.mock('sanitize-html', () => ({
  __esModule: true,
  default: (html: string) => html,
}));

import { Test, TestingModule } from '@nestjs/testing';
import { NewsletterDailyService } from './newsletter-daily.service';
import { NewsletterSendService } from './newsletter-send.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  newsletter: { findFirst: jest.fn(), create: jest.fn() },
  news: { findMany: jest.fn() },
};

const mockSend = {
  queueSend: jest.fn().mockResolvedValue({ queued: true, message: 'Envío en cola' }),
};

// Una noticia de Noticias Pro y otra del portal institucional: lo que las
// distingue es el campo seccion dentro de metadata.
const noticiaPro = { metadata: [{ language: 'es', seccion: 'finanzas' }] };
const noticiaPortal = { metadata: [{ language: 'es' }] };

describe('NewsletterDailyService', () => {
  let service: NewsletterDailyService;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockSend.queueSend.mockResolvedValue({ queued: true, message: 'Envío en cola' });
    mockPrisma.newsletter.create.mockImplementation(({ data }) =>
      Promise.resolve({ id: 'nl-diario', ...data }),
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NewsletterDailyService,
        { provide: NewsletterSendService, useValue: mockSend },
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<NewsletterDailyService>(NewsletterDailyService);
  });

  it('crea la edición del día y la encola cuando hay noticias nuevas', async () => {
    mockPrisma.newsletter.findFirst.mockResolvedValue(null);
    mockPrisma.news.findMany.mockResolvedValue([noticiaPro]);

    await service.enviarEdicionDiaria();

    expect(mockPrisma.newsletter.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ state: 'scheduled', tags: ['diario'] }),
    });
    expect(mockSend.queueSend).toHaveBeenCalledWith('nl-diario');
  });

  it('el cuerpo lleva al apartado de Noticias Pro', async () => {
    mockPrisma.newsletter.findFirst.mockResolvedValue(null);
    mockPrisma.news.findMany.mockResolvedValue([noticiaPro]);

    await service.enviarEdicionDiaria();

    const { html } = mockPrisma.newsletter.create.mock.calls[0][0].data;
    expect(html).toContain('https://prodominicana.gob.do/noticias-pro');
  });

  it('no envía nada si no hay noticias nuevas', async () => {
    mockPrisma.newsletter.findFirst.mockResolvedValue(null);
    mockPrisma.news.findMany.mockResolvedValue([]);

    await service.enviarEdicionDiaria();

    expect(mockPrisma.newsletter.create).not.toHaveBeenCalled();
    expect(mockSend.queueSend).not.toHaveBeenCalled();
  });

  it('no cuenta como nueva una noticia del portal institucional', async () => {
    mockPrisma.newsletter.findFirst.mockResolvedValue(null);
    mockPrisma.news.findMany.mockResolvedValue([noticiaPortal]);

    await service.enviarEdicionDiaria();

    expect(mockPrisma.newsletter.create).not.toHaveBeenCalled();
  });

  it('no crea una segunda edición el mismo día', async () => {
    mockPrisma.newsletter.findFirst.mockResolvedValue({
      id: 'nl-ayer',
      created_At: new Date(),
      tags: ['diario'],
    });
    mockPrisma.news.findMany.mockResolvedValue([noticiaPro]);

    await service.enviarEdicionDiaria();

    expect(mockPrisma.newsletter.create).not.toHaveBeenCalled();
    expect(mockSend.queueSend).not.toHaveBeenCalled();
  });

  it('cuenta las noticias desde la edición anterior, no desde siempre', async () => {
    const anteayer = new Date(Date.now() - 48 * 60 * 60 * 1000);
    mockPrisma.newsletter.findFirst.mockResolvedValue({
      id: 'nl-anteayer',
      created_At: anteayer,
      tags: ['diario'],
    });
    mockPrisma.news.findMany.mockResolvedValue([noticiaPro]);

    await service.enviarEdicionDiaria();

    expect(mockPrisma.news.findMany).toHaveBeenCalledWith({
      where: { status: true, created_At: { gte: anteayer } },
      select: { metadata: true },
    });
    expect(mockSend.queueSend).toHaveBeenCalledWith('nl-diario');
  });

  // ─── Comprobación sin enviar ─────────────────────────────────────────────────

  it('estado() dice que enviaría y no crea ni manda nada', async () => {
    mockPrisma.newsletter.findFirst.mockResolvedValue(null);
    mockPrisma.news.findMany.mockResolvedValue([noticiaPro, noticiaPortal]);

    const estado = await service.estado();

    expect(estado).toMatchObject({
      yaExisteHoy: false,
      noticiasNuevas: 1,
      enviaria: true,
    });
    expect(mockPrisma.newsletter.create).not.toHaveBeenCalled();
    expect(mockSend.queueSend).not.toHaveBeenCalled();
  });

  it('estado() dice que no enviaría si no hay noticias nuevas', async () => {
    mockPrisma.newsletter.findFirst.mockResolvedValue(null);
    mockPrisma.news.findMany.mockResolvedValue([]);

    const estado = await service.estado();

    expect(estado.enviaria).toBe(false);
    expect(estado.noticiasNuevas).toBe(0);
  });
});
