'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Image as ImageIcon, Video, Layers, Plus, ExternalLink, X, FolderOpen } from 'lucide-react';

export interface MediaItem {
  id: string;
  title: string;
  media_url: string;
  created_at: string;
  status: string;
}

export default function GalleryWorkspace({ initialItems }: { initialItems: MediaItem[] }) {
  const [items] = useState<MediaItem[]>(initialItems);
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'image' | 'video'>('all');

  const isVideo = (url: string) => url.endsWith('.mp4') || url.endsWith('.mov') || url.endsWith('.webm');

  const filteredItems = items.filter(item => {
    if (filterType === 'image') return !isVideo(item.media_url);
    if (filterType === 'video') return isVideo(item.media_url);
    return true;
  });

  const imageCount = items.filter(i => !isVideo(i.media_url)).length;
  const videoCount = items.filter(i => isVideo(i.media_url)).length;

  return (
    <div className="space-y-6">
      {/* Bento Toolbar: Filtros & Botón Crear estilo Don Emilio */}
      <div className="bg-[#D9D9D9] border border-black/5 rounded-[24px] p-3 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setFilterType('all')}
            className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
              filterType === 'all'
                ? 'bg-black text-white shadow-sm'
                : 'bg-white/60 text-black hover:bg-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Todos los Medios ({items.length})</span>
          </button>

          <button
            onClick={() => setFilterType('image')}
            className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
              filterType === 'image'
                ? 'bg-black text-white shadow-sm'
                : 'bg-white/60 text-black hover:bg-white'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Imágenes ({imageCount})</span>
          </button>

          <button
            onClick={() => setFilterType('video')}
            className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
              filterType === 'video'
                ? 'bg-black text-white shadow-sm'
                : 'bg-white/60 text-black hover:bg-white'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>Videos ({videoCount})</span>
          </button>
        </div>

        {/* Botón Crear con el gradiente característico de Don Emilio */}
        <Link
          href="/dashboard"
          className="btn-crear text-xs font-black uppercase tracking-wider px-6 py-3 rounded-full flex items-center gap-2 transition-transform active:scale-95 hover:opacity-90 shadow-md cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Subir Nuevo Recurso</span>
        </Link>
      </div>

      {/* Estado Vacío / Grid Bento */}
      {filteredItems.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#D9D9D9] border border-black/5 rounded-[28px] p-12 sm:p-16 text-center space-y-4 shadow-sm folder-shape"
        >
          <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mx-auto shadow-sm">
            <FolderOpen className="w-8 h-8 text-black/60" />
          </div>
          <h3 className="nuh-title text-2xl font-black text-black tracking-tight uppercase">
            Tu Galería está Vacía
          </h3>
          <p className="text-xs text-[#666666] max-w-md mx-auto font-medium leading-relaxed">
            Los archivos multimedia que cargues a través del Dashboard o Cloudflare R2 Storage aparecerán automáticamente organizados en este tablero Bento.
          </p>
          <div className="pt-3">
            <Link
              href="/dashboard"
              className="btn-crear inline-flex items-center gap-2 px-8 py-3 rounded-full text-xs font-black uppercase tracking-wider transition-transform active:scale-95 shadow-md"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Ir a Subir Archivos</span>
            </Link>
          </div>
        </motion.div>
      ) : (
        /* Bento Grid Layout de Archivos Animado */
        <motion.div
          initial="hidden"
          animate="show"
          variants={{
            hidden: { opacity: 0 },
            show: { opacity: 1, transition: { staggerChildren: 0.06 } },
          }}
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5"
        >
          {filteredItems.map((item) => (
            <motion.div
              key={item.id}
              variants={{
                hidden: { opacity: 0, y: 15, scale: 0.96 },
                show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.3 } },
              }}
              whileHover={{ y: -4, scale: 1.02 }}
              onClick={() => setSelectedItem(item)}
              className="group relative bg-[#D9D9D9] border border-black/10 rounded-[24px] p-3 shadow-sm hover:shadow-xl transition-all duration-200 cursor-pointer flex flex-col justify-between"
            >
              <div className="relative w-full aspect-square bg-black/10 rounded-[18px] overflow-hidden mb-3">
                {isVideo(item.media_url) ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-black">
                    <video src={item.media_url} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute w-10 h-10 rounded-full bg-white/90 flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
                      <Video className="w-5 h-5 text-black" />
                    </div>
                  </div>
                ) : (
                  <Image
                    src={item.media_url}
                    alt={item.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    unoptimized
                  />
                )}

                {/* Badge Status Bento */}
                <div className="absolute top-2.5 right-2.5">
                  <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-sm ${
                    item.status === 'approved' ? 'bg-emerald-500 text-white' :
                    item.status === 'draft' ? 'bg-amber-400 text-black' :
                    'bg-black text-white'
                  }`}>
                    {item.status}
                  </span>
                </div>
              </div>

              <div className="bg-white/80 rounded-[16px] p-3 flex items-center justify-between">
                <div className="truncate pr-2">
                  <p className="text-xs font-black text-black truncate">{item.title}</p>
                  <p className="text-[10px] text-[#666666] font-bold mt-0.5">
                    {new Date(item.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                  </p>
                </div>
                <ExternalLink className="w-4 h-4 text-black/40 group-hover:text-black flex-shrink-0 transition-colors" />
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Modal Previsualizador Bento */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#F2F2F2] rounded-[28px] max-w-2xl w-full overflow-hidden shadow-2xl border border-black/10 animate-in fade-in zoom-in duration-200">
            {/* Header Modal */}
            <div className="flex items-center justify-between p-6 bg-[#D9D9D9] border-b border-black/5">
              <div>
                <h3 className="text-lg font-black text-black tracking-tight">{selectedItem.title}</h3>
                <p className="text-xs text-[#666666] font-bold">Estado: <span className="uppercase text-black">{selectedItem.status}</span></p>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="w-9 h-9 rounded-full bg-white hover:bg-black hover:text-white flex items-center justify-center text-black transition-colors font-bold text-sm cursor-pointer shadow-sm"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Visualizador */}
            <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
              {isVideo(selectedItem.media_url) ? (
                <video src={selectedItem.media_url} className="max-h-full max-w-full" controls autoPlay />
              ) : (
                <Image src={selectedItem.media_url} alt={selectedItem.title} fill className="object-contain" unoptimized />
              )}
            </div>

            {/* Acciones */}
            <div className="p-5 bg-[#D9D9D9] flex items-center justify-between">
              <a
                href={selectedItem.media_url}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-black text-black hover:underline flex items-center gap-1.5"
              >
                <span>Abrir recurso original</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <Link
                href="/dashboard"
                onClick={() => setSelectedItem(null)}
                className="btn-crear px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition-transform active:scale-95 shadow-md"
              >
                Usar en Editor
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
