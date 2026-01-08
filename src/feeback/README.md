# Sistema de Notificaciones de Feedback

## Descripción

El servicio de feedback ahora envía correos electrónicos automáticos a los responsables cuando se recibe un nuevo feedback.

## Configuración

### 1. Configurar los correos de los responsables

Edita el archivo `src/feeback/feedback.config.ts` para configurar los correos:

```typescript
export const FEEDBACK_CONFIG = {
  // Correos de los responsables que recibirán notificaciones
  responsibleEmails: [
    'tu-correo1@prodominicana.gob.do',
    'tu-correo2@prodominicana.gob.do',
  ],
  
  // URL del panel de administración (opcional)
  dashboardUrl: 'https://prodominicana.gob.do/admin/feedback',
  
  // Configuración de envío
  sendEmailOnCreate: true,  // Enviar correo al crear feedback
  sendEmailOnApprove: false, // Opcional: enviar al aprobar
  sendEmailOnReject: false,  // Opcional: enviar al rechazar
};
```

### 2. Variables de entorno (opcional)

Puedes configurar la URL del dashboard mediante variables de entorno:

```env
ADMIN_DASHBOARD_URL=https://tudominio.com/admin/feedback
```

## Funcionamiento

### Cuando se crea un nuevo feedback:

1. El feedback se guarda en la base de datos
2. Se genera un código único de identificación
3. Se envía un correo a todos los responsables configurados con:
   - Nombre del remitente
   - Email de contacto
   - Mensaje del feedback
   - Calificación (si aplica)
   - Tipo de servicio (si aplica)
   - Enlace al panel de administración

### Contenido del correo

El correo incluye:
- ✅ Código de feedback único
- ✅ Información del remitente
- ✅ Calificación con estrellas (si existe)
- ✅ Tipo de servicio (si existe)
- ✅ Mensaje completo
- ✅ Fecha y hora de recepción
- ✅ Botón de acceso directo al panel

## Template de correo

El template HTML se encuentra en: `src/mail/templates/newFeedback.hbs`

Puedes personalizarlo según las necesidades de tu organización.

## Manejo de errores

Si el envío de correo falla, el sistema:
- ✅ Registra el error en los logs
- ✅ NO afecta la creación del feedback
- ✅ El feedback se guarda correctamente aunque el correo falle

## Características adicionales

### Envío en paralelo
Los correos se envían en paralelo a todos los responsables para mayor eficiencia.

### Personalización
Puedes extender la funcionalidad para:
- Enviar correos al aprobar/rechazar feedback
- Notificar al usuario cuando su feedback sea procesado
- Agregar más información al template

## Próximos pasos

Para implementar notificaciones adicionales, puedes:

1. **Notificar al usuario sobre aprobación/rechazo:**
   - Crear template `feedbackApproved.hbs` y `feedbackRejected.hbs`
   - Agregar método en `mail.service.ts`
   - Llamar desde `approve()` y `reject()` en `feedback.service.ts`

2. **Configurar por tipo de servicio:**
   - Definir responsables diferentes según el tipo de servicio
   - Modificar `FEEDBACK_CONFIG` para incluir mapeo

3. **Estadísticas por correo:**
   - Enviar resúmenes diarios/semanales de feedbacks pendientes
