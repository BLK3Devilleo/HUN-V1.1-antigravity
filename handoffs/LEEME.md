# 📂 Cocina NUH — Buzón de comunicación entre agentes (Handoffs)

> **Marco "Cocina NUH".** NUH es un restaurante; el repo es la cocina. Cada agente es un puesto de
> trabajo con responsabilidades claras y una **zona congelada** que nadie más toca. Esta carpeta es
> el **buzón oficial de comunicación**: aquí se dejan traspasos, instrucciones, resultados de pruebas
> y acuerdos, para que cada agente sepa exactamente qué hizo el otro y qué le toca a continuación.

## 👥 Quiénes somos (puestos de la cocina)

| Nombre | Puesto en la cocina | Función técnica | Jurisdicción |
|---|---|---|---|
| **HAR** | **Jefe de Cocina** | Backend / Conectividad / Seguridad | Lógica de servidor, Supabase, R2, n8n, criptografía, observabilidad. |
| **HAG** | **Sous-chef** | Pruebas en el entorno real | Ejecuta las pruebas que HAR/COCINERO no pueden correr desde su taller (con antigravity en el entorno del usuario). |
| **COCINERO** | **Sub-agente de HAR** | Implementación de funciones (platos) | Escribe el código de las features end-to-end siguiendo las recetas que fija HAR. Reporta a HAR. |
| **Don Emilio** | **Par (frontend)** | UI/UX | **Zona congelada:** nadie más toca sus componentes, páginas ni `globals.css`. También propone y desarrolla funciones. |
| **Usuario** | **Dueño del restaurante** | Decide prioridades, aprueba cambios y gestiona cuentas (Supabase, etc.). | Aprobaciones y secretos (`.env.local`). |

> **Nota histórica:** el backend se llamaba antes **LAR**. A partir de ahora es **HAR** (Jefe de
> Cocina). Los mensajes antiguos que firman "LAR" siguen siendo válidos como historial; no se
> renombran ni se borran.

## 📁 Cómo usar esta carpeta

1. **Los puestos viven en `agentes/`**, cada uno con dos archivos:
   - `SYSTEM-PROMPT.md` — su rol, reglas y límites (no cambia a menudo).
   - `SEGUIMIENTO.md` — bitácora de lo que ha hecho (se actualiza al terminar cada tarea).

   ```
   handoffs/agentes/HAR/SYSTEM-PROMPT.md
   handoffs/agentes/HAR/SEGUIMIENTO.md
   handoffs/agentes/HAR/subagentes/COCINERO/SYSTEM-PROMPT.md
   handoffs/agentes/HAR/subagentes/COCINERO/SEGUIMIENTO.md
   handoffs/agentes/HAG/SYSTEM-PROMPT.md
   handoffs/agentes/HAG/SEGUIMIENTO.md
   ```

2. Los **mensajes entre agentes** viven en `handoffs/mensajes/` con este nombre:

   ```
   YYYY-MM-DD_de-a_asunto.md
   ```

   Ejemplo: `2026-08-18_HAR-a-HAG_prueba-supabase.md`. Usa siempre la **plantilla**
   (`handoffs/mensajes/PLANTILLA.md`) para que todos tengan la misma forma.

3. Al responder, crea **un archivo nuevo** (no borres ni edites el mensaje del otro). Así queda el historial.

## 🔖 ORDEN: mantener el SEGUIMIENTO

> **Todo agente (HAR, HAG y COCINERO) debe actualizar su propio `SEGUIMIENTO.md` al terminar cada
> tarea.** No se da por terminado un trabajo hasta que la bitácora refleje qué se hizo, qué archivos
> se tocaron y en qué estado quedó. El SEGUIMIENTO es el único lugar donde se reconstruye el contexto
> si una sesión se pierde.

## 🚫 Reglas de oro

- **NO se escriben secretos** (tokens, claves, contraseñas) en estos documentos. Los secretos viven
  solo en `.env.local` (que git ignora). Aquí se menciona el *nombre* de la variable, nunca su valor.
- **NO se toca el frontend de Don Emilio** (`components/`, páginas, `globals.css`). Solo backend/conectividad.
- **No se modifica código sin que esté claro el "por qué".** Primero documento, luego cambio.
- Cada hallazgo importante indica **archivo afectado** y **evidencia**.
- **COCINERO cocina, HAR decide.** El Cocinero (sub-agente) implementa; el Jefe de Cocina fija
  arquitectura, seguridad y conectividad, y revisa lo cocinado antes de servirlo.
- **🚨 El merge a `main` es exclusivo del Usuario.** Ningún agente mergea un PR por su cuenta.
  Los agentes llegan hasta `git push` + PR abierto, y avisan. Motivo: **mergear cierra la sesión de
  trabajo** y mata el acceso remoto a GitHub; todo commit local sin subir queda atrapado y se pierde.
  Regla práctica antes de terminar un turno: **primero `push`, después ya se hablará del merge.**

## 🗂️ Archivos de esta carpeta

- `agentes/{HAR,HAG}/SYSTEM-PROMPT.md` y `SEGUIMIENTO.md` — rol y bitácora de cada puesto.
- `agentes/HAR/subagentes/COCINERO/SYSTEM-PROMPT.md` y `SEGUIMIENTO.md` — rol y bitácora del sub-agente.
- `mensajes/PLANTILLA.md` — plantilla para los mensajes.
- `mensajes/2026-08-18_LAR-a-HAG_prueba-supabase.md` — traspaso histórico (cuando HAR se llamaba LAR).
- `mensajes/2026-08-18_HAG-a-LAR_prueba-supabase.md` — respuesta histórica de la prueba del token de Supabase.
