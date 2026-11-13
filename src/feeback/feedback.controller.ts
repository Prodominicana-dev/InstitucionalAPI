import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { validateUser } from '../validation/validation';

const CryptoJS = require('crypto-js');

// Mismo permiso que exige la pantalla /admin/feedback del portal.
const PERMISO = 'create:news';

@Controller('apiv2/feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  // Las rutas de administración devuelven correos y permiten aprobar o
  // rechazar valoraciones: solo para usuarios del admin con permiso.
  private async autorizar(authorization?: string): Promise<void> {
    let ok = false;
    if (authorization) {
      try {
        const id = CryptoJS.AES.decrypt(
          authorization,
          process.env.CRYPTO_KEY,
        ).toString(CryptoJS.enc.Utf8);
        ok = id ? await validateUser(id, PERMISO) : false;
      } catch {
        ok = false;
      }
    }
    if (!ok) throw new UnauthorizedException('No autorizado');
  }

  // ENDPOINTS PÚBLICOS
  @Post()
  create(
    @Body()
    data: {
      name: string;
      email: string;
      message: string;
      rating?: number;
      serviceType?: string;
    },
  ) {
    return this.feedbackService.create(data);
  }

  @Get('public')
  findPublic(@Query('serviceType') serviceType?: string) {
    return this.feedbackService.findPublic(serviceType);
  }

  // ENDPOINTS ADMIN (requieren usuario con permiso)

  @Get('admin/all')
  async findAll(
    @Headers('authorization') auth: string,
    @Query('status') status?: string,
  ) {
    await this.autorizar(auth);
    return this.feedbackService.findAll(status);
  }

  @Get('admin/pending')
  async findPending(@Headers('authorization') auth: string) {
    await this.autorizar(auth);
    return this.feedbackService.findPending();
  }

  @Get('admin/stats')
  async getStats(@Headers('authorization') auth: string) {
    await this.autorizar(auth);
    return this.feedbackService.getStats();
  }

  @Get('admin/:id')
  async findOne(
    @Headers('authorization') auth: string,
    @Param('id') id: string,
  ) {
    await this.autorizar(auth);
    return this.feedbackService.findOne(id);
  }

  @Patch('admin/:id/approve')
  async approve(
    @Headers('authorization') auth: string,
    @Param('id') id: string,
    @Body() body?: { serviceType?: string },
  ) {
    await this.autorizar(auth);
    return this.feedbackService.approve(id, 'admin', body?.serviceType);
  }

  @Patch('admin/:id/update-service-type')
  async updateServiceType(
    @Headers('authorization') auth: string,
    @Param('id') id: string,
    @Body() body: { serviceType: string },
  ) {
    await this.autorizar(auth);
    return this.feedbackService.updateServiceType(id, body.serviceType);
  }

  @Patch('admin/batch-update-approved')
  async batchUpdateApproved(
    @Headers('authorization') auth: string,
    @Body() body: { serviceType: string },
  ) {
    await this.autorizar(auth);
    return this.feedbackService.batchUpdateApprovedServiceType(
      body.serviceType,
    );
  }

  @Patch('admin/:id/reject')
  async reject(
    @Headers('authorization') auth: string,
    @Param('id') id: string,
  ) {
    await this.autorizar(auth);
    return this.feedbackService.reject(id, 'admin');
  }

  @Patch('admin/:id/revert')
  async revertToPending(
    @Headers('authorization') auth: string,
    @Param('id') id: string,
  ) {
    await this.autorizar(auth);
    return this.feedbackService.revertToPending(id);
  }
}
