'use client';

import { useCallback, useState } from 'react';
import { useR2Upload } from '@/hooks/useR2Upload';

/**
 * Subida completa de medios: R2 + registro en base de datos.
 *
 * `useR2Upload` solo sube el binario a R2; el archivo quedaba huérfano porque
 * nadie llamaba después a `saveMediaRecord`. Este hook encadena los dos pasos
 * para que la UI no tenga que orquestarlos:
 *
 *   1. `POST /api/r2/presign` → URL firmada (la organización sale de la sesión)
 *   2. `PUT` directo a R2 (el binario no pasa por nuestro servidor)
 *   3. `saveMediaRecord()` → fila en `causes` con `status: 'draft'`
 *
 * Solo tras el paso 3 el archivo aparece en la galería, que lee de la base de
 * datos. Sin él, la subida "funciona" pero no deja rastro.
 */

export interface UploadedMedia {
  /** URL pública y permanente en R2. Sustituye a los `blob:` efímeros. */
  url: string;
  fileName: string;
  /** Id de la fila creada en `causes`. */
  causeId?: string;
  isVideo: boolean;
}

export interface MediaUploadError {
  fileName: string;
  error: string;
}

export interface UploadBatchResult {
  uploaded: UploadedMedia[];
  errors: MediaUploadError[];
}

export function useMediaUpload() {
  const { uploadFile, progress } = useR2Upload();

  const [isUploading, setIsUploading] = useState(false);
  /** Índice del archivo en curso (1-based) y total, para "Subiendo 2 de 5". */
  const [currentIndex, setCurrentIndex] = useState(0);
  const [totalFiles, setTotalFiles] = useState(0);
  const [errors, setErrors] = useState<MediaUploadError[]>([]);

  /**
   * Sube un único archivo y lo registra. Devuelve `null` si algo falla; el
   * detalle queda en `errors`.
   */
  const upload = useCallback(
    async (file: File): Promise<UploadedMedia | null> => {
      const result = await uploadFile(file);

      if (!result.success || !result.url) {
        const failure = { fileName: file.name, error: result.error || 'Error al subir el archivo' };
        setErrors((prev) => [...prev, failure]);
        return null;
      }

      // Registrar en BD. La importación es dinámica para no arrastrar código
      // de servidor al bundle del cliente.
      try {
        const { saveMediaRecord } = await import('@/app/actions/media');
        const saved = await saveMediaRecord(result.url, file.name);

        if (!saved.success) {
          // El binario sí está en R2, pero sin fila en BD no aparecerá en la
          // galería. Se informa en lugar de fingir que todo fue bien.
          const failure = {
            fileName: file.name,
            error: saved.error || 'El archivo se subió pero no se pudo registrar',
          };
          setErrors((prev) => [...prev, failure]);
          return null;
        }

        return {
          url: result.url,
          fileName: file.name,
          causeId: saved.causeId,
          isVideo: file.type.startsWith('video/'),
        };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Error registrando el archivo';
        setErrors((prev) => [...prev, { fileName: file.name, error: message }]);
        return null;
      }
    },
    [uploadFile]
  );

  /**
   * Sube varios archivos en serie.
   *
   * En serie a propósito: en paralelo, N vídeos saturan la subida del cliente
   * y el progreso deja de ser interpretable. Un fallo no aborta el lote.
   */
  const uploadMany = useCallback(
    async (files: File[] | FileList): Promise<UploadBatchResult> => {
      const list = Array.from(files);
      if (list.length === 0) return { uploaded: [], errors: [] };

      setIsUploading(true);
      setErrors([]);
      setTotalFiles(list.length);

      const uploaded: UploadedMedia[] = [];
      const batchErrors: MediaUploadError[] = [];

      try {
        for (let i = 0; i < list.length; i++) {
          setCurrentIndex(i + 1);
          const file = list[i];
          const before = uploaded.length;
          const item = await upload(file);

          if (item) {
            uploaded.push(item);
          } else if (uploaded.length === before) {
            batchErrors.push({ fileName: file.name, error: 'No se pudo subir' });
          }
        }
      } finally {
        setIsUploading(false);
        setCurrentIndex(0);
        setTotalFiles(0);
      }

      return { uploaded, errors: batchErrors };
    },
    [upload]
  );

  return {
    /** Sube y registra un archivo. */
    upload,
    /** Sube y registra varios archivos en serie. */
    uploadMany,
    isUploading,
    /** Progreso del archivo actual (0-100). */
    progress,
    currentIndex,
    totalFiles,
    errors,
  };
}
