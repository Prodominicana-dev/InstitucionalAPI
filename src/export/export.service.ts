import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { paginator } from '@nodeteam/nestjs-prisma-pagination';
import { PaginatorTypes } from '@nodeteam/nestjs-prisma-pagination';

const paginate: PaginatorTypes.PaginateFunction = paginator({
  page: 1,
  perPage: 6,
});

@Injectable()
export class ExportService {
  constructor(private prismaService: PrismaService) {}

  // Crear un nuevo exportador
  async createExporter(data: any) {
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
          product: {
            deleteMany: {},
            create: data.products.map((product: any) => ({
              product: {
                connect: { code: product },
              },
            })),
          },
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
  async exportersPaginate(page?: number, perPage?: number) {
    try {
      return await paginate(
        this.prismaService.company,
        {
          include: { product: { include: { product: true, sector: true } } },
          where: { authorized: true },
          orderBy: { fob: 'desc' },
        },
        { page, perPage: perPage || 27 },
      );
    } catch (error) {
      console.log(error);
      throw new Error(error);
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

  // Buscar entre todos los products que estan en los exportadores y devolver una lista con todos, sin repeticiones
  async getProducts() {
    try {
      const exporters = await this.exporters();
      const products = exporters.map((exporter) =>
        exporter.product.map((product) => product.product.name),
      );
      const productsList = products.flat();
      const mergedProducts = productsList.reduce(
        (acc, cur) => acc.concat(cur),
        [],
      );
      console.log(mergedProducts);
      return [...new Set(mergedProducts)];
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  }

  // Buscar entre todos los sectores que estan en los exportadores y devolver una lista con todos, sin repeticiones
  async getSectors() {
    try {
      const exporters = await this.exporters();
      const sectors = exporters.map((exporter) =>
        exporter.product.map((product) => {
          if (product.sector) {
            return product.sector.name;
          } else {
            return null; // Puedes realizar alguna acción alternativa aquí si es necesario
          }
        }),
      );
      const sectorsList = sectors.flat();
      const mergedSectors = sectorsList.reduce(
        (acc, cur) => acc.concat(cur),
        [],
      );
      console.log(mergedSectors);
      return [...new Set(mergedSectors)];
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  }

  // Buscar entre todos los exportadores y devolver una lista con todas las provincias, sin repeticiones
  async getProvinces() {
    try {
      const exporters = await this.exporters();
      const provinces = exporters.map((exporter) => exporter.province);
      return [...new Set(provinces)];
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  }
}
