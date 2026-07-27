'use client';

import { useState } from 'react';
import { moderateCause } from '@/app/actions/moderation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Check, X, Clock, Layers, Filter, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

interface Cause {
  id: string;
  title: string;
  description: string;
  media_url: string;
  created_at: string;
  status: string;
}

export default function AdminModerationPanel({ initialCauses }: { initialCauses: Cause[] }) {
  const [causes, setCauses] = useState<Cause[]>(initialCauses);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<{ [key: string]: string }>({});
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [actionError, setActionError] = useState<string | null>(null); // ✅ FIX W-5: replace alert()

  const handleModerate = async (causeId: string, decision: 'approved' | 'rejected') => {
    setProcessingId(causeId);
    setActionError(null);
    const reason = rejectionReason[causeId] || '';
    
    const result = await moderateCause(causeId, decision, reason);

    if (result.success) {
      setCauses((prev) =>
        prev.map((c) => (c.id === causeId ? { ...c, status: decision } : c))
      );
    } else {
      // ✅ FIX W-5: inline error state instead of blocking alert()
      setActionError(result.error || 'Error desconocido al moderar.');
    }
    setProcessingId(null);
  };

  const filteredCauses = causes.filter(c => {
    if (filter === 'pending') return c.status === 'draft' || c.status === 'pending_moderation';
    if (filter === 'approved') return c.status === 'approved';
    if (filter === 'rejected') return c.status === 'rejected';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Toolbar de Filtros de Estado */}
      <div className="bg-[#D9D9D9] border border-black/5 rounded-[24px] p-3 flex flex-wrap items-center gap-2 shadow-sm">
        {(['all', 'pending', 'approved', 'rejected'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
              filter === tab
                ? 'bg-black text-white shadow-sm'
                : 'bg-white/60 text-black hover:bg-white'
            }`}
          >
            {tab === 'all' && (
              <>
                <Layers className="w-3.5 h-3.5" />
                <span>Todos ({causes.length})</span>
              </>
            )}
            {tab === 'pending' && (
              <>
                <Clock className="w-3.5 h-3.5" />
                <span>Pendientes ({causes.filter(c => c.status === 'draft' || c.status === 'pending_moderation').length})</span>
              </>
            )}
            {tab === 'approved' && (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Aprobados ({causes.filter(c => c.status === 'approved').length})</span>
              </>
            )}
            {tab === 'rejected' && (
              <>
                <XCircle className="w-3.5 h-3.5" />
                <span>Rechazados ({causes.filter(c => c.status === 'rejected').length})</span>
              </>
            )}
          </button>
        ))}
      </div>

      {/* ✅ FIX W-5: Error banner inline — no alert() */}
      {actionError && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="flex items-start gap-3 bg-rose-50 border border-rose-200 text-rose-900 rounded-[20px] p-4 shadow-sm"
        >
          <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs font-bold leading-relaxed">{actionError}</p>
          </div>
          <button
            onClick={() => setActionError(null)}
            className="text-rose-400 hover:text-rose-700 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}

      {/* Grid de Contenidos Animado */}
      {filteredCauses.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#D9D9D9] border border-black/10 rounded-[28px] p-12 text-center space-y-3 shadow-sm"
        >
          <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mx-auto shadow-sm">
            <Filter className="w-8 h-8 text-black/60" />
          </div>
          <h3 className="nuh-title text-xl font-black text-black uppercase tracking-tight">No hay causas para mostrar</h3>
          <p className="text-xs text-[#666666] font-semibold max-w-sm mx-auto">
            Selecciona otro filtro o sube nuevos borradores desde el Editor del Dashboard.
          </p>
        </motion.div>
      ) : (
        <motion.div
          initial="hidden"
          animate="show"
          variants={{
            hidden: { opacity: 0 },
            show: { opacity: 1, transition: { staggerChildren: 0.08 } },
          }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredCauses.map((cause) => (
            <motion.div
              key={cause.id}
              variants={{
                hidden: { opacity: 0, y: 20, scale: 0.96 },
                show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.35 } },
              }}
              whileHover={{ y: -4, scale: 1.01 }}
              className="bg-[#D9D9D9] border border-black/10 rounded-[28px] p-5 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between"
            >
              <div className="space-y-4">
                {/* Media Preview */}
                <div className="relative aspect-video rounded-[20px] bg-black/10 overflow-hidden border border-black/5 shadow-inner">
                  {cause.media_url ? (
                    cause.media_url.endsWith('.mp4') || cause.media_url.endsWith('.mov') ? (
                      <video src={cause.media_url} className="w-full h-full object-cover" controls />
                    ) : (
                      <Image src={cause.media_url} alt={cause.title} fill className="object-cover" unoptimized />
                    )
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-black/40 font-bold">
                      Sin archivo adjunto
                    </div>
                  )}

                  {/* Badge de Estado */}
                  <div className="absolute top-3 right-3">
                    <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-sm ${
                      cause.status === 'approved' ? 'bg-emerald-600 text-white' :
                      cause.status === 'rejected' ? 'bg-rose-600 text-white' :
                      'bg-black text-white'
                    }`}>
                      {cause.status}
                    </span>
                  </div>
                </div>

                {/* Info Text */}
                <div className="bg-white/80 rounded-[20px] p-4 space-y-2 border border-black/5">
                  <h3 className="text-base font-black text-black leading-snug truncate">{cause.title}</h3>
                  <p className="text-xs text-[#555555] font-medium line-clamp-2 leading-relaxed">
                    {cause.description || 'Sin descripción redactada.'}
                  </p>
                  <p className="text-[10px] text-[#888888] font-bold">
                    Creado: {new Date(cause.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>

              {/* Acciones de Moderación */}
              <div className="pt-4 border-t border-black/10 mt-4 space-y-3">
                {cause.status !== 'approved' && (
                  <button
                    onClick={() => handleModerate(cause.id, 'approved')}
                    disabled={processingId === cause.id}
                    className="w-full py-3 px-4 rounded-full bg-black text-white hover:bg-neutral-800 disabled:opacity-50 text-xs font-black uppercase tracking-wider transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                  >
                    <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
                    <span>Aprobar Causa</span>
                  </button>
                )}

                {cause.status !== 'rejected' && (
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Motivo del rechazo (opcional)"
                      value={rejectionReason[cause.id] || ''}
                      onChange={(e) => setRejectionReason({ ...rejectionReason, [cause.id]: e.target.value })}
                      className="w-full px-4 py-2 rounded-xl bg-white/80 border border-black/10 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-black text-black"
                    />
                    <button
                      onClick={() => handleModerate(cause.id, 'rejected')}
                      disabled={processingId === cause.id}
                      className="w-full py-2.5 px-4 rounded-full bg-rose-600 hover:bg-rose-700 text-white disabled:opacity-50 text-xs font-black uppercase tracking-wider transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                    >
                      <X className="w-4 h-4 stroke-[3]" />
                      <span>Rechazar</span>
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
