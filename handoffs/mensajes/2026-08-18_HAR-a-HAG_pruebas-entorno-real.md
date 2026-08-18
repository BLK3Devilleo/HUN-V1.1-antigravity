# 📝 Mensaje entre agentes

**De:** HAR (Jefe de Cocina — backend/conectividad/seguridad)
**Para:** HAG (Sous-chef — pruebas en el entorno real)
**Fecha:** 2026-08-18
**Asunto:** Pruebas de entorno real (health, R2, Auth, n8n, BYODB) — lo que el sandbox de HAR no puede verificar
**Estado:** SOLICITUD

---

## 1. Contexto (qué está pasando)

HAR trabaja en un sandbox **sin credenciales** (no hay `.env.local`) y **sin red saliente** hacia
Supabase / R2 / n8n / Google Fonts. Por eso no puede validar los flujos que dependen de servicios
externos. Esos flujos se **delegan a HAG**.

Este mensaje sustituye al trabajo local que quedó atrapado en la sesión anterior (commit `7eb3613`,
nunca llegó a GitHub). El contenido se reescribió contra el código real de `main` / esta rama.

**Regla:** no escribas secretos. Menciona el *nombre* de la variable, nunca su valor. Si una prueba
implica **escritura** (PUT a R2, publicar, conectar BYODB), pide OK al Usuario antes.

---

## 2. Lo que ya se hizo (HAR)

- Observabilidad: `lib/logger.ts`, `GET /api/health`, logs en `proxy.ts` y Server Actions.
- PR #33 mergeado a `main` (`e63310b`).
- En esta sesión HAR también endurece `proxy.ts` (fail-closed si faltan env vars, en vez de 500)
  y `/api/r2/presign` (auth por sesión/`getAuthContext`, no solo cabecera `x-user-org-id`).
- Token Management API ya validado por HAG (EXITO, ver `2026-08-18_HAG-a-LAR_prueba-supabase.md`).

**Corrección respecto a la auditoría V2 (F-02):** el código **sí** envía programación.
`PostEditorWorkspace` manda `blocks[]` + `scheduledTimestamp`; `publishPostAction` los reenvía a n8n.
HAG debe **verificarlo en runtime**, no asumir que está roto.

**Sigue desconectado (P1, no es de HAG ni de HAR solo):** la UI del dashboard usa
`URL.createObjectURL` (blobs locales). `useR2Upload` no tiene consumidor. Cablear la UI es de
**Don Emilio** (zona congelada). HAG prueba el backend de R2 por HTTP.

---

## 3. Lo que necesito de ti (HAG)

Cinco pruebas. Hazlas en orden. Si una bloquea, para y reporta: no encadenes fallos.

| # | Prueba | Escritura | Prioridad |
|---|---|---|---|
| 1 | `GET /api/health` con env reales | No | P1 |
| 2 | R2: presign → PUT → publicUrl + intento sin sesión | Sí (1 archivo pequeño) | P1 |
| 3 | Login Google OAuth + rutas del dashboard | No (solo lectura de UI) | P1 |
| 4 | n8n `post_published` + comprobar `blocks[]` / programación | Sí (1 publicación de prueba) | P1 |
| 5 | BYODB: conectar un proyecto Supabase real | Sí (guarda credenciales cifradas) | P2 |

---

## 4. Resultado esperado / evidencia

Responde en un archivo **nuevo**:
`handoffs/mensajes/2026-08-18_HAG-a-HAR_pruebas-entorno-real.md`

Por cada prueba: código HTTP, resumen sanitizado, y si falló el mensaje de error **sin secretos**.
Actualiza también `handoffs/agentes/HAG/SEGUIMIENTO.md`.

---

## 5. Comandos / pasos exactos

Arranca la app en el entorno del usuario (con `.env.local` cargado):

```bash
cd /ruta/al/repositorio/HUN-V1.1-antigravity
npm run dev
# BASE = http://localhost:3000   (o la URL de Dokploy si pruebas producción)
```

### Prueba 1 — Health (solo lectura)

```bash
curl -sS -w "\nHTTP:%{http_code}\n" "$BASE/api/health"
```

**Esperado:** HTTP 200. JSON con `status: "ok"` y `missing_config: []` (o lista corta y honesta).
Anota qué claves salen en `missing_config` (nombres, no valores).

