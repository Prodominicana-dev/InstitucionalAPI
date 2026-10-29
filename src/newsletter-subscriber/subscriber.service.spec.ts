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

  // ─── Normalización del correo ────────────────────────────────────────────────

  it('normaliza el correo a minúsculas y sin espacios antes de buscar y crear', async () => {
    mockPrisma.newsletterSubscriber.findUnique.mockResolvedValue(null);
    mockPrisma.newsletterSubscriber.create.mockResolvedValue({
      id: 'uuid-5',
      email: 'juan@example.com',
      name: 'Juan',
      unsubscribeToken: 'token-5',
      status: true,
    });

    await service.create({ email: '  Juan@Example.COM ', name: 'Juan' });

    expect(mockPrisma.newsletterSubscriber.findUnique).toHaveBeenCalledWith({
      where: { email: 'juan@example.com' },
    });
    expect(mockPrisma.newsletterSubscriber.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ email: 'juan@example.com' }),
    });
  });

  it('detecta el duplicado aunque el correo venga en mayúsculas', async () => {
    mockPrisma.newsletterSubscriber.findUnique.mockResolvedValue({
      id: 'uuid-1',
      email: 'test@example.com',
      status: true,
    });

    await expect(
      service.create({ email: 'TEST@EXAMPLE.COM' }),
    ).rejects.toMatchObject({ status: HttpStatus.CONFLICT });

    expect(mockPrisma.newsletterSubscriber.create).not.toHaveBeenCalled();
  });

  // ─── Prueba de consentimiento ────────────────────────────────────────────────

  it('guarda la IP y el navegador del alta', async () => {
    mockPrisma.newsletterSubscriber.findUnique.mockResolvedValue(null);
    mockPrisma.newsletterSubscriber.create.mockResolvedValue({
      id: 'uuid-6',
      email: 'ip@example.com',
      unsubscribeToken: 'token-6',
      status: true,
    });

    await service.create({
      email: 'ip@example.com',
      ipAddress: '10.0.0.9',
      userAgent: 'Mozilla/5.0',
    });

    expect(mockPrisma.newsletterSubscriber.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        ipAddress: '10.0.0.9',
        userAgent: 'Mozilla/5.0',
      }),
    });
  });

  // ─── Tope de altas por IP ────────────────────────────────────────────────────

  it('bloquea con 429 la sexta alta desde la misma IP en una hora', async () => {
    mockPrisma.newsletterSubscriber.findUnique.mockResolvedValue(null);
    mockPrisma.newsletterSubscriber.create.mockImplementation(({ data }) =>
      Promise.resolve({ ...data, id: 'x', unsubscribeToken: 'tok', status: true }),
    );

    for (let n = 0; n < 5; n++) {
      await service.create({ email: `bot${n}@example.com`, ipAddress: '1.2.3.4' });
    }

    await expect(
      service.create({ email: 'bot5@example.com', ipAddress: '1.2.3.4' }),
    ).rejects.toMatchObject({ status: HttpStatus.TOO_MANY_REQUESTS });

    expect(mockPrisma.newsletterSubscriber.create).toHaveBeenCalledTimes(5);
  });

  it('el cupo es por IP: otra IP sigue pudiendo suscribirse', async () => {
    mockPrisma.newsletterSubscriber.findUnique.mockResolvedValue(null);
    mockPrisma.newsletterSubscriber.create.mockImplementation(({ data }) =>
      Promise.resolve({ ...data, id: 'x', unsubscribeToken: 'tok', status: true }),
    );

    for (let n = 0; n < 5; n++) {
      await service.create({ email: `bot${n}@example.com`, ipAddress: '1.2.3.4' });
    }

    const otra = await service.create({
      email: 'persona@example.com',
      ipAddress: '5.6.7.8',
    });

    expect(otra.email).toBe('persona@example.com');
  });
});
