# 📒 HAR — Bitácora (SEGUIMIENTO)

> Registro cronológico de lo que ha hecho el Jefe de Cocina. Última entrada arriba.

---

## 2026-08-18 — Observabilidad: logger, health endpoint y logging de auditoría

**Contexto:** dar visibilidad al backend ("cámaras de vigilancia") y ordenar el buzón de agentes
con el marco "Cocina NUH".

**Hecho:**

- **Observabilidad**
  - `lib/logger.ts` — logger estructurado: una línea por evento en stdout, redacción de secretos,
    truncado a 200 chars y nivel configurable vía `LOG_LEVEL`.
  - `app/api/health/route.ts` — endpoint de salud que expone presencia de variables de entorno
    (nunca sus valores) y `missing_config`.
  - `proxy.ts` — importa el logger, calcula `clientIp`/`method`/`pathname`, excluye `/api/health`
    de la interceptación y registra `auth.dev_bypass`, `auth.redirect_login`, `auth.denied` y
    `auth.granted` (con `dur_ms`).
  - `app/actions/{post,moderation,byodb,settings,media}.ts` — eventos `action.*` de auditoría
    (`.start`/`.ok`/`.failed`/`.denied`) con `user`, `org`, `role`, `cause_id`, etc.
  - `docker-compose.yml` — variable `LOG_LEVEL` y `healthcheck` vía `wget` contra `/api/health`.

- **Handoffs (Cocina NUH)**
  - Creado `handoffs/agentes/HAR/{SYSTEM-PROMPT,SEGUIMIENTO}.md`.
  - Creado `handoffs/agentes/HAG/{SYSTEM-PROMPT,SEGUIMIENTO}.md`.
  - Creado `handoffs/agentes/HAR/subagentes/COCINERO/{SYSTEM-PROMPT,SEGUIMIENTO}.md`.
  - Movidos `PLANTILLA.md` y los mensajes a `handoffs/mensajes/`.
  - Reescrito `handoffs/LEEME.md` con los puestos y la orden de mantener el SEGUIMIENTO.

**Estado:** `npx tsc --noEmit` limpio; pendiente de revisión/merge.

---

## 2026-08-18 (anterior, como LAR) — Seguridad + diseño BYODB

- Fixes de seguridad en `proxy.ts` (sin bypass, sin escalada a `owner`).
- Corrección de recursión RLS en `supabase/migrations/001_schema_central.sql`.
- Refactor de autorización en Server Actions (`lib/auth.ts` + `post/byodb/settings/dashboard`).
- Documento de diseño: `docs/DISENO-BYODB-PROVISIONAMIENTO.md`.
- Token de Supabase (Management API) guardado en `.env.local`; validación delegada a HAG.
