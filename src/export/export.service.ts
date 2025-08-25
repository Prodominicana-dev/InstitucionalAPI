import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { paginator } from '@nodeteam/nestjs-prisma-pagination';
import { PaginatorTypes } from '@nodeteam/nestjs-prisma-pagination';

const paginate: PaginatorTypes.PaginateFunction = paginator({
  page: 1,
  perPage: 6,
});

@Injectable()
export class ExportService {
  constructor(private prismaService: PrismaService) { }

  // Crear un nuevo exportador
  async createExporter(data: any) {

    const existingExporter = await this.prismaService.company.findUnique({
      where: { rnc: data.rnc },
    });


    if (existingExporter) {
      throw new ConflictException('Exportador con este RNC ya existe');
    }

    // console.log('Creating exporter with data:', data);

    try {
      return await this.prismaService.company.create({
        data: {
          name: data.name,
          rnc: data.rnc,
          email: data.email,
          phone: data.phone,
          address: data.address,
          authorized: data.authorized,
          fob: data.fob,
          province: data.province,
          isWoman: data.isWoman,
          product: {
            create: data.products?.map((product: any) => ({
              product: {
                connect: { code: product },
              },
            })),
          },
          website: data.website,
          created_By: data.created_By,
        },
      });
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  }

  // Editar un exportador
  async updateExporter(id: string, data: any) {
    try {
      return await this.prismaService.company.update({
        where: { id: id },
        data: {
          name: data.name,
          rnc: data.rnc,
          email: data.email,
          phone: data.phone,
          address: data.address,
          authorized: data.authorized,
          fob: data.fob,
          province: data.province,
          isWoman: data.isWoman,
          product:
            data.products != null
              ? {
                deleteMany: {},
                create: data.products.map((product: any) => ({
                  product: {
                    connect: { code: product },
                  },
                })),
              }
              : undefined,
          updated_At: new Date(),
          website: data.website,
        },
      });
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  }

  async update(id: string, data: any) {
    try {
      return await this.prismaService.company.update({
        where: { id },
        data: data,
      });
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  }

  // Eliminar un exportador
  async deleteExporter(id: string) {
    try {
      return await this.prismaService.company.delete({
        where: { id },
      });
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  }

  // Obtener todos los exportadores
  async exporters(authorized: boolean = true) {
    try {
      return await this.prismaService.company.findMany({
        include: { product: { include: { product: true, sector: true } } },
        where: { authorized },
        orderBy: { fob: 'desc' },
      });
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  }

  // Pagination for exporters
  async exportersPaginate(
    page?: number,
    perPage?: number,
    search?: string,
    product?: string,
    sector?: string,
    province?: string,
    isWoman?: boolean,
    isAuthorized?: boolean,
  ) {
    try {
      // console.log('authorized', isAuthorized);
      // console.log('--- START EXPORTERS PAGINATE ---');
      // console.log('Search input:', search);
      // console.log('Product filter input:', product);
      // console.log('Sector filter input:', sector);
      // console.log('Province filter input:', province);
      // console.log('IsWoman filter input:', isWoman);
      // console.log('IsAuthorized filter input:', isAuthorized);
      let whereClause: any = { AND: [] };

    
      if (isAuthorized !== undefined) {
        whereClause.AND.push({ authorized: isAuthorized });
      }

      if (search) {
        whereClause.AND.push({
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { province: { contains: search, mode: 'insensitive' } },
            {
              product: {
                some: {
                  OR: [
                    { product: { code: { contains: search, mode: 'insensitive' } } },
                    { product: { alias: { contains: search, mode: 'insensitive' } } },
                    { product: { aliasEn: { contains: search, mode: 'insensitive' } } },
                    { product: { name: { contains: search, mode: 'insensitive' } } },
                    { product: { nameEn: { contains: search, mode: 'insensitive' } } },

                    
                    { sector: { code: { contains: search, mode: 'insensitive' } } },
                    { sector: { alias: { contains: search, mode: 'insensitive' } } },
                    { sector: { aliasEn: { contains: search, mode: 'insensitive' } } },
                    { sector: { name: { contains: search, mode: 'insensitive' } } },
                    { sector: { nameEn: { contains: search, mode: 'insensitive' } } },
                  ],
                },
              },
            },
          ],
        });
      }

    
      if (province) {
        whereClause.AND.push({
          province: { contains: province, mode: 'insensitive' },
        });
      }

      if (sector) {
        whereClause.AND.push({
          product: {
            some: {
              OR: [
                { sector: { alias: { contains: sector, mode: 'insensitive' } } },
                { sector: { aliasEn: { contains: sector, mode: 'insensitive' } } },
                { sector: { name: { contains: sector, mode: 'insensitive' } } },
                { sector: { nameEn: { contains: sector, mode: 'insensitive' } } },
                { sector: { code: { contains: sector, mode: 'insensitive' } } },
              ],
            },
          },
        });
      }

      if (product) {
        whereClause.AND.push({
          product: {
            some: {
              OR: [
                { product: { alias: { contains: product, mode: 'insensitive' } } },
                { product: { aliasEn: { contains: product, mode: 'insensitive' } } },
                { product: { name: { contains: product, mode: 'insensitive' } } },
                { product: { nameEn: { contains: product, mode: 'insensitive' } } },
                { product: { code: { contains: product, mode: 'insensitive' } } },
              ],
            },
          },
        });
      }

      if (isWoman) {
        whereClause.AND.push({ isWoman });
      }

      
      if (whereClause.AND && whereClause.AND.length === 0) {
        delete whereClause.AND;
      }

      // console.log('whereClause', JSON.stringify(whereClause, null, 2));

      return await paginate(
        this.prismaService.company,
        {
          include: { product: { include: { product: true, sector: true } } },
          where: whereClause,
          orderBy: { fob: 'desc' },
        },
        { page, perPage: perPage || 27 },
      );
    } catch (error) {
      console.log(error);
      throw error; 
    }
  }


  // // Search for exporters by name, rnc, or product
  // async searchExporters(search: string) {
  //   try {
  //     return await this.prismaService.company.findMany({
  //       include: { product: { include: { product: true, sector: true } } },
  //       where: {
  //         OR: [
  //           { name: { contains: search } },
  //           { rnc: { contains: search } },
  //           { product: { product: { name: { contains: search } } } },
  //         ],
  //       },
  //     });
  //   } catch (error) {
  //     console.log(error);
  //     throw new Error(error);
  //   }
  // }

  // Obtener los mejores exportadores (ordenados de mayor a menor por el fob)
  async topExporters() {
    try {
      return await this.prismaService.company.findMany({
        orderBy: {
          fob: 'desc',
        },
      });
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  }

  // Obtener un exportador por su RNC
  async exporter(rnc: string) {
    try {
      return await this.prismaService.company.findUnique({
        where: { rnc },
      });
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  }
  async getProvinces() {
    try {
      return await this.prismaService.company.groupBy({
        by: ['province'],
        orderBy: [{ province: 'asc' }],
        where: { authorized: true, province: { not: null } },
      });
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  }
}
