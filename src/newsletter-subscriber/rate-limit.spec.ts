/// <reference types="jest" />
import { clientIp } from './rate-limit';

describe('clientIp', () => {
  it('prefiere CF-Connecting-IP, que es la que escribe Cloudflare', () => {
    const ip = clientIp({
      headers: { 'cf-connecting-ip': '200.1.2.3', 'x-forwarded-for': '9.9.9.9' },
      ip: '127.0.0.1',
    });
    expect(ip).toBe('200.1.2.3');
  });

  it('sin Cloudflare usa el primero de X-Forwarded-For', () => {
    const ip = clientIp({
      headers: { 'x-forwarded-for': '200.1.2.3, 10.0.0.1' },
      ip: '127.0.0.1',
    });
    expect(ip).toBe('200.1.2.3');
  });

  it('sin cabeceras de proxy cae en req.ip', () => {
    expect(clientIp({ headers: {}, ip: '127.0.0.1' })).toBe('127.0.0.1');
  });
});