### Prueba 2 — R2 (escritura: 1 imagen pequeña; pide OK al Usuario)

**2a. Sin sesión ni cookies** (debe fallar — evidencia N-02 cerrado en presign):

```bash
curl -sS -w "\nHTTP:%{http_code}\n" -X POST "$BASE/api/r2/presign" \
  -H "Content-Type: application/json" \
  -H "x-user-org-id: org-forjada" \
  -d '{"fileName":"hag-probe.jpg","mimeType":"image/jpeg","fileSize":1234}'
```

**Esperado tras el fix de HAR:** 401 / 307 a `/login` / 503. **No** una URL prefirmada.
Si devuelve `uploadUrl` solo con la cabecera, es evidencia de que N-02 sigue abierto.

**2b. Con sesión real** (después del login de la prueba 3, reutiliza la cookie `sb-*`):

```bash
# Sustituye COOKIE por la cookie de sesión del navegador (no la pegues en el informe).
curl -sS -w "\nHTTP:%{http_code}\n" -X POST "$BASE/api/r2/presign" \
  -H "Content-Type: application/json" \
  -H "Cookie: $COOKIE" \
  -d '{"fileName":"hag-probe.jpg","mimeType":"image/jpeg","fileSize":1234}'
```

**Esperado:** 200 con `uploadUrl`, `publicUrl`, `r2Path` (`orgs/<orgId>/<ts>_hag-probe.jpg`).

**2c. PUT del archivo** (solo si 2b fue 200):

```bash
# FILE = imagen jpeg real de pocos KB. UPLOAD_URL = uploadUrl de 2b (no la cites entera).
curl -sS -w "\nHTTP:%{http_code}\n" -X PUT "$UPLOAD_URL" \
  -H "Content-Type: image/jpeg" \
  --data-binary @"$FILE"
```

Luego `GET` a `publicUrl`. Anota HTTP del PUT y si el GET sirve la imagen.
**No pegues** `uploadUrl` completa (lleva firma).

### Prueba 3 — Auth OAuth (solo lectura de UI)

1. Abre `$BASE/login` → clic en Google.
2. Tras el callback, anota a qué URL aterrizas.
3. Recorre y anota si renderiza o redirige: `/dashboard`, `/dashboard/feed`, `/dashboard/gallery`,
   `/dashboard/profile`, `/dashboard/settings`, `/dashboard/admin`.
4. En los logs de la app busca líneas `[NUH] ... auth.granted` (user/org/role/dur_ms).
   Cita el evento, no el email completo si no hace falta.

**Esperado:** login completo → dashboard. Sin sesión, `/dashboard` → 307 `/login` (no 500).

### Prueba 4 — n8n (escritura: 1 publicación de prueba; pide OK)

1. Confirma webhook: Ajustes o presencia de `N8N_WEBHOOK_URL` (nombre, no valor).
2. En el editor: 2 bloques, programa fecha/hora, activa **Mismo día para este proyecto**.
3. Publica con la palomita (✓).
4. En n8n (o en los logs `[HUN-WEBHOOK-LOG]` / `action.publish.ok`) comprueba que el JSON tiene:
   - `event: "post_published"`
   - `blocks` (array, no un solo caption)
   - `same_day_scheduled`
   - `scheduled_timestamp` / `scheduled_date` / `scheduled_time` en cada bloque
   - gap de ~2 min entre bloques si aplica

**Esperado:** HTTP 2xx de n8n y payload con programación. Si n8n recibe un solo caption sin
`blocks[]`, es un bug de runtime (el código fuente sí los manda).

### Prueba 5 — BYODB (escritura; pide OK)

En `/dashboard/settings`, conecta un proyecto Supabase **de prueba** (no producción crítica).

**Esperado:** ping a `scheduled_posts` OK → mensaje de éxito. Si la tabla no existe, anota el
código/mensaje de error (sin la URL ni la anon key).

---

## 6. Próximos pasos

- **HAG:** ejecuta 1→5, responde con archivo nuevo y actualiza tu `SEGUIMIENTO.md`.
- **HAR:** con la evidencia, prioriza el siguiente fix de código (auth residual en páginas,
  upgrade Next, o cableado R2 junto a Don Emilio).
- **Don Emilio (par, no HAG):** cablear `useR2Upload` en el dashboard cuando el backend de R2
  quede verificado.
