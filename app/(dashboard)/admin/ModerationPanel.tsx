'use client';

import { useState } from 'react';
import { moderateCause } from '@/app/actions/moderation';
import Image from 'next/image';

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
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<{ [key: string]: string }>({});
  const [showRejectInput, setShowRejectInput] = useState<{ [key: string]: boolean }>({});

  const handleModerate = async (id: string, decision: 'approved' | 'rejected') => {
    if (decision === 'rejected' && !rejectReason[id]) {
      setShowRejectInput(prev => ({ ...prev, [id]: true }));
      return;
    }

    setLoadingId(id);
    const res = await moderateCause(id, decision, rejectReason[id]);
    setLoadingId(null);

    if (res.success) {
      setCauses(prev => prev.filter(c => c.id !== id));
    } else {
      alert(`Error: ${res.error}`);
    }
  };

  if (causes.length === 0) {
    return (
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-12 text-center shadow-xl">
        <svg className="w-16 h-16 text-white/20 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5 13l4 4L19 7" />
        </svg>
        <h3 className="text-lg font-bold text-white/80">Todo al día</h3>
        <p className="text-sm text-white/40 mt-1">No hay causas pendientes por moderar en este momento.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {causes.map(cause => (
        <div key={cause.id} className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-xl flex flex-col group hover:border-white/20 transition-all">
          
          {/* Media Preview */}
          <div className="relative w-full h-48 bg-[#0a0a0a]">
            {cause.media_url.endsWith('.mp4') || cause.media_url.endsWith('.mov') ? (
              <video src={cause.media_url} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" controls />
            ) : (
              <Image src={cause.media_url} alt={cause.title} fill className="object-cover opacity-80 group-hover:opacity-100 transition-opacity" unoptimized />
            )}
            <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/10">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Pendiente</span>
            </div>
          </div>

          {/* Info */}
          <div className="p-5 flex-1 flex flex-col">
            <h3 className="text-base font-bold text-white truncate">{cause.title}</h3>
            <p className="text-xs text-white/50 mt-1 line-clamp-2">{cause.description}</p>
            <div className="mt-3 text-[10px] text-white/30 font-mono">
              {new Date(cause.created_at).toLocaleString()}
            </div>

            <div className="mt-auto pt-5">
              {showRejectInput[cause.id] ? (
                <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
                  <input
                    type="text"
                    autoFocus
                    placeholder="Escribe la razón del rechazo..."
                    className="w-full bg-black/40 border border-red-500/30 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-red-500/70"
                    value={rejectReason[cause.id] || ''}
                    onChange={(e) => setRejectReason(prev => ({ ...prev, [cause.id]: e.target.value }))}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleModerate(cause.id, 'rejected')}
                      disabled={loadingId === cause.id || !rejectReason[cause.id]}
                      className="flex-1 bg-red-500/20 text-red-400 hover:bg-red-500/30 disabled:opacity-50 border border-red-500/20 text-sm font-semibold rounded-xl py-2 transition-all"
                    >
                      {loadingId === cause.id ? 'Rechazando...' : 'Confirmar Rechazo'}
                    </button>
                    <button
                      onClick={() => setShowRejectInput(prev => ({ ...prev, [cause.id]: false }))}
                      className="px-4 bg-white/5 text-white/60 hover:text-white border border-white/10 rounded-xl text-sm font-semibold transition-all"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-3">
                  <button
                    onClick={() => handleModerate(cause.id, 'approved')}
                    disabled={loadingId === cause.id}
                    className="flex-1 bg-green-500/20 text-green-400 hover:bg-green-500/30 disabled:opacity-50 border border-green-500/20 text-sm font-semibold rounded-xl py-2.5 transition-all flex items-center justify-center gap-2"
                  >
                    {loadingId === cause.id ? (
                      <span className="w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Aprobar
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setShowRejectInput(prev => ({ ...prev, [cause.id]: true }))}
                    disabled={loadingId === cause.id}
                    className="flex-1 bg-red-500/10 text-red-400/80 hover:bg-red-500/20 disabled:opacity-50 border border-red-500/20 text-sm font-semibold rounded-xl py-2.5 transition-all flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Rechazar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
