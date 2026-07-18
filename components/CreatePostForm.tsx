'use client';

import { useState, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { createPost } from '@/app/actions/posts';
import type { Platform } from '@/lib/types';

// ============================================================
// Schema y tipos
// ============================================================
const schema = z.object({
  title: z.string().min(3, 'Mínimo 3 caracteres').max(200),
  caption: z.string().max(2200).optional(),
  platforms: z.array(z.enum(['instagram', 'facebook', 'linkedin', 'x', 'tiktok'])).min(1, 'Elige al menos una red'),
  scheduled_at: z.string().optional().nullable(),
});
type FormValues = z.infer<typeof schema>;

interface UploadFile {
  id: string;
  file: File;
  progress: number;  // 0–100
  status: 'pending' | 'uploading' | 'done' | 'error';
  publicUrl?: string;
  mimeType: string;
}

interface Props {
  onSuccess?: () => void;
  onClose?: () => void;
}

const PLATFORMS: { id: Platform; label: string; color: string }[] = [
  { id: 'instagram', label: 'Instagram', color: 'from-pink-500 to-purple-600' },
  { id: 'facebook', label: 'Facebook', color: 'from-blue-600 to-blue-700' },
  { id: 'linkedin', label: 'LinkedIn', color: 'from-sky-600 to-sky-700' },
  { id: 'x', label: 'X (Twitter)', color: 'from-gray-700 to-gray-900' },
  { id: 'tiktok', label: 'TikTok', color: 'from-red-500 to-pink-600' },
];

// ============================================================
// Componente principal
// ============================================================
export default function CreatePostForm({ onSuccess, onClose }: Props) {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [serverMsg, setServerMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const { register, handleSubmit, control, formState: { errors, isSubmitting }, reset } =
    useForm<FormValues>({ resolver: zodResolver(schema) });

  // Subida directa a R2 con progreso real usando XMLHttpRequest
  const uploadToR2 = useCallback(async (uploadFile: UploadFile): Promise<string | null> => {
    // 1. Pedir URL pre-firmada al servidor
    const presignRes = await fetch('/api/r2/presign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: uploadFile.file.name,
        mimeType: uploadFile.mimeType,
        fileSize: uploadFile.file.size,
      }),
    });

    if (!presignRes.ok) {
      const err = await presignRes.json();
      throw new Error(err.error ?? 'Error obteniendo URL de carga');
    }

    const { uploadUrl, publicUrl } = await presignRes.json() as { uploadUrl: string; publicUrl: string };

    // 2. Subir con XHR para trackear progreso
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const pct = Math.round((e.loaded / e.total) * 100);
          setFiles(prev =>
            prev.map(f => f.id === uploadFile.id ? { ...f, progress: pct, status: 'uploading' } : f)
          );
        }
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          setFiles(prev =>
            prev.map(f => f.id === uploadFile.id ? { ...f, progress: 100, status: 'done', publicUrl } : f)
          );
          resolve(publicUrl);
        } else {
          reject(new Error(`Upload failed: ${xhr.status}`));
        }
      };
      xhr.onerror = () => reject(new Error('Error de red durante la carga'));
      xhr.open('PUT', uploadUrl);
      xhr.setRequestHeader('Content-Type', uploadFile.mimeType);
      xhr.send(uploadFile.file);
    });
  }, []);

  const addFiles = useCallback((incoming: File[]) => {
    const newFiles: UploadFile[] = incoming.map(f => ({
      id: `${f.name}-${Date.now()}-${Math.random()}`,
      file: f,
      progress: 0,
      status: 'pending',
      mimeType: f.type,
    }));
    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const onSubmit = async (data: FormValues) => {
    setServerMsg(null);

    // Subir todos los archivos pendientes
    const uploadedUrls: string[] = [];
    const uploadedTypes: string[] = [];

    for (const uf of files) {
      if (uf.status === 'done' && uf.publicUrl) {
        uploadedUrls.push(uf.publicUrl);
        uploadedTypes.push(uf.mimeType);
        continue;
      }
      try {
        const url = await uploadToR2(uf);
        if (url) {
          uploadedUrls.push(url);
          uploadedTypes.push(uf.mimeType);
        }
      } catch {
        setFiles(prev => prev.map(f => f.id === uf.id ? { ...f, status: 'error' } : f));
        setServerMsg({ ok: false, text: `Error subiendo ${uf.file.name}` });
        return;
      }
    }

    // Guardar el post en la BD local
    const result = await createPost({
      title: data.title,
      caption: data.caption,
      platforms: data.platforms as Platform[],
      scheduled_at: data.scheduled_at || null,
      media_urls: uploadedUrls,
      media_types: uploadedTypes,
      origin: 'own',
    });

    setServerMsg({ ok: result.success, text: result.message });
    if (result.success) {
      reset();
      setFiles([]);
      onSuccess?.();
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Título */}
      <div>
        <label className="block text-xs text-white/50 uppercase tracking-widest mb-2">Título</label>
        <input
          {...register('title')}
          placeholder="Nombre del contenido…"
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 text-sm focus:outline-none focus:border-blue-500/50 transition-colors"
        />
        {errors.title && <p className="mt-1 text-xs text-red-400">{errors.title.message}</p>}
      </div>

      {/* Caption */}
      <div>
        <label className="block text-xs text-white/50 uppercase tracking-widest mb-2">Caption / Copy</label>
        <textarea
          {...register('caption')}
          rows={4}
          placeholder="Escribe el texto del post, hashtags, emojis…"
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 text-sm focus:outline-none focus:border-blue-500/50 transition-colors resize-none"
        />
        {errors.caption && <p className="mt-1 text-xs text-red-400">{errors.caption.message}</p>}
      </div>

      {/* Selector de plataformas */}
      <div>
        <label className="block text-xs text-white/50 uppercase tracking-widest mb-3">Redes Sociales</label>
        <Controller
          name="platforms"
          control={control}
          defaultValue={[]}
          render={({ field }) => (
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map(p => {
                const selected = field.value.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      const next = selected
                        ? field.value.filter((v: Platform) => v !== p.id)
                        : [...field.value, p.id];
                      field.onChange(next);
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-medium border transition-all duration-200 ${
                      selected
                        ? `bg-gradient-to-r ${p.color} border-transparent text-white shadow-lg`
                        : 'bg-white/5 border-white/10 text-white/50 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          )}
        />
        {errors.platforms && <p className="mt-1 text-xs text-red-400">{errors.platforms.message}</p>}
      </div>

      {/* Programar fecha */}
      <div>
        <label className="block text-xs text-white/50 uppercase tracking-widest mb-2">
          Programar Publicación <span className="normal-case text-white/30">(opcional)</span>
        </label>
        <input
          type="datetime-local"
          {...register('scheduled_at')}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white/80 text-sm focus:outline-none focus:border-blue-500/50 transition-colors [color-scheme:dark]"
        />
      </div>

      {/* Zona de carga de archivos */}
      <div>
        <label className="block text-xs text-white/50 uppercase tracking-widest mb-3">
          Archivos Multimedia
        </label>
        <div
          onDragOver={e => { e.preventDefault(); setIsDraggingOver(true); }}
          onDragLeave={() => setIsDraggingOver(false)}
          onDrop={e => {
            e.preventDefault();
            setIsDraggingOver(false);
            const dropped = Array.from(e.dataTransfer.files);
            addFiles(dropped);
          }}
          onClick={() => document.getElementById('file-input')?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 ${
            isDraggingOver
              ? 'border-blue-500/60 bg-blue-500/10'
              : 'border-white/10 bg-white/3 hover:border-white/20 hover:bg-white/5'
          }`}
        >
          <input
            id="file-input"
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/quicktime,video/webm"
            className="hidden"
            onChange={e => addFiles(Array.from(e.target.files ?? []))}
          />
          <div className="text-3xl mb-2">📁</div>
          <p className="text-sm text-white/50">
            Arrastra imágenes o videos aquí, o <span className="text-blue-400 underline">haz click</span>
          </p>
          <p className="text-xs text-white/25 mt-1">JPG, PNG, WEBP, GIF, MP4, MOV, WEBM — Máx 500 MB</p>
        </div>

        {/* Cola de subida con barras de progreso */}
        <AnimatePresence>
          {files.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 space-y-2"
            >
              {files.map(f => (
                <div key={f.id} className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-2.5">
                  <div className="text-lg">
                    {f.mimeType.startsWith('video') ? '🎬' : '🖼️'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white/70 truncate">{f.file.name}</p>
                    <div className="mt-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${
                          f.status === 'error' ? 'bg-red-500' :
                          f.status === 'done' ? 'bg-emerald-500' : 'bg-blue-500'
                        }`}
                        initial={{ width: '0%' }}
                        animate={{ width: `${f.progress}%` }}
                        transition={{ ease: 'linear', duration: 0.2 }}
                      />
                    </div>
                  </div>
                  <span className={`text-xs font-mono flex-shrink-0 ${
                    f.status === 'error' ? 'text-red-400' :
                    f.status === 'done' ? 'text-emerald-400' : 'text-white/40'
                  }`}>
                    {f.status === 'done' ? '✓' : f.status === 'error' ? '✗' : `${f.progress}%`}
                  </span>
                  <button
                    type="button"
                    onClick={() => setFiles(prev => prev.filter(x => x.id !== f.id))}
                    className="text-white/20 hover:text-red-400 transition-colors text-xs ml-1"
                  >✕</button>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Resultado del servidor */}
      <AnimatePresence>
        {serverMsg && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`p-4 rounded-xl text-sm ${
              serverMsg.ok
                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                : 'bg-red-500/10 border border-red-500/30 text-red-400'
            }`}
          >
            {serverMsg.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Botones */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/25"
        >
          {isSubmitting ? (
            <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Guardando…</>
          ) : 'Guardar Post'}
        </button>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-white/50 text-sm hover:text-white hover:bg-white/10 transition-all"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
