# GUÍA DE DEPLOYMENT A PRODUCCIÓN

## Estado Actual
**Aplicación:** Zerytask v1.0
**Status:** ✅ LISTO PARA PRODUCCIÓN
**Auditoría:** Completada 2025-02-24

---

## PRE-DEPLOYMENT CHECKLIST

### 1. Verificaciones Técnicas (5 min)

```bash
# ✅ Verificar que no hay errores en el código
# 1. Abrir navegador en dev environment
# 2. Verificar browser console (F12) - debe estar limpia
# 3. Hacer hard refresh: Ctrl+Shift+R
# 4. Esperar a que Turbopack recompile todo

# ✅ Verificar funcionalidad core
# 1. Signup: Crear nuevo usuario
# 2. Login: Iniciar sesión con usuario nuevo
# 3. Missions: Ver lista de misiones
# 4. Profile: Acceder a perfil
# 5. Admin: Loggearse como admin y acceder a /admin

# ✅ Verificar variables de entorno
NEXT_PUBLIC_SUPABASE_URL=✅ Set
NEXT_PUBLIC_SUPABASE_ANON_KEY=✅ Set
SUPABASE_SERVICE_ROLE_KEY=✅ Set (NO exponer)
```

### 2. Base de Datos (1 min)

```sql
-- Verificar en Supabase dashboard:
SELECT COUNT(*) FROM users;          -- Debe tener usuarios de test
SELECT COUNT(*) FROM missions;       -- Debe tener misiones
SELECT COUNT(*) FROM mission_profiles;  -- Debe tener perfiles

-- Verificar triggers están activos:
SELECT * FROM pg_proc WHERE proname = 'handle_new_user';
```

### 3. Build Verification (2 min)

```bash
# En terminal:
npm run build

# Output esperado:
# ✓ Linting
# ✓ Type checking
# ✓ Compiling server
# ✓ Compiling client
# No errors, warnings are OK
```

---

## DEPLOYMENT STEPS

### Opción 1: Manual via Vercel Dashboard (Recomendado)

1. **GitHub:**
   - Push cambios a `main` branch
   - Crear pull request desde `v0/forgeblastv0-3632-c36cfc8b`
   - Review y merge a `main`

2. **Vercel Dashboard:**
   - Ir a https://vercel.com/dashboard
   - Seleccionar proyecto `v0-zerytask`
   - Ir a "Deployments"
   - Vercel detectará cambios automáticamente
   - Click "Deploy"

3. **Verificar Deploy:**
   - Esperar a que muestre "Ready"
   - Click en "Visit" para abrir URL en producción
   - Test todas las funciones críticas

### Opción 2: Automático via GitHub

Si Vercel está conectado a GitHub (recomendado):

1. Merge a `main` branch
2. Vercel automáticamente detecta cambios
3. Inicia build automáticamente
4. Deploy automático si build es exitoso

---

## POST-DEPLOYMENT VERIFICATION

### Minuto 0-5: Verificación Rápida
```
[ ] 1. Home page carga (https://zerytask.vercel.app)
[ ] 2. Login page funciona
[ ] 3. Signup con código invitación funciona
[ ] 4. Puedo logearme en admin
```

### Minuto 5-15: Funcionalidad Core
```
[ ] 1. Ver misiones funciona
[ ] 2. Ver perfil de usuario funciona
[ ] 3. Admin panel accesible
[ ] 4. Crear misión funciona
[ ] 5. Customization page funciona
```

### Minuto 15-30: Casos Edge
```
[ ] 1. Logout y login de nuevo funciona
[ ] 2. Referral links generan usuarios
[ ] 3. Mission verification pending
[ ] 4. Exchange request funciona
[ ] 5. Error pages se ven bien
```

### Verificar Logs
```
En Vercel Dashboard:
1. Ir a Deployment → Logs
2. Verificar que no hay errores 500
3. Ver que console logs son normales

En Supabase:
1. Ir a Database → Logs
2. Verificar que no hay RLS violations
3. Ver que triggers ejecutaron correctamente
```

