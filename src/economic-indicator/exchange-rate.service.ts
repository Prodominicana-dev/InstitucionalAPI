import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EconomicIndicatorService } from './economic-indicator.service';

/* Dolar y euro, tomados del Banco Central.

   OJO: nada de esto es una API publicada. Son la portada del sitio y lo que
   usa por dentro su pagina de tasas convertibles. Dos consecuencias:

   1. El dia que rediseñen cualquiera de las dos, esto deja de traer datos sin
      avisar. Por eso aqui nunca se borra el valor anterior: si falla, se
      registra y ya esta. El indicador se marcara solo como desactualizado
      cuando pase su vigencia, que es el comportamiento que se quiere.
   2. El Banco Central publica una vez al dia en dia laborable y con uno o dos
      dias de retraso, asi que el dato de hoy puede ser el del viernes.

   Por que el dolar se lee de la PORTADA y no de su endpoint:
   GetActualExchangeRate responde 200 con el cuerpo VACIO cuando se le llama
   desde Node, y responde bien al mismo tiempo desde curl. Se probaron
   cookies, content-type, user-agent, x-requested-with, referer,
   accept-encoding, HTTP/1.1 y HTTP/2, conexion sin keep-alive, node:https en
   vez de fetch y las dos paginas del sitio: ninguna lo cambia. La portada SI
   se lee desde Node y trae las dos cifras que hacen falta. */

const PORTADA = 'https://www.bancentral.gov.do/';
/* El euro no esta en la portada: vive en la serie de "tasas convertibles", la
   que alimenta su pagina de historico. Se pide una ventana de dias y se toma
   el ultimo publicado.
   OJO: SortOrder no se aplica, la respuesta siempre viene ascendente. */
const ENDPOINT_CONVERTIBLES =
  'https://www.bancentral.gov.do/Home/GetAllConvertibleExchangeRates';
const MONEDA_EURO = 8; // el codigo lo da POST /Home/GetExchangeCurrencies
const DIAS_VENTANA = 15;
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

  /* Cada 4 horas. Repetir no molesta y sirve de reintento si una vez falla. */
  @Cron(CronExpression.EVERY_4_HOURS)
  async actualizar(): Promise<void> {
    await this.actualizarDolar();
    await this.actualizarEuro();
  }

  /* El dolar se publica con sus dos cifras, porque significan cosas distintas:
     la venta es lo que paga quien compra dolares. */
  private async actualizarDolar(): Promise<void> {
    const tasas = await this.dolarDelDia();
    if (!tasas) return;

    const value = `${tasas.compra.toFixed(2)} / ${tasas.venta.toFixed(2)}`;
    await this.indicadores.updateByKey('usd', {
      value,
      note: 'Compra / Venta',
      noteEn: 'Buy / Sell',
      updated_By: 'Banco Central',
    });
    this.logger.log(`Dolar actualizado: ${value}`);
  }

  private async actualizarEuro(): Promise<void> {
    const tasa = await this.euroDelDia();
    if (tasa === null) return;

    await this.indicadores.updateByKey('eur', {
      value: tasa.toFixed(2),
      updated_By: 'Banco Central',
    });
    this.logger.log(`Euro actualizado: ${tasa.toFixed(2)}`);
  }

  /* Compra y venta del dia, de la tabla de la portada, o null. */
  private async dolarDelDia(): Promise<{
    compra: number;
    venta: number;
  } | null> {
    try {
      const res = await fetch(PORTADA, {
        headers: { 'user-agent': NAVEGADOR },
        signal: AbortSignal.timeout(ESPERA_MS),
      });
      const html = await res.text();
      if (!res.ok || html.trim() === '') {
        this.logger.warn(
          `La portada respondio ${res.status} con ${html.length} bytes`,
        );
        return null;
      }

      const compra = this.cifraRotulada(html, 'Compra');
      const venta = this.cifraRotulada(html, 'Venta');
      if (compra === null || venta === null) {
        this.logger.warn('La portada no trae compra y venta reconocibles');
        return null;
      }
      return { compra, venta };
    } catch (error) {
      this.logger.warn(`No se pudo leer el dolar: ${error.message}`);
      return null;
    }
  }

  /* En la portada cada cifra va rotulada: <small>Compra</small><h5>61.1168</h5> */
  private cifraRotulada(html: string, rotulo: string): number | null {
    const patron = new RegExp(
      `<small>\\s*${rotulo}\\s*</small>\\s*<h5>\\s*([\\d.,]+)\\s*</h5>`,
      'i',
    );
    const crudo = patron.exec(html)?.[1];
    if (!crudo) return null;
    const valor = Number(crudo.replace(/,/g, ''));
    return Number.isFinite(valor) && valor > 0 ? valor : null;
  }

  /* Ultimo euro publicado dentro de la ventana, o null. */
  private async euroDelDia(): Promise<number | null> {
    const hasta = new Date();
    const desde = new Date(hasta.getTime() - DIAS_VENTANA * 86400 * 1000);
    try {
      const res = await fetch(ENDPOINT_CONVERTIBLES, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-requested-with': 'XMLHttpRequest',
          'user-agent': NAVEGADOR,
        },
        body: JSON.stringify({
          FilterFrequency: 'Diario',
          FilterCurrencies: [MONEDA_EURO],
          FromDate: desde.toISOString().slice(0, 10),
          ToDate: hasta.toISOString().slice(0, 10),
          SortBy: 'ExchangeRateDate',
          SortOrder: 'desc',
        }),
        signal: AbortSignal.timeout(ESPERA_MS),
      });

      const texto = await res.text();
      if (!res.ok || texto.trim() === '') {
        this.logger.warn(
          `Las tasas convertibles respondieron ${res.status} con ${texto.length} bytes`,
        );
        return null;
      }

      const items = JSON.parse(texto)?.result?.items;
      if (!Array.isArray(items) || items.length === 0) {
        this.logger.warn('Sin euro publicado en la ventana consultada');
        return null;
      }

      const ultimo = items
        .filter((i) => typeof i?.value === 'number' && i.value > 0)
        .sort((a, b) =>
          String(a.exchangeRateDate).localeCompare(String(b.exchangeRateDate)),
        )
        .pop();
      if (!ultimo) {
        this.logger.warn('Respuesta sin un euro utilizable');
        return null;
      }
      return ultimo.value;
    } catch (error) {
      this.logger.warn(`No se pudo leer el euro: ${error.message}`);
      return null;
    }
  }
}
