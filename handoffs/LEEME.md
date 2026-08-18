# 📂 Carpeta de comunicación entre agentes (Handoffs)

Esta carpeta es el **buzón oficial de comunicación** entre los agentes que trabajan en este proyecto.
Aquí se dejan documentos de traspaso, instrucciones, resultados de pruebas y acuerdos, para que cada
agente sepa exactamente qué hizo el otro y qué tiene que hacer a continuación.

## 👥 Quiénes somos

| Nombre | Rol | Qué hace |
|---|---|---|
| **LAR** | Backend / Conectividad | Lógica del servidor, seguridad, base de datos, Supabase, R2, n8n. |
| **HAG** | Pruebas en el entorno real | Ejecuta las pruebas que LAR no puede correr desde su taller (con antigravity en el entorno del usuario). |
| **Don Emilio** | Frontend / Diseño | UI/UX. **Zona congelada:** nadie más toca sus componentes ni sus estilos. |
| **Usuario** | Dueño del proyecto | Decide prioridades, aprueba cambios y gestiona cuentas (Supabase, etc.). |

## 📁 Cómo usar esta carpeta

1. Cada mensaje entre agentes es **un archivo `.md`** con este nombre:

   ```
   YYYY-MM-DD_de-a_asunto.md
   ```

   Ejemplo: `2026-08-18_LAR-a-HAG_prueba-supabase.md`

2. Usa siempre la **plantilla** (`PLANTILLA.md`) para que todos los mensajes tengan la misma forma.

3. Al responder, crea **un archivo nuevo** (no borres ni edites el mensaje del otro). Así queda el historial.

## 🚫 Reglas de oro

- **NO se escriben secretos** (tokens, claves, contraseñas) en estos documentos. Los secretos viven
  solo en `.env.local` (que git ignora). Aquí se menciona el *nombre* de la variable, nunca su valor.
- **NO se toca el frontend de Don Emilio** (`components/`, páginas, `globals.css`). Solo backend/conectividad.
- **No se modifica código sin que esté claro el "por qué".** Primero documento, luego cambio.
- Cada hallazgo importante indica **archivo afectado** y **evidencia**.

## 🗂️ Archivos de esta carpeta

- `PLANTILLA.md` — plantilla para los mensajes.
- `2026-08-18_LAR-a-HAG_prueba-supabase.md` — primer traspaso: contexto + prueba del token de Supabase.
