# 📝 Homework & Hoja de Ruta de Desarrollo — HUN MVP v1.1

---

## 📌 Roles y División de Trabajo
- **Don Emilio (Frontend Master)**: Diseña, pule y mantiene la interfaz gráfica (UI/UX), componentes visuales (`components/dashboard/*`), layouts y estilos CSS.
- **Usuario / Backend & Integración (Next.js 16 Backend & Proxy)**: Lógica del servidor, Server Actions, Proxy/Middleware, conexión con Supabase Central, R2 Storage y base de datos local MVP.
- **AI Agent (Antigravity)**: Asistencia técnica siguiendo las 6 skills obligatorias del proyecto.

---

## 🛡️ Regla de Invariantes (Invariant Guard)
> **ZONA CONGELADA / FRONTEND DE DON EMILIO**:
> Ningún componente visual del frontend diseñado por Don Emilio (`components/dashboard/PostEditorWorkspace.tsx`, `UploadQueueWidget.tsx`, `ConversationsSidebar.tsx`, `FolderCard.tsx`, `app/globals.css`, etc.) debe ser modificado estructuralmente o roto por la IA.
> La lógica de backend (Proxy, APIs, Server Actions) debe acoplarse de forma transparente a las props e interfaces de estos componentes.

---

## 📋 Tareas Pendientes y Registro de Cambios (Homework)

### 1. ✅ Pull y Análisis de Cambios del Repositorio (Completado)
- **Repositorio**: `https://github.com/BLK3Devilleo/HUN-V1.1-antigravity.git` (`main`)
- **Estado**: Pull ejecutado con éxito (Fast-forward `9cfa211..99ff290`).
- **Archivos Actualizados por Don Emilio**:
  1. `components/dashboard/PostEditorWorkspace.tsx` (+448 líneas) — Rediseño completo del espacio de edición de contenido.
  2. `components/dashboard/UploadQueueWidget.tsx` (+173 líneas) — Nueva interfaz de cola de subida.
  3. `components/dashboard/ConversationsSidebar.tsx` — Mejoras visuales en sidebar de conversaciones.
  4. `components/dashboard/FolderCard.tsx` — Peticiones y estilos visuales.
  5. `app/(dashboard)/dashboard/page.tsx` — Integración del nuevo workspace.
  6. Otros ajustados: `ContentStack.tsx`, `GalleryWorkspace.tsx`, `SocialSidebar.tsx`, `globals.css`.

---

### 2. 🎯 Tareas de Refactorización MVP Backend (Siguientes Pasos)
- [ ] **Eliminación / Refactorización de BYODB**:
  - Eliminar referencias a funciones innecesarias como `connectByodb` en `app/actions/byodb.ts` (L114-L118) y simplificar el modelo para centrarse en el MVP directo.
- [ ] **Proxy en Next.js 16 (`proxy.ts`)**:
  - Asegurar la ejecución de `proxy.ts` como capa de red de Next.js 16 para interceptar correctamente las rutas protegidas.
  - Eliminar el bypass automático de autenticación en `localhost` en `proxy.ts` para garantizar la seguridad.
- [ ] **Corrección del RLS en Supabase Central**:
  - Corregir recursión en la política `profile_org_admin_select` de `001_schema_central.sql`.
- [ ] **CRUD REST y Server Actions (Clean Code & API Builder)**:
  - Consolidar las Server Actions de `posts`, `media` y `moderation` alineadas con las props esperadas por los nuevos componentes de Don Emilio.
