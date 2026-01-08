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

@Controller('apiv2/feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

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

  // ENDPOINTS ADMIN (protegidos)

  @Get('admin/all')
  async findAll(@Query('status') status?: string) {
    return this.feedbackService.findAll(status);
  }

  @Get('admin/pending')
  async findPending() {
    return this.feedbackService.findPending();
  }

  @Get('admin/stats')
  async getStats() {
    return this.feedbackService.getStats();
  }

  @Get('admin/:id')
  async findOne(@Param('id') id: string) {
    return this.feedbackService.findOne(id);
  }

  @Patch('admin/:id/approve')
  async approve(
    @Param('id') id: string,
    @Body() body?: { serviceType?: string },
  ) {
    return this.feedbackService.approve(id, 'admin', body?.serviceType);
  }

  @Patch('admin/:id/update-service-type')
  async updateServiceType(
    @Param('id') id: string,
    @Body() body: { serviceType: string },
  ) {
    return this.feedbackService.updateServiceType(id, body.serviceType);
  }

  @Patch('admin/batch-update-approved')
  async batchUpdateApproved(@Body() body: { serviceType: string }) {
    return this.feedbackService.batchUpdateApprovedServiceType(
      body.serviceType,
    );
  }

  @Patch('admin/:id/reject')
  async reject(@Param('id') id: string) {
    return this.feedbackService.reject(id, 'admin');
  }

  @Patch('admin/:id/revert')
  async revertToPending(@Param('id') id: string) {
    return this.feedbackService.revertToPending(id);
  }
}