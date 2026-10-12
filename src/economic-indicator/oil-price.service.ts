import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EconomicIndicatorService } from './economic-indicator.service';

/* Precio del petroleo WTI, tomado del grafico publico de Yahoo Finance.

   Como en el caso del Banco Central, esto NO es una API con contrato: es el
   mismo endpoint que alimenta sus graficos. Dos cosas medidas:

   1. Sin 'user-agent' de navegador responde 429 (demasiadas peticiones).
   2. Si falla, aqui no se borra el valor anterior. El indicador se marcara
      solo como desactualizado al pasar su vigencia. */

const ENDPOINT =
  'https://query1.finance.yahoo.com/v8/finance/chart/CL=F?interval=1d&range=1d';
const NAVEGADOR =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
const ESPERA_MS = 15000;

@Injectable()
export class OilPriceService implements OnApplicationBootstrap {
  private readonly logger = new Logger(OilPriceService.name);

  constructor(private readonly indicadores: EconomicIndicatorService) {}

  onApplicationBootstrap(): void {
    void this.actualizar();
  }

  @Cron(CronExpression.EVERY_4_HOURS)
  async actualizar(): Promise<void> {
    const precio = await this.precioDelDia();
    if (precio === null) return;

    await this.indicadores.updateByKey('oil', {
      value: precio.toFixed(2),
      updated_By: 'Yahoo Finance',
    });
    this.logger.log(`Petroleo actualizado: ${precio.toFixed(2)}`);
  }

  /* Ultimo precio de mercado en USD por barril, o null. */
  private async precioDelDia(): Promise<number | null> {
    try {
      const res = await fetch(ENDPOINT, {
        headers: { 'user-agent': NAVEGADOR },
        signal: AbortSignal.timeout(ESPERA_MS),
      });

      const texto = await res.text();
      if (!res.ok || texto.trim() === '') {
        this.logger.warn(
          `Yahoo respondio ${res.status} con ${texto.length} bytes`,
        );
        return null;
      }

      const meta = JSON.parse(texto)?.chart?.result?.[0]?.meta;
      const precio = meta?.regularMarketPrice;
      if (
        typeof precio !== 'number' ||
        !Number.isFinite(precio) ||
        precio <= 0
      ) {
        this.logger.warn('Respuesta sin un precio utilizable');
        return null;
      }
      return precio;
    } catch (error) {
      this.logger.warn(`No se pudo leer el petroleo: ${error.message}`);
      return null;
    }
  }
}
