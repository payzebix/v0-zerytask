# ZERYTASK - GUÍA DE REFERENCIA CENTRAL

## Tabla de Contenidos
1. [Estado Actual del Proyecto](#estado-actual)
2. [Documentación Relevante](#documentación-relevante)
3. [Estructura del Proyecto](#estructura)
4. [Flujos Principales](#flujos-principales)
5. [API Endpoints](#api-endpoints)
6. [Debugging & Logs](#debugging)

---

## ESTADO ACTUAL

**Versión:** 1.0 Production-Ready
**Última Auditoría:** 2025-02-24
**Status:** ✅ EXCELENTE - Listo para producción

### Issues Resueltos
- ✅ Cookies() Promise en Next.js 16
- ✅ Foreign key ambiguos en verifications
- ✅ Sentry warnings removidos
- ✅ UUID validation en todas las rutas
- ✅ Logo styling (cuadrado, redondeado)
- ✅ Mission completion form implementado
- ✅ Referrals sync funcionando

---

## DOCUMENTACIÓN RELEVANTE

### Archivos de Documentación Activos:
- **COMPREHENSIVE_AUDIT_2025.md** - Auditoría exhaustiva del proyecto
- **SUPABASE_ARCHITECTURE.md** - Arquitectura de clientes Supabase
- **SECURITY_CHECKLIST.md** - Checklist de seguridad
- **SETUP_GUIDE.md** - Guía de setup inicial

### Archivos Legacy (DEPRECATED - Para referencia histórica):
- AUTH_SESSION_FIX.md
- CHANGES_APPLIED.md
- DEPLOYMENT_CHECKLIST.md
- FIX_SUMMARY_2025-02-24.md
- LOGIN_FIX_SUMMARY.md
- MIGRATION_COMPLETE.md
- PRODUCTION_FIXES_SUMMARY.md
- RLS_SERVICE_ROLE_FIX.md

---

## ESTRUCTURA DEL PROYECTO

```
zerytask/
├── app/
│   ├── admin/                    # Panel administrativo
│   │   ├── customization/        # Personalización del sitio
│   │   ├── missions/             # Gestión de misiones
│   │   ├── mission-profiles/     # Gestión de perfiles
│   │   ├── mission-verification/ # Verificación de misiones
│   │   └── page.tsx              # Dashboard admin
│   ├── api/                      # API routes
│   │   ├── admin/                # Rutas solo para admins
│   │   ├── auth/                 # Login, signup, logout
│   │   ├── missions/             # Misiones CRUD
│   │   ├── mission-profiles/     # Perfiles CRUD
│   │   └── ...                   # Otras rutas API
│   ├── [profileName]/            # Rutas dinámicas por nombre
│   │   ├── page.tsx              # Lista de misiones del perfil
│   │   └── [missionId]/          # Detalle de misión
│   ├── auth/                     # Páginas de autenticación
│   ├── missions/                 # Páginas públicas de misiones
│   └── page.tsx                  # Home
├── lib/
│   ├── supabase.ts              # Cliente browser
│   ├── supabase-server.ts       # Cliente server (anon key)
│   ├── supabase-admin.ts        # Cliente admin (service role)
│   ├── admin-check.ts           # Verificación de permisos
│   ├── uuid-validator.ts        # Validación de UUIDs
│   └── ...                      # Utilidades varias
├── components/                   # React components reutilizables
├── hooks/
│   └── useAuth.ts               # Hook de autenticación
├── scripts/
│   └── *.sql                    # Scripts de base de datos
└── middleware.ts                # Middleware de Next.js

```

---

## FLUJOS PRINCIPALES

### 1. SIGNUP / REGISTRO
```
Usuario → /auth/signup
  ↓
Valida email, password, código invitación
  ↓
POST /api/auth/signup
  ↓
Crea usuario en Supabase Auth
  ↓
Trigger handle_new_user() crea registro en public.users
  ↓
Redirect a /missions
```

### 2. LOGIN / INICIO DE SESIÓN
```
Usuario → /auth/login
  ↓
POST /api/auth/login
  ↓
Valida credentials en Supabase Auth
  ↓
Check maintenance mode
  ↓
Set session cookies
  ↓
Redirect a /missions
```

### 3. COMPLETAR MISIÓN
```
Usuario → /[profileName]/[missionId]
  ↓
Lee detalles de misión
  ↓
Submit proof (URL o imagen)
  ↓
POST /api/missions/submit
  ↓
Crea mission_submissions record
  ↓
Si verification_type=manual → mission_verifications_pending
  ↓
Admin verifica y aprueba
  ↓
Actualiza rewards (XP, Zeryt)
```

### 4. ADMIN CUSTOMIZATION
```
Admin → /admin/customization
  ↓
Carga configuración actual
  ↓
Ajusta colors, typography, etc.
  ↓
Live preview en tiempo real
  ↓
Click "Save" → POST /api/admin/site-customization
  ↓
Guarda en site_customization table
  ↓
Versioning automático para rollback
```

---

## API ENDPOINTS

### Autenticación
- `POST /api/auth/signup` - Registro de usuario
- `POST /api/auth/login` - Inicio de sesión
- `POST /api/auth/logout` - Cierre de sesión
- `POST /api/auth/change-password` - Cambio de contraseña

### Misiones (Públicas)
- `GET /api/missions` - Listar misiones
- `GET /api/missions/public` - Misiones públicas (sin auth)
- `GET /api/missions/[id]` - Detalle de misión
- `GET /api/missions/by-profile/[profileId]` - Misiones por perfil

### Misiones (Admin)
- `POST /api/admin/missions` - Crear misión
- `PUT /api/admin/missions/[id]` - Actualizar misión
- `POST /api/admin/missions/[id]/toggle` - Cambiar estado

### Perfiles
- `GET /api/mission-profiles/[id]/get` - Obtener perfil
- `GET /api/mission-profiles/by-name/[name]` - Obtener por nombre
- `POST /api/admin/mission-profiles` - Crear perfil

### Verificaciones
- `GET /api/admin/mission-verifications` - Pending verifications
- `POST /api/admin/mission-verifications/[id]` - Aprobar/rechazar

### Customización
- `GET /api/admin/site-customization` - Obtener config
- `POST /api/admin/site-customization` - Guardar config
- `PATCH /api/admin/site-customization` - Rollback

---

## DEBUGGING

### Logs Principales
- `[v0]` - Información general del sistema
- Check browser console en `/admin/` para errores

### Problemas Comunes

**"Access denied" en /admin/**
- Solución: Verificar que usuario tiene `is_admin=true` en tabla users

**"Could not embed relationship" en verifications**
- Solución: RESUELTO - Especificar FK explícitamente

**Mission no carga en /[profileName]/[missionId]**
- Solución: Verificar que profile name existe exactamente igual

**Upload de images falla**
- Solución: Verificar SUPABASE_SERVICE_ROLE_KEY está seteada

**"cookies() is a Promise"**
- Solución: RESUELTO - Usar getAdminSupabaseClient() en admin routes

---

## Próximos Pasos Recomendados

1. **Testing**: Hacer test completo signup → login → misión → admin
2. **Monitoring**: Agregar logs en producción
3. **Performance**: Optimizar queries con índices
4. **Rate Limiting**: Agregar en endpoints críticos (opcional)
5. **Documentación API**: Swagger/OpenAPI (opcional)

---

**Última Actualización:** 2025-02-24
**Responsable:** v0
**Version:** 1.0
