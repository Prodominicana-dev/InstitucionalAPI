/* Tope de altas por IP: sin el, un bot puede registrar correos en masa y cada
   alta dispara un correo de bienvenida desde el relay institucional.

   La IP real viene en CF-Connecting-IP. El sitio esta detras de Cloudflare y
   luego nginx, asi que req.ip es la del proxy (127.0.0.1) para todo el trafico
   publico. Cloudflare reescribe esa cabecera en cada peticion, asi que el
   cliente no la puede falsear mientras el trafico entre por Cloudflare.

   El contador vive en memoria porque ecosystem.config.js arranca una sola
   instancia de pm2 (instances: 1). Con varias instancias haria falta Redis. */

const VENTANA_MS = 60 * 60 * 1000;
const MAX_POR_IP = 5;

export function clientIp(req: {
  headers: Record<string, any>;
  ip?: string;
}): string | undefined {
  const cf = req.headers['cf-connecting-ip'];
  if (typeof cf === 'string' && cf) return cf;

  const xff = req.headers['x-forwarded-for'];
  if (typeof xff === 'string' && xff) return xff.split(',')[0].trim();

  return req.ip;
}

export class RateLimitAltas {
  private readonly intentos = new Map<string, number[]>();

  /* Cuenta el intento y devuelve true si esa IP ya gastó su cupo */
  excedido(ip: string): boolean {
    const ahora = Date.now();
    const recientes = (this.intentos.get(ip) ?? []).filter(
      (t) => ahora - t < VENTANA_MS,
    );
    this.intentos.set(ip, recientes);

    if (recientes.length >= MAX_POR_IP) return true;

    recientes.push(ahora);
    this.purgar(ahora);
    return false;
  }

  /* Evita que el Map crezca con IPs que no vuelven */
  private purgar(ahora: number): void {
    for (const [ip, tiempos] of this.intentos) {
      if (tiempos.every((t) => ahora - t >= VENTANA_MS)) this.intentos.delete(ip);
    }
  }
}
