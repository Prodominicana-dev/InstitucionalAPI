/// <reference types="jest" />
import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { SubscriberService } from './subscriber.service';
import { PrismaService } from '../prisma/prisma.service';
import { NewsletterMailService } from '../newsletter/newsletter-mail.service';

const mockPrisma = {
  newsletterSubscriber: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findMany: jest.fn(),
  },
};

const mockMail = {
  newsletterWelcome: jest.fn().mockResolvedValue(undefined),
};

describe('SubscriberService', () => {
  let service: SubscriberService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriberService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: NewsletterMailService, useValue: mockMail },
      ],
    }).compile();

    service = module.get<SubscriberService>(SubscriberService);
  });

  // ─── Alta nueva ──────────────────────────────────────────────────────────────

  it('crea un nuevo suscriptor y envía el correo de bienvenida', async () => {
    mockPrisma.newsletterSubscriber.findUnique.mockResolvedValue(null);
    mockPrisma.newsletterSubscriber.create.mockResolvedValue({
      id: 'uuid-1',
      email: 'test@example.com',
      name: 'Juan',
      unsubscribeToken: 'token-abc',
      status: true,
      created_At: new Date(),
      unsubscribed_At: null,
    });

    const result = await service.create({ email: 'test@example.com', name: 'Juan' });

    expect(mockPrisma.newsletterSubscriber.create).toHaveBeenCalledWith({
      data: { email: 'test@example.com', name: 'Juan' },
    });
    expect(mockMail.newsletterWelcome).toHaveBeenCalledWith(
      'test@example.com',
      'Juan',
      'token-abc',
    );
    expect(result.email).toBe('test@example.com');
  });

  // ─── Alta repetida (activo) → 409 ────────────────────────────────────────────

  it('lanza 409 si el correo ya existe y está activo', async () => {
    mockPrisma.newsletterSubscriber.findUnique.mockResolvedValue({
      id: 'uuid-1',
      email: 'test@example.com',
      status: true,
    });

    await expect(
      service.create({ email: 'test@example.com' }),
    ).rejects.toMatchObject({
      status: HttpStatus.CONFLICT,
    });

    expect(mockPrisma.newsletterSubscriber.create).not.toHaveBeenCalled();
  });

  // ─── Alta de uno dado de baja → reactiva ─────────────────────────────────────

  it('reactiva un suscriptor dado de baja y envía bienvenida', async () => {
    mockPrisma.newsletterSubscriber.findUnique.mockResolvedValue({
      id: 'uuid-2',
      email: 'baja@example.com',
      name: 'María',
      status: false,
      unsubscribeToken: 'token-xyz',
    });
    mockPrisma.newsletterSubscriber.update.mockResolvedValue({
      id: 'uuid-2',
      email: 'baja@example.com',
      name: 'María',
      status: true,
      unsubscribeToken: 'token-xyz',
    });

    const result = await service.create({ email: 'baja@example.com', name: 'María' });

    expect(mockPrisma.newsletterSubscriber.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'uuid-2' },
        data: expect.objectContaining({ status: true, unsubscribed_At: null }),
      }),
    );
    expect(mockMail.newsletterWelcome).toHaveBeenCalledWith(
      'baja@example.com',
      'María',
      'token-xyz',
    );
    expect(result.status).toBe(true);
  });

  // ─── Baja por token válido ────────────────────────────────────────────────────

  it('da de baja un suscriptor activo por token', async () => {
    mockPrisma.newsletterSubscriber.findUnique.mockResolvedValue({
      id: 'uuid-3',
      email: 'activo@example.com',
      status: true,
      unsubscribeToken: 'valid-token',
    });
    mockPrisma.newsletterSubscriber.update.mockResolvedValue({});

    const result = await service.unsubscribeByToken('valid-token');

    expect(mockPrisma.newsletterSubscriber.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'uuid-3' },
        data: expect.objectContaining({ status: false }),
      }),
    );
    expect(result.success).toBe(true);
  });

  // ─── Token inexistente → 404 ──────────────────────────────────────────────────

  it('lanza 404 si el token no existe', async () => {
    mockPrisma.newsletterSubscriber.findUnique.mockResolvedValue(null);

    await expect(service.unsubscribeByToken('no-existe')).rejects.toMatchObject({
      status: HttpStatus.NOT_FOUND,
    });
  });

  // ─── Baja repetida → idempotente ─────────────────────────────────────────────

  it('es idempotente: responde éxito si ya estaba dado de baja', async () => {
    mockPrisma.newsletterSubscriber.findUnique.mockResolvedValue({
      id: 'uuid-4',
      email: 'ya-baja@example.com',
      status: false,
      unsubscribeToken: 'token-baja',
    });

    const result = await service.unsubscribeByToken('token-baja');

    expect(mockPrisma.newsletterSubscriber.update).not.toHaveBeenCalled();
    expect(result.success).toBe(true);
    expect(result.message).toMatch(/ya estaba cancelada/);
  });
});
