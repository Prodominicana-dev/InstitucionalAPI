import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EconomicIndicatorService } from './economic-indicator.service';

/* Tasa del dolar, tomada del Banco Central.

   OJO: esto NO es una API publicada. Es lo que usa por dentro su pagina de
   tasas de cambio. Dos consecuencias que hay que tener presentes:

   1. Hay que pedir primero la pagina para que entregue sus cookies de sesion.
      Sin ellas el POST responde 200 con el cuerpo VACIO, que despista mucho.
   2. El dia que rediseñen esa pagina, esto deja de traer datos sin avisar.
      Por eso aqui nunca se borra el valor anterior: si falla, se registra y
      ya esta. El indicador se marcara solo como desactualizado cuando pase
      su vigencia, que es justo el comportamiento que se quiere.

   Solo el dolar. El euro no sale por esta via y se sigue cargando a mano. */

const PAGINA = 'https://www.bancentral.gov.do/SectorExterno/HistoricoTasas';
const ENDPOINT = 'https://www.bancentral.gov.do/Home/GetActualExchangeRate';
const NAVEGADOR =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
const ESPERA_MS = 15000;

@Injectable()
export class ExchangeRateService implements OnApplicationBootstrap {
  private readonly logger = new Logger(ExchangeRateService.name);

  constructor(private readonly indicadores: EconomicIndicatorService) {}

  /* Al arrancar, para no esperar al primer disparo del cron tras un despliegue.
     No se espera el resultado: si el Banco Central tarda, que no retrase el
     arranque de la API. */
  onApplicationBootstrap(): void {
    void this.actualizar();
  }

  /* Cada 4 horas. El Banco Central publica una vez al dia en dia laborable,
     asi que repetir no molesta y sirve de reintento si una vez falla. */
  @Cron(CronExpression.EVERY_4_HOURS)
  async actualizar(): Promise<void> {
    const tasa = await this.tasaDelDia();
    if (tasa === null) return;

    await this.indicadores.updateByKey('usd', {
      value: tasa.toFixed(2),
      updated_By: 'Banco Central',
    });
    this.logger.log(`Dolar actualizado: ${tasa.toFixed(2)}`);
  }

  /* Devuelve la tasa de VENTA del dia, o null si no se pudo obtener. */
  private async tasaDelDia(): Promise<number | null> {
    try {
      const cookies = await this.cookiesDeSesion();
      if (!cookies) return null;

      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
          'x-requested-with': 'XMLHttpRequest',
          'user-agent': NAVEGADOR,
          referer: PAGINA,
          cookie: cookies,
        },
        body: '',
        signal: AbortSignal.timeout(ESPERA_MS),
      });

      const texto = await res.text();
      if (!res.ok || texto.trim() === '') {
        this.logger.warn(
          `El Banco Central respondio ${res.status} con ${texto.length} bytes`,
        );
        return null;
      }

      const valor = JSON.parse(texto)?.result?.actualSellingValue;
      if (typeof valor !== 'number' || !Number.isFinite(valor) || valor <= 0) {
        this.logger.warn('Respuesta sin una tasa de venta utilizable');
        return null;
      }
      return valor;
    } catch (error) {
      this.logger.warn(`No se pudo leer la tasa: ${error.message}`);
      return null;
    }
  }

  /* La pagina de tasas entrega las cookies que el endpoint exige despues. */
  private async cookiesDeSesion(): Promise<string | null> {
    const res = await fetch(PAGINA, {
      headers: { 'user-agent': NAVEGADOR },
      signal: AbortSignal.timeout(ESPERA_MS),
    });
    const crudas = res.headers.getSetCookie?.() ?? [];
    const cookies = crudas
      .map((c) => c.split(';')[0])
      .filter(Boolean)
      .join('; ');
    if (!cookies) {
      this.logger.warn('La pagina de tasas no devolvio cookies');
      return null;
    }
    return cookies;
  }
}
