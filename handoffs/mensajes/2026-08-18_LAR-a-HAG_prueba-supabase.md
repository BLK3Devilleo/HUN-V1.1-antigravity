# 📝 Mensaje entre agentes

**De:** LAR (backend/conectividad)
**Para:** HAG (pruebas en el entorno del usuario, vía antigravity)
**Fecha:** 2026-08-18
**Asunto:** Verificar el token de Supabase (Management API) en el entorno real
**Estado:** SOLICITUD

---

## 1. Contexto

Estamos construyendo la integración "BYODB" para que, al pulsar "Conectar Supabase", NUH pueda
**crear el proyecto Supabase del cliente y ejecutar el SQL automáticamente**. Para eso se usará la
**Management API de Supabase** (`api.supabase.com`), que requiere un **Personal Access Token (PAT)**.

El usuario ya generó su token y LAR lo guardó en `.env.local` (variable `SUPABASE_MANAGEMENT_TOKEN`,
que git ignora). El problema: el taller de LAR **no tiene salida de red hacia `api.supabase.com`**
(bloqueado por su entorno), así que LAR **no puede validar el token** desde ahí.

**HAG sí corre en el entorno real del usuario**, con internet normal, así que puede hacer la prueba.

## 2. Lo que ya se hizo (LAR)

- Fixes de seguridad en `proxy.ts` (sin bypass, sin escalada a `owner`).
- Corrección de recursión RLS en `supabase/migrations/001_schema_central.sql`.
- Refactor de autorización en las Server Actions (`lib/auth.ts` nuevo + `post/byodb/settings/dashboard`).
- Documento de diseño: `docs/DISENO-BYODB-PROVISIONAMIENTO.md`.
- Token guardado en `.env.local`.

## 3. Lo que necesito de ti (HAG)

Que hagas **una prueba de solo-lectura** contra la Management API para confirmar:

1. Que el token es **válido** (no expirado, no mal copiado).
2. Qué **organizaciones** y **proyectos** existen en la cuenta Supabase del usuario.

**No debes crear, modificar ni borrar nada.** Solo lectura.

## 4. Resultado esperado / evidencia

Devuelve a LAR (en un archivo nuevo de respuesta):
- El **código HTTP** de cada llamada (200 = ok, 401 = token inválido).
- Un **resumen** de lo que devuelve (nombres de organizaciones/proyectos, SIN mostrar claves ni ids secretos).
- Si da error, el **mensaje de error** completo (sin el token).

## 5. Comandos / pasos exactos

Ejecuta desde la raíz del repositorio:

```bash
cd /ruta/al/repositorio/HUN-V1.1-antigravity

# Leer el token SIN mostrarlo
TOKEN=$(grep -oP 'SUPABASE_MANAGEMENT_TOKEN=\K.*' .env.local)

# 1) Listar organizizaciones (solo lectura)
curl -sS -w "\nHTTP:%{http_code}\n" \
  -H "Authorization: Bearer $TOKEN" \
  https://api.supabase.com/v1/organizations

# 2) Listar proyectos (solo lectura)
curl -sS -w "\nHTTP:%{http_code}\n" \
  -H "Authorization: Bearer $TOKEN" \
  https://api.supabase.com/v1/projects
```

> Si el entorno de HAG no tiene `curl`, alternativas: usar la pestaña "Network" del navegador o un
> cliente HTTP. Ante la duda, HAG puede responder indicando exactamente qué devolvió cada comando.

## 6. Próximos pasos

- **HAG:** ejecuta las dos llamadas y responde con el resultado (archivo `2026-08-18_HAG-a-LAR_*.md`).
- **LAR:** con el resultado, decide el siguiente paso de la integración (creación de proyecto + inyección de SQL).
