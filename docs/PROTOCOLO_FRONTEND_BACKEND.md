# 🏗️ Protocolo de Desarrollo Colaborativo (HUN)
**Roles:** Emilio (Frontend) & LARM2 (Backend / Conectores)

Este documento define las fronteras estrictas de trabajo para asegurar que tanto los desarrolladores como las Inteligencias Artificiales (IAs) que los asisten NO se sobreescriban, NO generen conflictos, y NO alucinen modificando código fuera de su jurisdicción.

---

## 🎭 1. Jurisdicción y Propiedad de Archivos

Para evitar conflictos de "Merge", cada área tiene propiedad EXCLUSIVA sobre ciertos directorios y archivos. 

### 🎨 Jurisdicción de Emilio (Frontend)
Emilio (y sus IAs asistentes) son los **únicos** autorizados para crear, editar o eliminar código relacionado a la Interfaz de Usuario y Experiencia (UI/UX).

**Archivos bajo su control exclusivo:**
*   `app/page.tsx`, `app/(auth)/login/page.tsx`
*   `app/(dashboard)/**/page.tsx` y `layout.tsx` (Rutas visuales)
*   `app/globals.css` (Estilos y variables Tailwind)
*   `components/**/*.tsx` (Todos los componentes visuales: modales, botones, widgets de carga, barras laterales, etc.)
*   `public/**/*` (Imágenes, SVG, iconos)

*Nota Backend:* LARM2 no tocará estos archivos para cambiar colores, posiciones o lógica visual. Si el backend necesita inyectar un dato, LARM2 proveerá el endpoint o la *Server Action* y Emilio será quien consuma ese dato en sus componentes.

### ⚙️ Jurisdicción de LARM2 (Backend & Orquestación)
LARM2 (y sus IAs asistentes) son los **únicos** autorizados para gestionar la seguridad, la base de datos, middlewares y lógica del servidor.

**Archivos bajo su control exclusivo:**
*   `proxy.ts` (Middleware de Next.js y guardián de rutas)
*   `app/api/**/*.ts` (Endpoints HTTP, OAuth callbacks, RLS tokens, presigned R2 URLs)
*   `app/actions/**/*.ts` (Server Actions que interactúen con Supabase o encriptación)
*   `lib/supabase.ts`, `lib/r2.ts`, `lib/crypto.ts` (Conectores y helpers de bases de datos y almacenamiento)
*   `supabase/migrations/*.sql` (Esquemas de la base de datos)
*   `Dockerfile` y `docker-compose.yml` (Despliegue)
*   Configuraciones del entorno (`next.config.ts`, `package.json` en cuanto a dependencias de servidor).

*Nota Frontend:* Emilio no debe modificar la lógica de autenticación ni los esquemas de bases de datos. Si un componente necesita subir un archivo, Emilio consumirá la ruta `/api/r2/presign` creada por LARM2.

---

## 🤖 2. Reglas Estrictas para Agentes IA (Anti-Alucinaciones)

Cuando Emilio o LARM2 utilicen agentes de IA (Cursor, GitHub Copilot, Gemini, Claude, etc.), el agente **DEBE** leer estas reglas antes de ejecutar cualquier cambio:

1.  **Regla de Oro (Cross-Boundary Limit):** Un agente trabajando en una tarea de Frontend (Emilio) **TIENE PROHIBIDO** reescribir o modificar archivos de la carpeta `lib/`, `app/api/` o `proxy.ts` para "hacer que su componente funcione". De igual forma, un agente de Backend **TIENE PROHIBIDO** borrar clases de Tailwind o reescribir componentes en `components/`.
2.  **Mocking sobre Mutación:** Si la IA de Emilio necesita datos del Backend que LARM2 aún no ha creado, la IA debe usar datos estáticos (`Mocks`) en el frontend temporalmente, en lugar de inventar e inyectar Server Actions no autorizados.
3.  **Prohibición de "Código Zombie":** Las IAs no deben dejar código comentado, funciones sin uso, ni importar librerías que no están en el `package.json` (`npm install` debe ser consultado y consensuado entre ambos si afecta la compilación).
4.  **Tipado Estricto (TypeScript):** Se prohíbe explícitamente el uso de `any`. Las interfaces (`interfaces / types`) compartidas deben colocarse en una carpeta neutral, ej: `lib/types.ts`. Ambos pueden leerla, pero las modificaciones a contratos de datos deben ser avisadas.

---

## 🚦 3. Flujo de Trabajo y Sincronización (Git)

1.  **Comunicación por Contratos (APIs):** Antes de desarrollar una feature, Emilio y LARM2 deben acordar qué datos entrarán y saldrán (Ejemplo: *"Emilio: Envíame el formulario de BYODB a la action `connectByodb(data)` y yo te devolveré `{ success: true, error: null }`"*).
2.  **Commits Atómicos:** Los commits deben ser descriptivos y prefijados.
    *   Emilio usa: `ui:`, `feat(front):`, `style:`
    *   LARM2 usa: `api:`, `fix(back):`, `db:`
3.  **Conflictos de `package.json`:** Si Emilio necesita instalar algo visual (ej: `framer-motion`) o LARM2 necesita un paquete de servidor, deben avisarse por chat para evitar sobreescribir el `package-lock.json` al hacer `git push`.

---

## 🤝 4. Zonas de Convivencia (Archivos Compartidos)

Los siguientes archivos requieren de la coordinación de ambos y deben tocarse con precaución:

*   `app/layout.tsx`: Emilio gestiona las fuentes tipográficas y layouts visuales; LARM2 gestiona los *Providers* de contexto (ej: AuthProvider) si fuesen necesarios en el futuro.
*   `lib/types.ts` (si existe): Donde viven las interfaces compartidas (ej: `Interface UserProfile`).
*   `package.json`: Manejo de dependencias (front vs back).
