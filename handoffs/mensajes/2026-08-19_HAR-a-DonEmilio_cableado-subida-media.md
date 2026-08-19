# 📨 HAR → Don Emilio — Cableado de la subida de media (backend listo)

| Campo | Valor |
|---|---|
| **De** | HAR (Jefe de Cocina — backend/conectividad) |
| **Para** | Don Emilio (par — frontend/UI) |
| **Fecha** | 2026-08-19 |
| **Asunto** | La subida de archivos no persiste: backend ya listo, falta 1 cable en tu zona |
| **Requiere acción tuya** | Sí (es tu zona congelada; yo no la toco) |

---

## 1. Antes que nada: tu diseño está intacto ✋

Sé que has visto cambios en el repo y quiero quitarte la duda de encima. **No he tocado ni un
píxel.** Lo verifiqué de tres formas:

| Comprobación | Resultado |
|---|---|
| Commits sobre `components/`, `globals.css`, `layout.tsx` | **0** — nunca tocados |
| Líneas con `className`/`style`/`padding`/`margin`/`gap` en mi diff | **Ninguna** |
| Hash de clases CSS por página vs. `main` | **142 clases idénticas** |

```
✅ admin: IDÉNTICAS (22)    ✅ profile: IDÉNTICAS (34)
✅ feed: IDÉNTICAS (13)     ✅ settings: IDÉNTICAS (60)
✅ gallery: IDÉNTICAS (13)
```

En esas 5 páginas solo cambié **imports y la resolución de identidad** (de dónde sale el `orgId`).
Todo el JSX, los `vh/vw`, los `rounded-[28px]` y los gradientes siguen exactamente como los dejaste.

---

## 2. El problema que hay que resolver

El Usuario lo describió así: *"agregar imagen en galería me manda a dashboard"*. Al investigarlo
salió algo más profundo. **La subida de archivos no persiste en ningún sitio.**

### Qué pasa hoy

```
Galería → botón "Subir Nuevo Recurso"
              ↓  (es un <Link href="/dashboard">)
         Dashboard → input file → handleFileSelect
              ↓
         URL.createObjectURL(file)   ← blob: efímero, solo vive en esa pestaña
              ↓
         mediaUrls: ['blob:http://localhost/a1b2...']
              ↓
         publishPostAction → n8n   ← el servidor NO puede leer un blob:
```

Consecuencias:

1. **El archivo nunca llega a R2.** `useR2Upload` existe pero no lo llama nadie.
2. **Nada se guarda en base de datos.** Por eso la galería siempre sale vacía: lee de
   `causes.media_url`, y ahí no se escribe nunca.
3. **Al recargar, las imágenes desaparecen.** El `blob:` muere con la pestaña.
4. Mi validación en el servidor descarta esas URLs (`publish.media_skipped`), así que la
   publicación sale sin imagen.

> **Aviso honesto:** esto **no lo rompiste tú, ni yo**. Viene de antes: el hook se escribió pero
> nunca se conectó. Además tenía un bug que ya he corregido (ver §4).

---

## 3. Lo que ya te he dejado hecho (backend)

No tienes que orquestar nada. Te he preparado **un hook que hace todo el flujo en una llamada**:

**`hooks/useMediaUpload.ts`** → sube a R2 **y** registra en base de datos.

```
1. POST /api/r2/presign   → URL firmada (el orgId sale de la sesión, no lo mandas tú)
2. PUT directo a R2       → el binario NO pasa por nuestro servidor
3. saveMediaRecord()      → fila en `causes` con status 'draft'
```

Solo tras el paso 3 el archivo aparece en la galería.

### API del hook

```ts
const {
  upload,        // (file: File) => Promise<UploadedMedia | null>
  uploadMany,    // (files: File[] | FileList) => Promise<UploadBatchResult>
  isUploading,   // boolean
  progress,      // 0-100 del archivo actual (progreso REAL, no simulado)
  currentIndex,  // 2  ← para "Subiendo 2 de 5"
  totalFiles,    // 5
  errors,        // [{ fileName, error }]
} = useMediaUpload();
```

`UploadedMedia` trae: `{ url, fileName, causeId, isVideo }`. El `url` es la **URL pública y
permanente de R2**, la que debe sustituir al `blob:`.

---

## 4. Dónde va el cable exactamente

**Archivo:** `app/(dashboard)/dashboard/page.tsx` · **línea 108** · función `handleFileSelect`

### Cómo está ahora

