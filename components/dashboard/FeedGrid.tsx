'use client';

import { motion, type Variants } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { Share2, Layers, Sparkles } from 'lucide-react';

export interface FeedCause {
  id: string;
  title: string;
  description: string;
  media_url: string;
  created_at: string;
  total_shares: number;
  organizations?: { name: string };
}

export default function FeedGrid({ causes }: { causes: FeedCause[] }) {
  if (!causes || causes.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="col-span-full py-16 text-center bg-[#D9D9D9] border border-black/10 rounded-[28px] p-8 shadow-sm space-y-3"
      >
        <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mx-auto shadow-sm">
          <Layers className="w-8 h-8 text-black/50" />
        </div>
        <h3 className="nuh-title text-xl font-black text-black uppercase tracking-tight">
          Aún no hay contenido disponible
        </h3>
        <p className="text-xs text-[#666666] font-semibold max-w-sm mx-auto">
          Las causas aprobadas por los moderadores de las organizaciones aparecerán aquí automáticamente.
        </p>
      </motion.div>
    );
  }

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20, scale: 0.96 },
    show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.35 } },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
    >
      {causes.map((cause) => (
        <motion.div
          key={cause.id}
          variants={itemVariants}
          whileHover={{ y: -4, scale: 1.01 }}
          className="group relative bg-[#D9D9D9] border border-black/10 rounded-[28px] p-4 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
        >
          <div className="space-y-3">
            {/* Container Multimedia */}
            <div className="relative w-full aspect-square bg-black/10 rounded-[20px] overflow-hidden border border-black/5">
              {cause.media_url?.endsWith('.mp4') || cause.media_url?.endsWith('.mov') || cause.media_url?.endsWith('.webm') ? (
                <video
                  src={cause.media_url}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loop
                  muted
                  playsInline
                  autoPlay
                />
              ) : cause.media_url ? (
                <Image
                  src={cause.media_url}
                  alt={cause.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  unoptimized
                />
              ) : (
                /* ✅ FIX C-2: inline fallback — no external file needed */
                <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-black/5">
                  <svg viewBox="0 0 24 24" className="w-10 h-10 text-black/20" fill="none" stroke="currentColor" strokeWidth={1.5}>
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <path d="M3 15l5-5 4 4 3-3 4 4" />
                    <circle cx="8.5" cy="9.5" r="1.5" />
                  </svg>
                  <span className="text-[10px] font-bold text-black/30 uppercase tracking-wider">Sin imagen</span>
                </div>
              )}

              {/* Badge de Organización */}
              <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider bg-black/80 text-white px-3 py-1 rounded-full backdrop-blur-md truncate max-w-[80%] shadow-sm flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400 inline" />
                  {cause.organizations?.name || 'Organización'}
                </span>
              </div>
            </div>

            {/* Info Text */}
            <div className="bg-white/80 rounded-[18px] p-3.5 space-y-1 border border-black/5">
              <h3 className="text-sm font-black text-black leading-snug truncate">{cause.title}</h3>
              <p className="text-xs text-[#555555] font-medium line-clamp-2 leading-relaxed">
                {cause.description || 'Sin descripción redactada.'}
              </p>
            </div>
          </div>

          {/* Acciones del Feed */}
          <div className="pt-3 border-t border-black/10 mt-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[11px] font-black text-[#555555]">
              <Share2 className="w-3.5 h-3.5 text-black" />
              <span>{cause.total_shares || 0} difusiones</span>
            </div>

            <Link
              href="/dashboard"
              className="btn-crear text-[10px] font-black uppercase tracking-wider px-4 py-2 rounded-full shadow-sm hover:scale-105 active:scale-95 transition-transform"
            >
              Difundir
            </Link>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
