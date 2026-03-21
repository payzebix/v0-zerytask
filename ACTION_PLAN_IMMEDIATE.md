# PLAN DE ACCIÓN INMEDIATA - FIXES CRÍTICOS

## 🔴 FIXES PRIORITARIOS (Hacer en orden)

### 1. FIX RLS EN TABLAS CRÍTICAS (15 min)
**Archivo:** Ejecutar en Supabase SQL Editor

```sql
-- Habilitar RLS en admin_config
ALTER TABLE admin_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Only admins can read" ON admin_config FOR SELECT USING (
  auth.uid() IN (SELECT id FROM users WHERE is_admin = true)
);

-- Arreglar mission_profiles RLS (actualmente contradictorio)
-- Verificar que RLS está habilitado correctamente
ALTER TABLE mission_profiles ENABLE ROW LEVEL SECURITY;
```

### 2. AUDITAR TODOS LOS AWAIT PARAMS EN NEXT.JS 16 (30 min)
**Rutas Identificadas que necesitan fix:**
- `app/api/missions/[id]/verify/route.ts` - ✅ ARREGLADO
- `app/api/missions/[id]/route.ts` - PENDIENTE
- `app/api/missions/by-profile/[profileId]/route.ts` - PENDIENTE
- `app/admin/users/[id]/page.tsx` - PENDIENTE
- `app/admin/missions/[id]/edit/page.tsx` - PENDIENTE
- `app/admin/mission-profiles/[id]/page.tsx` - PENDIENTE

**Pattern correcto:**
```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  // resto del código
}
```

### 3. AGREGAR UUID VALIDATION (20 min)
**Crear validador si no existe:**
```typescript
// lib/uuid-validator.ts - Ya existe, reutilizar

export const isValidUUID = (id: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(id)
}

export const invalidUUIDResponse = (field: string) => ({
  error: `Invalid ${field} format`,
  status: 400
})
```

**Aplicar a estas rutas:**
- `/api/missions/[id]/*`
- `/api/admin/missions/[id]/*`
- `/api/admin/users/[id]`
- `/api/mission-profiles/[id]/*`
- (5 rutas total identificadas)

### 4. CENTRALIZAR LOGGING (15 min)
**Crear archivo:**
```typescript
// lib/logger.ts
export const log = {
  info: (msg: string, data?: any) => console.log(`[v0] ${msg}`, data),
  error: (msg: string, err?: any) => console.error(`[v0] ERROR ${msg}`, err),
  warn: (msg: string, data?: any) => console.warn(`[v0] WARN ${msg}`, data),
  debug: (msg: string, data?: any) => {
    if (process.env.DEBUG) console.log(`[v0] DEBUG ${msg}`, data)
  }
}
```

Reemplazar todos los console.* con log.* en rutas críticas.

### 5. ARREGLAR CUSTOMIZATION PREVIEW (30 min)
**Problema:** Preview no actualiza en tiempo real mientras escribes
**Solución:**
```typescript
// En /admin/customization/page.tsx
// Agregar useEffect para actualizar preview en tiempo real
useEffect(() => {
  // Actualizar CSS variables del html con formData
  Object.entries(formData).forEach(([key, value]) => {
    const cssVar = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`
    document.documentElement.style.setProperty(cssVar, String(value))
  })
}, [formData])
```

---

## 🟠 FIXES IMPORTANTES (Esta semana)

### 6. RATE LIMITING EN APIS PÚBLICAS
Usar Upstash Redis (disponible):
```typescript
// lib/rate-limit.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "1 h"),
});
```

### 7. CONSISTENCY DE LOGO
**Decisión necesaria:** ¿Qué tamaño usar?
- Opción A: 8x8 (pequeño, más limpio)
- Opción B: 10x10 (medio)
- Opción C: 12x12 (actual)

Propuesta: **12x12 en todas partes** para consistencia

Cambios:
- Lista de misiones: `h-6 w-6` (ya hecho ✅)
- Detalle de misión: `h-6 w-6` (cambiar de h-5 w-5)
- Admin panel: auditar todos los uses

### 8. MOBILE RESPONSIVENESS
Auditar estos componentes:
- Tarjetas de misiones en móvil
- Formularios de admin
- Navegación

---

## ✅ VERIFICACIÓN POST-FIXES

```
CHECKLIST DE VALIDACIÓN:
- [ ] Todos los params son awaited en Next.js 16
- [ ] Todas las rutas [id] validan UUID
- [ ] RLS habilitado en admin_config
- [ ] Logging centralizado en rutas críticas
- [ ] Customization preview actualiza en tiempo real
- [ ] Logo tamaño consistente (12x12)
- [ ] Rate limiting funciona
- [ ] No hay console errors en dev tools
- [ ] Home page carga correctamente
- [ ] Admin panel accesible
```

---

## 📊 TIMELINE ESTIMADO

| Tarea | Tiempo | Prioridad |
|-------|--------|-----------|
| RLS en admin_config | 15 min | 🔴 |
| Audit params await | 30 min | 🔴 |
| UUID validation | 20 min | 🔴 |
| Logging centralizado | 15 min | 🔴 |
| Customization preview | 30 min | 🔴 |
| **TOTAL CRÍTICAS** | **110 min** | - |
| Logo consistency | 15 min | 🟠 |
| Rate limiting | 30 min | 🟠 |
| Mobile test | 20 min | 🟠 |
| **TOTAL IMPORTANTES** | **65 min** | - |

**Tiempo total recomendado:** 2.5-3 horas para todos los fixes críticos.

---

## 🎯 RESULTADO ESPERADO

Después de aplicar estos fixes:
- ✅ Funcionalidad: 95%
- ✅ Seguridad: 85%
- ✅ Performance: 80%
- ✅ Listo para producción con confianza

