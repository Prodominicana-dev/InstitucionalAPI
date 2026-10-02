import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { EconomicIndicator } from '@prisma/client';

/* Indicador con su vigencia ya resuelta, para que el front no tenga que
   calcularla ni decidir si la cifra todavia vale. */
export type IndicadorConVigencia = EconomicIndicator & {
  expiresAt: Date | null;
  stale: boolean;
};

const HORAS_POR_DEFECTO = 24;

@Injectable()
export class EconomicIndicatorService {
  constructor(private readonly prismaService: PrismaService) {}

  /* Un indicador sin fecha de actualizacion se da por vencido: nunca se
     cargo, asi que no hay nada que publicar. */
  private conVigencia(i: EconomicIndicator): IndicadorConVigencia {
    const horas = i.maxAgeHours ?? HORAS_POR_DEFECTO;
    if (!i.updated_At) {
      return { ...i, expiresAt: null, stale: true };
    }
    const expiresAt = new Date(i.updated_At.getTime() + horas * 3600 * 1000);
    return { ...i, expiresAt, stale: expiresAt.getTime() < Date.now() };
  }

  // Obtener los 4 indicadores ordenados por campo order
  async findAll(): Promise<IndicadorConVigencia[]> {
    const items = await this.prismaService.economicIndicator.findMany({
      orderBy: { order: 'asc' },
    });
    return items.map((i) => this.conVigencia(i));
  }

  /* Los que llevan mas de la cuenta sin actualizarse. Lo usa el aviso. */
  async findStale(): Promise<IndicadorConVigencia[]> {
    return (await this.findAll()).filter((i) => i.stale);
  }

  // Actualizar un indicador por su key (usd | eur | oil | freight)
  async updateByKey(
    key: string,
    data: Partial<{
      value: string;
      label: string;
      labelEn: string;
      note: string;
      noteEn: string;
      maxAgeHours: number;
      updated_By: string;
    }>,
  ): Promise<IndicadorConVigencia> {
    const item = await this.prismaService.economicIndicator.update({
      where: { key },
      data: { ...data, updated_At: new Date() },
    });
    return this.conVigencia(item);
  }
}
