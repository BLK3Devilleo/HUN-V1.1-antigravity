'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

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

  return (
    <div className="space-y-6">
      {/* Controles de Filtros */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-3 rounded-full shadow-md">
        <div className="flex items-center gap-2">
          {(['all', 'image', 'video'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-5 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all ${
                filterType === type
                  ? 'bg-black text-white shadow-sm'
                  : 'text-gray-600 hover:text-black hover:bg-gray-100'
              }`}
            >
              {type === 'all' && `Todos los Medios (${items.length})`}
              {type === 'image' && `Imágenes (${items.filter(i => !isVideo(i.media_url)).length})`}
              {type === 'video' && `Videos (${items.filter(i => isVideo(i.media_url)).length})`}
            </button>
          ))}
        </div>

        <Link
          href="/dashboard"
          className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xs font-extrabold uppercase tracking-wider transition-all hover:scale-105 shadow-md flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Subir Nuevo Recurso
        </Link>
      </div>

      {/* Grid de Galería */}
      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-[35px] p-16 text-center shadow-xl border border-white/50 space-y-4">
          <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto">
            <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-black text-gray-900">Tu Galería está Vacía</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto font-medium">
            Los archivos multimedia que subas a través del Dashboard o Cloudflare R2 aparecerán aquí listos para tus publicaciones.
          </p>
          <div className="pt-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center px-6 py-3 rounded-full bg-black text-white font-bold text-xs uppercase tracking-wider hover:bg-gray-800 transition-all hover:scale-105 shadow-md"
            >
              Ir a Subir Archivos
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedItem(item)}
              className="group relative bg-white border border-white/60 rounded-[24px] overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer flex flex-col"
            >
              <div className="relative w-full pt-[100%] bg-gray-100 overflow-hidden">
                {isVideo(item.media_url) ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-black">
                    <video src={item.media_url} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute w-10 h-10 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center group-hover:scale-110 transition-transform">
                      <svg className="w-5 h-5 text-black translate-x-0.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                ) : (
                  <Image
                    src={item.media_url}
                    alt={item.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    unoptimized
                  />
                )}
                
                {/* Badge Status */}
                <div className="absolute top-2 right-2">
                  <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-md backdrop-blur-md ${
                    item.status === 'approved' ? 'bg-emerald-500 text-white' :
                    item.status === 'draft' ? 'bg-amber-400 text-black' :
                    'bg-black/60 text-white'
                  }`}>
                    {item.status}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-white">
                <p className="text-xs font-extrabold text-gray-900 truncate">{item.title}</p>
                <p className="text-[10px] text-gray-500 font-bold mt-0.5">
                  {new Date(item.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox / Preview Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-[35px] max-w-2xl w-full overflow-hidden shadow-2xl border border-white/40 animate-in fade-in zoom-in duration-200">
            {/* Header Modal */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-black text-gray-900">{selectedItem.title}</h3>
                <p className="text-xs text-gray-500 font-medium">Estado: <span className="font-bold uppercase text-black">{selectedItem.status}</span></p>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-700 transition-colors font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {/* Media Area */}
            <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
              {isVideo(selectedItem.media_url) ? (
                <video src={selectedItem.media_url} className="max-h-full max-w-full" controls autoPlay />
              ) : (
                <Image src={selectedItem.media_url} alt={selectedItem.title} fill className="object-contain" unoptimized />
              )}
            </div>

            {/* Actions */}
            <div className="p-6 bg-gray-50 flex items-center justify-between">
              <a
                href={selectedItem.media_url}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-extrabold text-blue-600 hover:underline flex items-center gap-1"
              >
                Abrir archivo original ↗
              </a>
              <Link
                href="/dashboard"
                onClick={() => setSelectedItem(null)}
                className="px-6 py-2.5 bg-black hover:bg-gray-800 text-white rounded-full text-xs font-extrabold uppercase tracking-wider transition-all hover:scale-105 shadow-md"
              >
                Usar en Editor de Publicaciones
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
