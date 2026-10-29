/// <reference types="jest" />
// sanitize-html (via newsletter.service.ts) arrastra htmlparser2, que se publica
// como ESM y jest no transforma node_modules: sin este mock la suite no arranca.
jest.mock('sanitize-html', () => ({
  __esModule: true,
  default: (html: string) => html,
}));

import { Test, TestingModule } from '@nestjs/testing';
import { NewsletterSendService } from './newsletter-send.service';
import { NewsletterService } from './newsletter.service';
import { NewsletterMailService } from './newsletter-mail.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  newsletterSubscriber: { findMany: jest.fn() },
  newsletterDelivery: { findMany: jest.fn(), createMany: jest.fn() },
};

const mockNewsletter = {
  findForSend: jest.fn(),
  lockForSend: jest.fn().mockResolvedValue(undefined),
  markSent: jest.fn().mockResolvedValue(undefined),
  markFailed: jest.fn().mockResolvedValue(undefined),
  findDueScheduled: jest.fn().mockResolvedValue([]),
};

const mockMail = {
  newsletterIssue: jest.fn(),
};

const boletin = {
  id: 'nl-1',
  title: 'Edición 1',
  subject: 'Asunto',
  html: '<p>Hola</p>',
  state: 'scheduled',
  sentAt: null,
  updated_At: new Date(),
};

const dosSuscriptores = [
  { email: 'uno@example.com', unsubscribeToken: 'tok-1' },
  { email: 'dos@example.com', unsubscribeToken: 'tok-2' },
];

