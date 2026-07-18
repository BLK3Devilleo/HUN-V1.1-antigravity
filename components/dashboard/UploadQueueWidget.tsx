'use client';

import { motion } from 'framer-motion';

interface UploadItem {
  id: string;
  name: string;
  thumbnailUrl?: string;
  status: 'uploading' | 'done' | 'failed';
  progress?: number;
}

const DEMO_ITEMS: UploadItem[] = [
  { id: '1', name: 'Contenido sob...', thumbnailUrl: '/placeholder-nature.jpg', status: 'done' },
];

const DEMO_QUEUE_COUNT = 12;
const DEMO_FAILED_COUNT = 1;

export default function UploadQueueWidget() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      whileHover={{ y: -4, boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)' }}
      className="border border-white/20"
      style={{
        background: 'rgba(217, 217, 217, 0.4)', // Gris Plata medio semi-transparente
        backdropFilter: 'blur(24px) saturate(1.5)',
        WebkitBackdropFilter: 'blur(24px) saturate(1.5)',
        borderRadius: 'var(--nuh-radius-xl)', // border-radius 24px
        overflow: 'hidden',
        width: '100%',
        maxWidth: '240px', // Reducido un poco el ancho
      }}
    >
      {/* Header */}
      <div className="px-5 pt-4 pb-2.5 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-[#FF4D4D] animate-pulse" />
        <span className="text-xs font-bold text-[#000000] uppercase tracking-wider">
          Subidas en fila
        </span>
      </div>

      {/* Preview de archivo - Separado del título en exactamente 16px (mt-4 = 16px) */}
      <div className="px-4 pb-4 mt-4">
        <div
          className="w-full aspect-[4/3] rounded-xl overflow-hidden bg-gradient-to-br from-green-300 to-emerald-400 relative border border-white/20 shadow-inner"
        >
          {/* Ilustración de planta simplificada */}
          <div className="absolute inset-0 flex items-center justify-center select-none mix-blend-overlay">
            <svg viewBox="0 0 100 100" className="w-16 h-16 opacity-90">
              <path d="M50,85 C50,55 35,40 25,50 C15,60 30,85 50,85 Z" fill="#1b5e20" />
              <path d="M50,85 C50,55 65,40 75,50 C85,60 70,85 50,85 Z" fill="#2e7d32" />
              <path d="M50,85 C50,45 45,30 50,15 C55,30 50,45 50,85 Z" stroke="#81c784" strokeWidth="3" fill="none" />
            </svg>
          </div>

          {/* Tres dots de carga */}
          <div className="absolute top-3 right-3 flex gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-white/80" />
            <div className="w-1.5 h-1.5 rounded-full bg-white/80 animate-bounce delay-75" />
            <div className="w-1.5 h-1.5 rounded-full bg-white/80" />
          </div>
        </div>

        {/* Caption */}
        {/* El texto "Contenido sob..." se corta exactamente en el carácter 17 */}
        <p className="text-xs font-bold text-[#000000] mt-2.5 truncate drop-shadow-sm">
          {"Contenido sob...".substring(0, 17)}
        </p>
        <p className="text-[10px] font-semibold text-[var(--nuh-text-secondary)] mt-0.5">
          Cargando {DEMO_QUEUE_COUNT} más...
        </p>
      </div>

      {/* Banner de error - Altura 40px y color #FF4D4D */}
      {DEMO_FAILED_COUNT > 0 && (
        <button
          className="w-full text-center text-xs font-bold text-white transition-all hover:brightness-110 active:scale-95 flex items-center justify-center"
          style={{
            height: '40px',
            background: 'rgba(255, 77, 77, 0.9)', // Rojo Carmín ligeramente transparente
            backdropFilter: 'blur(10px)',
          }}
        >
          Falló {DEMO_FAILED_COUNT} archivo
        </button>
      )}
    </motion.div>
  );
}