```tsx
const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
  if (e.target.files && e.target.files.length > 0) {
    const newFiles = Array.from(e.target.files).map((file) => ({
      file,
      url: URL.createObjectURL(file),   // ← efímero: aquí se pierde todo
      isVideo: file.type.startsWith('video/'),
    }));
    setSelectedFiles((prev) => [...prev, ...newFiles]);
  }
};
```

### La idea (adáptala a tu gusto, el diseño es tuyo)

```tsx
const { uploadMany, isUploading, progress, currentIndex, totalFiles } = useMediaUpload();

const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const files = e.target.files;
  if (!files || files.length === 0) return;

  // 1) Preview instantáneo con blob: la UI no se queda congelada esperando.
  const previews = Array.from(files).map((file) => ({
    file,
    url: URL.createObjectURL(file),
    isVideo: file.type.startsWith('video/'),
    pending: true,
  }));
  setSelectedFiles((prev) => [...prev, ...previews]);

  // 2) Subida real en segundo plano.
  const { uploaded, errors } = await uploadMany(files);

  // 3) Cambiar el blob: por la URL permanente de R2.
  setSelectedFiles((prev) =>
    prev.map((item) => {
      const match = uploaded.find((u) => u.fileName === item.file.name);
      return match ? { ...item, url: match.url, pending: false } : item;
    })
  );

  e.target.value = ''; // permite volver a elegir el mismo archivo
};
```

**Importante:** el paso 3 es el que de verdad arregla la publicación. Mientras `selectedFiles`
contenga `blob:`, lo que llega a `publishPostAction` sigue siendo inservible para el servidor.

> 🐛 **Bug que ya corregí en `useR2Upload`:** leía `{ url }` de la respuesta del presign, pero la
> API devuelve `{ uploadUrl }`. Era `undefined`, así que el `PUT` se hacía contra la propia página
> y **el archivo nunca llegaba a R2**. Si alguna vez probaste a subir y "no pasaba nada", era esto.
> Ya está arreglado, y el progreso ahora es real (`XMLHttpRequest`) en vez de saltar de 30 a 100.

---

## 5. El botón de la galería (decisión tuya + del Usuario)

`components/dashboard/GalleryWorkspace.tsx` tiene **dos** enlaces que llevan al dashboard:

| Línea | Texto |
|---|---|
| 76 | "Subir Nuevo Recurso" |
| 103 | "Ir a Subir Archivos" (estado vacío) |

```tsx
<Link href="/dashboard">    ← navega, no sube
  <Plus /> <span>Subir Nuevo Recurso</span>
</Link>
```

Son originales tuyos, no una regresión. Pero el texto promete subir y lo que hace es navegar —
de ahí la confusión del Usuario. Dos caminos:

- **A) Subida propia en la galería.** Cambiar el `<Link>` por un `<button>` con su `input file`
  oculto y `useMediaUpload`. Es la que espera el Usuario, y ya tienes el hook listo.
- **B) Dejar la navegación.** Entonces el texto debería decir algo como "Ir al Dashboard".

Yo recomiendo la **A**, pero es tu zona: decides tú.

Para refrescar el listado tras subir tienes **`getGalleryItems()`** en `app/actions/gallery.ts`
(devuelve `{ items, failed }`). Así no hace falta recargar la página entera.

---

## 6. Cómo probar que funciona

1. Sube una imagen desde el dashboard.
2. **Consola del navegador:** en Red debe aparecer `POST /api/r2/presign` → `200`, y luego un
   `PUT` a `r2.cloudflarestorage.com` → `200`.
3. **Logs del servidor:** `action.media_save.ok`.
4. **Recarga `/dashboard/gallery`:** la imagen debe seguir ahí. Esa es la prueba de fuego —
   si sobrevive a la recarga, la persistencia funciona.

Si el paso 2 da `401`, es que no hay sesión iniciada (correcto: el `orgId` sale de la sesión).

---

## 7. Resumen

| Tarea | Quién |
|---|---|
| Backend R2 + presign + registro en BD | ✅ HAR (hecho y verificado) |
| `useMediaUpload` listo para usar | ✅ HAR (hecho) |
| `getGalleryItems()` para refrescar | ✅ HAR (hecho) |
| **Cablear `handleFileSelect`** | ⬜ **Don Emilio** |
| **Decidir el botón de la galería** | ⬜ **Don Emilio + Usuario** |

Cualquier cosa que necesites del backend (otro endpoint, otro campo, borrar un recurso), pídemela
y la preparo. No entro en tu zona.

— **HAR**
