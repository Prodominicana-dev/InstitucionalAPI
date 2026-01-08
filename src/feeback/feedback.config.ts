// Configuración de correos electrónicos para notificaciones de feedback

/**
 * SISTEMA DE RESPONSABLES:
 * Los responsables se obtienen de Auth0 mediante permisos/etiquetas:
 * 
 * - manage:feedback - Responsables generales (reciben todos los feedbacks)
 * - manage:feedback-all - Responsables que reciben TODOS los tipos
 * - manage:feedback-investment - Solo feedbacks de inversión
 * - manage:feedback-export - Solo feedbacks de exportación
 * 
 * Se gestionan desde Auth0, no manualmente.
 */

/**
 * Variables de Entorno - Solo como FALLBACK
 * Si falla la consulta a Auth0, se usan estos correos
 */
const getEmailsFromEnv = (): string[] => {
  const envEmails = process.env.FEEDBACK_EMAILS;
  if (envEmails) {
    return envEmails.split(',').map(email => email.trim()).filter(email => email);
  }
  return [];
};

/**
 * Fallback final si Auth0 y ENV fallan
 */
const fallbackEmails = [
  'atencion.ciudadano@prodominicana.gob.do',
];

export const FEEDBACK_CONFIG = {
  /**
   * Correos de fallback (solo si falla Auth0)
   */
  get responsibleEmails(): string[] {
    const envEmails = getEmailsFromEnv();
    return envEmails.length > 0 ? envEmails : fallbackEmails;
  },
  
  // URL del panel de administración
  dashboardUrl: process.env.ADMIN_DASHBOARD_URL || 'https://prodominicana.gob.do/admin/feedback',
  
  // Configuración de envío
  sendEmailOnCreate: process.env.FEEDBACK_SEND_ON_CREATE !== 'false', // true por defecto
  sendEmailOnApprove: process.env.FEEDBACK_SEND_ON_APPROVE === 'true', // false por defecto
  sendEmailOnReject: process.env.FEEDBACK_SEND_ON_REJECT === 'true', // false por defecto
  
  // Usar Auth0 para obtener responsables (true por defecto)
  useAuth0: process.env.FEEDBACK_USE_AUTH0 !== 'false',
  
  // Habilitar notificaciones por tipo de servicio
  useServiceTypeEmails: process.env.FEEDBACK_USE_SERVICE_TYPE_EMAILS !== 'false', // true por defecto
};