---

## ROLLBACK PROCEDURE (Si algo falla)

### Si Deploy Falla en Vercel

```
1. En Vercel Dashboard:
   - Click "Production"
   - Seleccionar deployment anterior
   - Click "Rollback"
   
2. Esperar a que se redeploy
3. Verificar que vuelve a funcionar
```

### Si Hay Bug en Producción

```
1. En local:
   - Crear fix branch: git checkout -b fix/issue
   - Hacer cambios
   - Test localmente
   
2. Push a GitHub:
   - git push origin fix/issue
   - Crear PR
   - Review
   - Merge a main (deployment automático)
```

---

## MONITOREO EN PRODUCCIÓN

### Diario
```
✅ Revisar Vercel logs para errores
✅ Revisar Supabase logs para RLS violations
✅ Verificar CPU/Memory usage está normal
✅ Verificar database connections
```

### Semanal
```
✅ Revisar estadísticas de usuarios
✅ Verificar performance metrics
✅ Revisar billing usage
✅ Hacer test completo de funcionalidad
```

### Mensual
```
✅ Revisar security logs
✅ Actualizar dependencias si hay patches
✅ Revisar backup status
✅ Planificar mejoras
```

---

## VARIABLES DE ENTORNO A VERIFICAR

### En Vercel Dashboard → Settings → Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL
  ✅ Must be set
  ✅ Must match Supabase project

NEXT_PUBLIC_SUPABASE_ANON_KEY
  ✅ Must be set
  ✅ Safe to expose (anon key)

SUPABASE_SERVICE_ROLE_KEY
  ✅ Must be set
  ✅ NEVER expose in client code

SUPABASE_JWT_SECRET
  ✅ Must be set
  ✅ Same as in Supabase

DATABASE_URL / POSTGRES_URL
  ✅ Optional (for direct DB access)
  ✅ Supabase provides if needed
```

---

## TROUBLESHOOTING

### "Build Failed"
```
Solución:
1. Verificar error message en Vercel logs
2. Si es TypeScript error: revisar types
3. Si es dependencias: npm install && npm run build localmente
4. Push fix a main
```

### "Access Denied" en admin
```
Solución:
1. Verificar que usuario tiene is_admin=true en BD
2. Verificar que auth cookie existe
3. Logout y login de nuevo
4. Verificar RLS policy en admin table
```

### "500 Error" en API
```
Solución:
1. Revisar Vercel logs para stack trace
2. Revisar Supabase logs para DB errors
3. Verificar que service role key está set
4. Verificar que connection strings son correctas
```

### "Slow Performance"
```
Solución:
1. Revisar Supabase query performance
2. Agregar índices si necesario
3. Verificar que no hay N+1 queries
4. Usar caching con revalidateTag()
```

---

## INFORMACIÓN DE CONTACTO & SUPPORT

### En Caso de Emergencia
1. **Vercel Status:** https://status.vercel.com
2. **Supabase Status:** https://status.supabase.com
3. **Vercel Support:** https://vercel.com/help

---

## DEPLOYMENT HISTORY

| Date | Version | Status | Notes |
|------|---------|--------|-------|
| 2025-02-24 | v1.0 | ✅ Ready | Complete audit, all fixes applied |

---

## SIGN-OFF

**Aplicación:** Zerytask
**Versión:** 1.0
**Auditor:** v0
**Fecha:** 2025-02-24
**Status:** ✅ APPROVED FOR PRODUCTION

**Responsable de Deploy:** [Your Name]
**Fecha de Deploy:** [To be filled]

---

Para más detalles técnicos:
- [FINAL_AUDIT_REPORT_2025.md](./FINAL_AUDIT_REPORT_2025.md)
- [ZERYTASK_REFERENCE.md](./ZERYTASK_REFERENCE.md)
- [COMPREHENSIVE_AUDIT_2025.md](./COMPREHENSIVE_AUDIT_2025.md)
