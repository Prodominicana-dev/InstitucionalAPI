import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MailerService } from '@nestjs-modules/mailer';
import { EconomicIndicatorService } from './economic-indicator.service';

const FROM = 'Proeconomía <no-reply@prodominicana.gob.do>';

/* Destinatarios del aviso, separados por coma en el .env:
   INDICATORS_ALERT_EMAILS=fulano@prodominicana.gob.do,mengana@prodominicana.gob.do
   Sin la variable no se envia nada: solo queda registrado en el log. */
function destinatarios(): string[] {
  return (process.env.INDICATORS_ALERT_EMAILS ?? '')
    .split(',')
    .map((c) => c.trim())
    .filter(Boolean);
}

@Injectable()
export class IndicatorAlertService {
  private readonly logger = new Logger(IndicatorAlertService.name);

  constructor(
    private readonly indicadores: EconomicIndicatorService,
    private readonly mailerService: MailerService,
  ) {}

  /* Una vez al dia. Si algun indicador paso su vigencia, avisa a quien
     corresponda: la pagina ya dejo de mostrar esa cifra. */
  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async avisarVencidos(): Promise<void> {
    const vencidos = await this.indicadores.findStale();
    if (vencidos.length === 0) return;

    const lista = vencidos
      .map((i) => {
        const fecha = i.updated_At
          ? i.updated_At.toLocaleDateString('es-DO')
          : 'nunca';
        return `${i.label}: actualizado ${fecha}`;
      })
      .join(' · ');
    this.logger.warn(`Indicadores vencidos -> ${lista}`);

    const para = destinatarios();
    if (para.length === 0) {
      this.logger.warn(
        'INDICATORS_ALERT_EMAILS sin configurar: no se envia el aviso.',
      );
      return;
    }

    const filas = vencidos
      .map((i) => {
        const fecha = i.updated_At
          ? i.updated_At.toLocaleDateString('es-DO')
          : 'nunca se ha cargado';
        return `<li><strong>${i.label}</strong> — última actualización: ${fecha}</li>`;
      })
      .join('');

    try {
      await this.mailerService.sendMail({
        from: FROM,
        to: para,
        subject: `Indicadores desactualizados en el Radar Económico (${vencidos.length})`,
        html:
          `<p>Los siguientes indicadores pasaron su vigencia y <strong>ya no se ` +
          `muestran</strong> en el portal:</p><ul>${filas}</ul>` +
          `<p>Actualícelos en el panel, en Novedades → Proeconomía → Indicadores.</p>`,
      });
    } catch (error) {
      this.logger.error(`No se pudo enviar el aviso: ${error.message}`);
    }
  }
}
