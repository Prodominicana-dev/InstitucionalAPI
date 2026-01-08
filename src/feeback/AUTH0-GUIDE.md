# 🔐 Guía de Configuración Auth0 - Responsables de Feedback

## 📋 Sistema Implementado

El sistema de notificaciones de feedback ahora obtiene automáticamente los responsables desde **Auth0** mediante permisos/etiquetas asignados a usuarios admin.

## 🎯 Permisos Disponibles

### Permisos Generales:
- **`manage:feedback`** - Responsables generales que reciben TODOS los feedbacks
- **`manage:feedback-all`** - Alternativa a manage:feedback (también recibe todos)

### Permisos por Tipo de Servicio:
- **`manage:feedback-investment`** - Solo feedbacks de tipo "investment" (inversión)
- **`manage:feedback-export`** - Solo feedbacks de tipo "export" (exportación)
- **`manage:feedback-general`** - Solo feedbacks de tipo "general"

## 📝 Cómo Funciona

### Ejemplo de Flujo:

1. Usuario envía feedback tipo "investment"
2. Sistema consulta Auth0 para obtener usuarios con:
   - `manage:feedback-investment` (específico)
   - `manage:feedback-all` (generales)
3. Sistema extrae los emails de esos usuarios
4. Envía notificación por correo a todos

### Combinación de Permisos:

Un administrador puede tener **múltiples permisos**:
```
Usuario: juan.perez@prodominicana.gob.do
Permisos:
  - manage:feedback-investment
  - manage:feedback-export
```
Este usuario recibirá notificaciones de feedbacks de inversión Y exportación.

## 🔧 Configurar en Auth0

### 1. Crear los Permisos en Auth0 API

En tu Auth0 Dashboard:

1. Ve a **Applications** → **APIs**
2. Selecciona tu API (la configurada en `API_IDENTIFIER`)
3. Ve a la pestaña **Permissions**
4. Agrega los siguientes permisos:

```
Permission              Description
---------------------------------------------------
manage:feedback         Gestionar feedback general
manage:feedback-all     Recibir todos los feedbacks
manage:feedback-investment   Gestionar feedback de inversión
manage:feedback-export      Gestionar feedback de exportación
manage:feedback-general     Gestionar feedback general
```

### 2. Asignar Permisos a Usuarios

#### Opción A: Mediante Roles (Recomendado)

1. Ve a **User Management** → **Roles**
2. Crea roles como:
   - `Feedback Manager` → permisos: `manage:feedback-all`
   - `Investment Manager` → permisos: `manage:feedback-investment`
   - `Export Manager` → permisos: `manage:feedback-export`

3. Asigna usuarios a estos roles:
   - Ve al usuario
   - Tab **Roles**
   - Asigna el rol apropiado

#### Opción B: Permisos Directos

1. Ve a **User Management** → **Users**
2. Selecciona el usuario
3. Tab **Permissions**
4. Agrega los permisos necesarios

### 3. Verificar Configuración

Usa el endpoint de consulta:

```bash
# Ver todos los usuarios con permisos de feedback
GET http://localhost:3000/feedback-responsible

# Ver emails que recibirán notificaciones generales
GET http://localhost:3000/feedback-responsible/emails/general

# Ver emails para tipo específico
GET http://localhost:3000/feedback-responsible/emails/investment
```

## ⚙️ Variables de Entorno

Asegúrate de tener configuradas:

```env
# Auth0 API Configuration
AUTH0_ISSUER_BASE_URL=https://tu-tenant.auth0.com
API_CLIENT_ID=tu-client-id
API_CLIENT_SECRET=tu-client-secret
API_IDENTIFIER=https://tu-api-identifier/

# Feedback Configuration
FEEDBACK_USE_AUTH0=true
FEEDBACK_USE_SERVICE_TYPE_EMAILS=true
FEEDBACK_SEND_ON_CREATE=true

# Fallback (solo si falla Auth0)
FEEDBACK_EMAILS=fallback@prodominicana.gob.do
```

## 📊 Ejemplos de Configuración

### Escenario 1: Director General (recibe todo)

```
Usuario: director@prodominicana.gob.do
Permisos: manage:feedback-all
Resultado: Recibe TODOS los feedbacks
```

### Escenario 2: Especialistas por Área

```
Usuario A: inversiones@prodominicana.gob.do
Permisos: manage:feedback-investment
Resultado: Solo feedbacks de inversión

Usuario B: exportaciones@prodominicana.gob.do
Permisos: manage:feedback-export
Resultado: Solo feedbacks de exportación
```

### Escenario 3: Equipo de Atención

```
Usuario: atencion1@prodominicana.gob.do
Permisos: manage:feedback

Usuario: atencion2@prodominicana.gob.do
Permisos: manage:feedback

Resultado: Ambos reciben TODOS los feedbacks
```

## 🔍 Troubleshooting

### No se envían correos

**Verificar:**
1. ¿Los usuarios tienen los permisos correctos en Auth0?
2. ¿Los usuarios tienen email válido?
3. ¿La variable `FEEDBACK_USE_AUTH0=true`?
4. ¿El token de Auth0 se genera correctamente?

**Revisar logs:**
```
"No se encontraron responsables en Auth0, usando fallback"
```

### Correos duplicados

**Causa:** Un usuario tiene múltiples permisos que coinciden.

**Solución:** El sistema automáticamente deduplica emails, no deberías ver duplicados.

### Cambios no se reflejan

**Causa:** Cache o token expirado.

**Solución:** 
- Auth0 se consulta en cada feedback (sin cache)
- Los cambios son inmediatos
- Verifica que el usuario realmente tenga el permiso en Auth0

## 📡 API Endpoints

```http
# Consultar responsables
GET /feedback-responsible
Response: Lista de usuarios con sus permisos

# Consultar por tipo
GET /feedback-responsible/emails/:serviceType
Response: Lista de emails para ese tipo

# Ver usuario específico
GET /feedback-responsible/:userId
Response: Información del usuario de Auth0
```

## ✅ Ventajas de Auth0

✅ **Centralizado**: Gestión única de usuarios y permisos
✅ **Sin duplicación**: No hay que mantener datos en dos lugares
✅ **Seguro**: Auth0 maneja autenticación y autorización
✅ **Flexible**: Cambios inmediatos sin reiniciar servidor
✅ **Auditable**: Auth0 tiene logs de todos los cambios
✅ **Escalable**: Agregar/quitar responsables es instantáneo

## 🎯 Testing

### Crear usuario de prueba:

1. En Auth0, crea un usuario de prueba
2. Asigna permiso `manage:feedback`
3. Crear un feedback:

```bash
curl -X POST http://localhost:3000/feedback \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "message": "Mensaje de prueba",
    "rating": 5,
    "serviceType": "investment"
  }'
```

4. Verificar que el correo llegó al usuario de prueba

## 🚀 Próximos Pasos

1. Configurar los permisos en Auth0
2. Asignar usuarios a los roles/permisos
3. Probar con un feedback de prueba
4. Monitorear logs para verificar funcionamiento
5. Opcional: Agregar permisos adicionales para tipos nuevos

---

## 📚 Referencias

- [Auth0 Permissions](https://auth0.com/docs/manage-users/access-control/configure-core-rbac/rbac-permissions)
- [Auth0 Roles](https://auth0.com/docs/manage-users/access-control/configure-core-rbac/rbac-roles)
- [Auth0 Management API](https://auth0.com/docs/api/management/v2)
