import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FeedbackService {
  constructor(
    private prisma: PrismaService,
  ) {}

  async create(data: {
    name: string;
    email: string;
    message: string;
    rating?: number;
    serviceType?: string;
  }) {
    try {
      const feedback = await this.prisma.feedback.create({
        data: {
          name: data.name,
          email: data.email,
          message: data.message,
          rating: data.rating,
          serviceType: data.serviceType,
          status: 'pending',
          isPublic: false,
        },
      });

      return feedback;
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  }

  async findPublic(serviceType?: string) {
    try {
      return await this.prisma.feedback.findMany({
        where: {
          status: 'approved',
          isPublic: true,
          ...(serviceType && { serviceType }),
        },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          message: true,
          rating: true,
          createdAt: true,
        },
      });
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  }

  async findAll(status?: string) {
    try {
      return await this.prisma.feedback.findMany({
        where: status ? { status } : undefined,
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  }

  async findPending() {
    try {
      return await this.prisma.feedback.findMany({
        where: { status: 'pending' },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  }

  async findOne(id: string) {
    try {
      return await this.prisma.feedback.findUnique({
        where: { id },
      });
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  }

  async approve(id: string, userId: string, serviceType?: string) {
    try {
      return await this.prisma.feedback.update({
        where: { id },
        data: {
          status: 'approved',
          isPublic: true,
          reviewedBy: userId,
          reviewedAt: new Date(),
          ...(serviceType && { serviceType }),
        },
      });
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  }

  async reject(id: string, userId: string) {
    try {
      return await this.prisma.feedback.update({
        where: { id },
        data: {
          status: 'rejected',
          isPublic: false,
          reviewedBy: userId,
          reviewedAt: new Date(),
        },
      });
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  }

  async revertToPending(id: string) {
    try {
      return await this.prisma.feedback.update({
        where: { id },
        data: {
          status: 'pending',
          isPublic: false,
          reviewedBy: null,
          reviewedAt: null,
        },
      });
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  }

  async updateServiceType(id: string, serviceType: string) {
    try {
      return await this.prisma.feedback.update({
        where: { id },
        data: { serviceType },
      });
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  }

  async batchUpdateApprovedServiceType(serviceType: string) {
    try {
      const result = await this.prisma.feedback.updateMany({
        where: {
          status: 'approved',
          serviceType: null,
        },
        data: { serviceType },
      });
      return {
        message: `Updated ${result.count} feedbacks with serviceType: ${serviceType}`,
        count: result.count,
      };
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  }

  async getStats() {
    try {
      const [total, pending, approved, rejected] = await Promise.all([
        this.prisma.feedback.count(),
        this.prisma.feedback.count({ where: { status: 'pending' } }),
        this.prisma.feedback.count({ where: { status: 'approved' } }),
        this.prisma.feedback.count({ where: { status: 'rejected' } }),
      ]);

      return {
        total,
        pending,
        approved,
        rejected,
      };
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  }
}