describe('NewsletterSendService', () => {
  let service: NewsletterSendService;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockNewsletter.lockForSend.mockResolvedValue(undefined);
    mockNewsletter.markSent.mockResolvedValue(undefined);
    mockNewsletter.markFailed.mockResolvedValue(undefined);
    mockNewsletter.findDueScheduled.mockResolvedValue([]);
    mockPrisma.newsletterDelivery.findMany.mockResolvedValue([]);
    mockPrisma.newsletterDelivery.createMany.mockResolvedValue({ count: 0 });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NewsletterSendService,
        { provide: NewsletterService, useValue: mockNewsletter },
        { provide: NewsletterMailService, useValue: mockMail },
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<NewsletterSendService>(NewsletterSendService);
  });

  // ─── El relay responde ───────────────────────────────────────────────────────

  it('marca el boletín como enviado con el total que salió', async () => {
    mockPrisma.newsletterSubscriber.findMany.mockResolvedValue(dosSuscriptores);
    mockMail.newsletterIssue.mockResolvedValue(undefined);

    await (service as any)._doSend(boletin);

    expect(mockNewsletter.markSent).toHaveBeenCalledWith('nl-1', 2);
    expect(mockNewsletter.markFailed).not.toHaveBeenCalled();
  });

  // ─── El relay no responde ────────────────────────────────────────────────────

  it('no marca como enviado un boletín del que no salió ni un correo', async () => {
    mockPrisma.newsletterSubscriber.findMany.mockResolvedValue(dosSuscriptores);
    mockMail.newsletterIssue.mockRejectedValue(new Error('ECONNREFUSED'));

    await (service as any)._doSend(boletin);

    expect(mockNewsletter.markFailed).toHaveBeenCalledWith('nl-1');
    expect(mockNewsletter.markSent).not.toHaveBeenCalled();
  });

  // ─── Sin suscriptores no es un fallo ─────────────────────────────────────────

  it('sin suscriptores activos lo marca como enviado con cero', async () => {
    mockPrisma.newsletterSubscriber.findMany.mockResolvedValue([]);

    await (service as any)._doSend(boletin);

    expect(mockNewsletter.markSent).toHaveBeenCalledWith('nl-1', 0);
    expect(mockNewsletter.markFailed).not.toHaveBeenCalled();
  });

  // ─── Nadie recibe el mismo boletín dos veces ─────────────────────────────────

  it('salta a quien ya recibió el boletín y cuenta el total acumulado', async () => {
    mockPrisma.newsletterSubscriber.findMany.mockResolvedValue(dosSuscriptores);
    mockPrisma.newsletterDelivery.findMany.mockResolvedValue([
      { email: 'uno@example.com' },
    ]);
    mockMail.newsletterIssue.mockResolvedValue(undefined);

    await (service as any)._doSend(boletin);

    expect(mockMail.newsletterIssue).toHaveBeenCalledTimes(1);
    expect(mockMail.newsletterIssue).toHaveBeenCalledWith(
      'dos@example.com',
      'Asunto',
      expect.any(String),
    );
    expect(mockNewsletter.markSent).toHaveBeenCalledWith('nl-1', 2);
  });

  it('registra la entrega de cada correo que sale', async () => {
    mockPrisma.newsletterSubscriber.findMany.mockResolvedValue(dosSuscriptores);
    mockMail.newsletterIssue.mockResolvedValue(undefined);

    await (service as any)._doSend(boletin);

    expect(mockPrisma.newsletterDelivery.createMany).toHaveBeenCalledWith({
      data: [
        { newsletterId: 'nl-1', email: 'uno@example.com' },
        { newsletterId: 'nl-1', email: 'dos@example.com' },
      ],
      skipDuplicates: true,
    });
  });

  it('no registra entrega del correo que falló', async () => {
    mockPrisma.newsletterSubscriber.findMany.mockResolvedValue(dosSuscriptores);
    mockMail.newsletterIssue
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('550 mailbox unavailable'));

    await (service as any)._doSend(boletin);

    expect(mockPrisma.newsletterDelivery.createMany).toHaveBeenCalledWith({
      data: [{ newsletterId: 'nl-1', email: 'uno@example.com' }],
      skipDuplicates: true,
    });
    expect(mockNewsletter.markSent).toHaveBeenCalledWith('nl-1', 1);
  });

  it('si todos lo recibieron ya, no manda nada y lo marca enviado', async () => {
    mockPrisma.newsletterSubscriber.findMany.mockResolvedValue(dosSuscriptores);
    mockPrisma.newsletterDelivery.findMany.mockResolvedValue([
      { email: 'uno@example.com' },
      { email: 'dos@example.com' },
    ]);

    await (service as any)._doSend(boletin);

    expect(mockMail.newsletterIssue).not.toHaveBeenCalled();
    expect(mockNewsletter.markSent).toHaveBeenCalledWith('nl-1', 2);
    expect(mockNewsletter.markFailed).not.toHaveBeenCalled();
  });

  // ─── Guardas de queueSend ────────────────────────────────────────────────────

  it('rechaza un boletín ya enviado', async () => {
    mockNewsletter.findForSend.mockResolvedValue({
      ...boletin,
      state: 'sent',
      sentAt: new Date(),
    });

    const result = await service.queueSend('nl-1');

    expect(result.queued).toBe(false);
    expect(mockNewsletter.lockForSend).not.toHaveBeenCalled();
  });

  it('no vuelve a disparar un boletín que se está enviando ahora mismo', async () => {
    mockNewsletter.findForSend.mockResolvedValue({
      ...boletin,
      state: 'sending',
      updated_At: new Date(),
    });

    const result = await service.queueSend('nl-1');

    expect(result.queued).toBe(false);
    expect(mockNewsletter.lockForSend).not.toHaveBeenCalled();
  });

  it('permite reintentar un envío que se quedó colgado', async () => {
    mockNewsletter.findForSend.mockResolvedValue({
      ...boletin,
      state: 'sending',
      updated_At: new Date(Date.now() - 2 * 60 * 60 * 1000),
    });
    mockPrisma.newsletterSubscriber.findMany.mockResolvedValue([]);

    const result = await service.queueSend('nl-1');

    expect(result.queued).toBe(true);
    expect(mockNewsletter.lockForSend).toHaveBeenCalledWith('nl-1');
  });
});
