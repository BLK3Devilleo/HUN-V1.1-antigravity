'use client';

import { useCallback, useState } from 'react';

export interface UploadResult {
  success: boolean;
  /** URL pública del archivo ya subido a R2. */
  url?: string;
  error?: string;
}

/** Respuesta de `POST /api/r2/presign`. */
interface PresignResponse {
  uploadUrl: string;
  publicUrl: string;
  r2Path: string;
}

/**
 * Sube un archivo a Cloudflare R2 mediante URL pre-firmada.
 *
 * Flujo: `POST /api/r2/presign` → `PUT` directo a R2 (el archivo no pasa por
 * nuestro servidor) → el llamante persiste el registro con `saveMediaRecord`.
 *
 * Bug corregido: la versión anterior desestructuraba `{ url: uploadUrl }` de
 * la respuesta del presign, pero el endpoint devuelve `uploadUrl`. `url` era
 * siempre `undefined`, así que el `PUT` se hacía contra la URL actual de la
 * página y la subida nunca llegaba a R2. El progreso, además, saltaba de 30
 * a 100 sin reflejar la transferencia real.
 */
export function useR2Upload() {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const uploadFile = useCallback(async (file: File): Promise<UploadResult> => {
    setIsUploading(true);
    setProgress(0);

    try {
      // 1. Pedir la URL firmada. La organización se resuelve en el servidor
      //    a partir de la sesión; el cliente no la envía.
      const presignRes = await fetch('/api/r2/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          mimeType: file.type,
          fileSize: file.size,
        }),
      });

      if (!presignRes.ok) {
        const errData = await presignRes.json().catch(() => ({}));
        throw new Error(errData.error || 'Error al solicitar la URL de subida');
      }

      const { uploadUrl, publicUrl }: PresignResponse = await presignRes.json();
      if (!uploadUrl || !publicUrl) {
        throw new Error('El servidor no devolvió una URL de subida válida');
      }

      // 2. Subir a R2 con XMLHttpRequest para poder informar del progreso
      //    real (fetch no expone el progreso de subida).
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', uploadUrl, true);
        xhr.setRequestHeader('Content-Type', file.type);

        xhr.upload.onprogress = (evt) => {
          if (evt.lengthComputable) {
            setProgress(Math.round((evt.loaded / evt.total) * 100));
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Falló la subida a R2 (HTTP ${xhr.status})`));
          }
        };
        xhr.onerror = () => reject(new Error('Error de red al subir el archivo a R2'));
        xhr.onabort = () => reject(new Error('Subida cancelada'));

        xhr.send(file);
      });

      setProgress(100);
      return { success: true, url: publicUrl };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error desconocido al subir';
      return { success: false, error: message };
    } finally {
      setIsUploading(false);
    }
  }, []);

  return { uploadFile, isUploading, progress };
}
