import { Controller, Get, Param } from '@nestjs/common';
import { FeedbackResponsibleService } from './feedback-responsible.service';

/**
 * Controlador para consultar responsables de feedback desde Auth0
 * Los responsables se gestionan mediante permisos en Auth0, no manualmente
 */
@Controller('feedback-responsible')
export class FeedbackResponsibleController {
  constructor(
    private readonly responsibleService: FeedbackResponsibleService,
  ) {}

  /**
   * Listar todos los usuarios con permisos de feedback
   * GET /feedback-responsible
   */
  @Get()
  async findAll() {
    const users = await this.responsibleService.findAll();
    return {
      count: users.length,
      users,
      note: 'Estos usuarios se gestionan desde Auth0 mediante permisos',
    };
  }

  /**
   * Obtener información de un usuario específico
   * GET /feedback-responsible/:userId
   */
  @Get(':userId')
  async findOne(@Param('userId') userId: string) {
    return await this.responsibleService.findOne(userId);
  }

  /**
   * Obtener emails activos (generales)
   * GET /feedback-responsible/emails/general
   */
  @Get('emails/general')
  async getAllEmails() {
    const emails = await this.responsibleService.getAllActive();
    return {
      type: 'general',
      emails,
      count: emails.length,
      permissions: ['manage:feedback', 'manage:feedback-all'],
    };
  }

  /**
   * Obtener emails por tipo de servicio
   * GET /feedback-responsible/emails/:serviceType
   */
  @Get('emails/:serviceType')
  async getEmailsByServiceType(@Param('serviceType') serviceType: string) {
    const emails = await this.responsibleService.getByServiceType(serviceType);
    return {
      serviceType,
      emails,
      count: emails.length,
      note: 'Incluye usuarios con permiso específico y manage:feedback-all',
    };
  }
}
