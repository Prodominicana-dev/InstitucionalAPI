import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ServiceService {
  constructor(private prismaService: PrismaService) {}

  //  SERVICE CATEGORY

  // Crear
  async createServiceCategory(data: any) {
    try {
      return await this.prismaService.serviceCategory.create({
        data,
      });
    } catch (error) {
      throw new Error(error);
    }
  }

  // Editar
  async updateServiceCategory(id: string, data: any) {
    try {
      return await this.prismaService.serviceCategory.update({
        where: { id },
        data: {
          ...data,
          updated_At: new Date(),
        },
      });
    } catch (error) {
      throw new Error(error);
    }
  }

  // Eliminar
  async deleteServiceCategory(id: string) {
    try {
      return await this.prismaService.serviceCategory.delete({
        where: { id },
      });
    } catch (error) {
      throw new Error(error);
    }
  }

  // Obtener todos
  async serviceCategories() {
    try {
      return await this.prismaService.serviceCategory.findMany();
    } catch (error) {
      throw new Error(error);
    }
  }

  // Obtener por ID
  async serviceCategory(id: string) {
    try {
      return await this.prismaService.serviceCategory.findUnique({
        where: { id },
      });
    } catch (error) {
      throw new Error(error);
    }
  }

  // SERVICE TYPE

  // Crear
  async createServiceType(data: any) {
    try {
      return await this.prismaService.serviceType.create({
        data,
      });
    } catch (error) {
      throw new Error(error);
    }
  }

  // Editar
  async updateServiceType(id: string, data: any) {
    try {
      return await this.prismaService.serviceType.update({
        where: { id },
        data: {
          ...data,
          updated_At: new Date(),
        },
      });
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  }

  // Eliminar
  async deleteServiceType(id: string) {
    try {
      return await this.prismaService.serviceType.delete({
        where: { id },
      });
    } catch (error) {
      throw new Error(error);
    }
  }

  // Obtener todos
  async serviceTypes() {
    try {
      return await this.prismaService.serviceType.findMany();
    } catch (error) {
      throw new Error(error);
    }
  }

  // Obtener por ID
  async serviceType(id: string) {
    try {
      return await this.prismaService.serviceType.findUnique({
        where: { id },
      });
    } catch (error) {
      throw new Error(error);
    }
  }

  // SERVICE

  // Crear
  async createService(data: any) {
    try {
      // const { en, es } = data;
      // const service = [en, es];
      const { en, es } = data;
      const serviceEn = JSON.parse(en);
      const serviceEs = JSON.parse(es);
      const service = [serviceEn, serviceEs];
      return await this.prismaService.service.create({
        data: {
          created_By: data.created_By,
          categoryId: data.categoryId,
          typeId: data.typeId,
          metadata: service,
        },
      });
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  }

  // Editar
  async updateService(id: string, data: any) {
    try {
      const oldService = await this.prismaService.service.findUnique({
        where: { id },
      });
      if (!oldService) throw new Error('Noticia no encontrada');
      const { en, es } = data;
      let service = undefined;
      if (en !== undefined && es !== undefined) {
        const serviceEn = JSON.parse(en);
        const serviceEs = JSON.parse(es);
        service = [serviceEn, serviceEs];
      }
      const newData = {
        metadata: service !== undefined ? service : oldService.metadata,
        image: data.image || oldService.image,
        updated_By: data.updated_By,
        updated_At: new Date(),
        status: data.status || oldService.status,
        categoryId: data.categoryId || oldService.categoryId,
      };
      return await this.prismaService.service.update({
        where: { id },
        data: newData,
      });
    } catch (error) {
      throw new Error(error);
    }
  }

  // Eliminar
  async deleteService(id: string) {
    try {
      return await this.prismaService.service.delete({
        where: { id },
      });
    } catch (error) {
      throw new Error(error);
    }
  }

  // Obtener todos
  async services() {
    try {
      const services = await this.prismaService.service.findMany({
        include: { category: true, type: true },
      });

      const data = services.map((service) => {
        const es = service.metadata
          .filter((m: any) => m.language === 'es')
          .flatMap((filteredNews: any) => ({
            ...filteredNews,
          }));

        const en = service.metadata
          .filter((m: any) => m.language === 'en')
          .flatMap((filteredNews: any) => ({
            ...filteredNews,
          }));
        return {
          id: service.id,
          categoryId: service.categoryId,
          typeId: service.typeId,
          image: service.image,
          es: es[0],
          en: en[0],
          created_At: service.created_At,
          updated_At: service.updated_At,
          created_By: service.created_By,
          updated_By: service.updated_By,
          category: service.category.name,
          typeEs: service.type.nameEs,
          typeEn: service.type.nameEn,
        };
      });

      return data;
    } catch (error) {
      throw new Error(error);
    }
  }

  // Obtener todos por idioma
  async servicesByLanguage(language: string) {
    try {
      const services = await this.prismaService.service.findMany({
        orderBy: { created_At: 'desc' },
        include: { category: true, type: true },
      });

      const servicesByLanguage = services.map((service) => {
        const { metadata } = service;
        const serviceByLanguage = metadata.find(
          (data: any) => data.language === language,
        );
        return {
          id: service.id,
          categoryId: service.categoryId,
          typeId: service.typeId,
          image: service.image,
          serviceByLanguage,
          created_At: service.created_At,
          updated_At: service.updated_At,
          category: service.category.name,
          typeEs: service.type.nameEs,
          typeEn: service.type.nameEn,
        };
      });
      return servicesByLanguage;
    } catch (error) {
      throw new Error(error);
    }
  }

  // Obtener por ID
  async service(id: string) {
    try {
      const service = await this.prismaService.service.findUnique({
        where: { id },
        include: { category: true, type: true },
      });
      const es = service.metadata
        .filter((m: any) => m.language === 'es')
        .flatMap((filteredNews: any) => ({
          ...filteredNews,
        }));

      const en = service.metadata
        .filter((m: any) => m.language === 'en')
        .flatMap((filteredNews: any) => ({
          ...filteredNews,
        }));
      const data = {
        id: service.id,
        categoryId: service.categoryId,
        typeId: service.typeId,
        image: service.image,
        es: es[0],
        en: en[0],
        created_At: service.created_At,
        updated_At: service.updated_At,
        category: service.category.name,
        typeEs: service.type.nameEs,
        typeEn: service.type.nameEn,
      };
      return data;
    } catch (error) {
      throw new Error(error);
    }
  }

  // Obtener por ID y idioma
  async serviceByLanguage(id: string, language: string) {
    try {
      const service = await this.prismaService.service.findUnique({
        where: { id },
        include: { category: true, type: true },
      });
      const { metadata } = service;
      const serviceByLanguage = metadata.find(
        (data: any) => data.language === language,
      );
      return {
        id: service.id,
        categoryId: service.categoryId,
        typeId: service.typeId,
        image: service.image,
        service: serviceByLanguage,
        created_At: service.created_At,
        updated_At: service.updated_At,
        category: service.category.name,
        typeEs: service.type.nameEs,
        typeEn: service.type.nameEn,
      };
    } catch (error) {
      throw new Error(error);
    }
  }

  // Obtener los servicios de la categoría: Inversion
  async servicesByCategory(category: string) {
    try {
      const services = await this.prismaService.service.findMany({
        include: { category: true, type: true },
      });

      const filteredServices = services.filter((service) =>
        service.category.name.toLowerCase().includes(category),
      );

      const servicesByCategory = filteredServices.map((service) => {
        if (service.category.name.toLowerCase().includes(category)) {
          const es = service.metadata
            .filter((m: any) => m.language === 'es')
            .flatMap((filteredNews: any) => ({
              ...filteredNews,
            }));

          const en = service.metadata
            .filter((m: any) => m.language === 'en')
            .flatMap((filteredNews: any) => ({
              ...filteredNews,
            }));
          return {
            id: service.id,
            categoryId: service.categoryId,
            typeId: service.typeId,
            image: service.image,
            es: es[0],
            en: en[0],
            created_At: service.created_At,
            updated_At: service.updated_At,
            category: service.category.name,
            typeEs: service.type.nameEs,
            typeEn: service.type.nameEn,
          };
        }
      });
      console.log(servicesByCategory);
      return servicesByCategory;
    } catch (error) {
      throw new Error(error);
    }
  }
}
