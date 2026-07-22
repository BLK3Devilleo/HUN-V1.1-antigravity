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
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<{ [key: string]: string }>({});
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  const handleModerate = async (causeId: string, decision: 'approved' | 'rejected') => {
    setProcessingId(causeId);
    const reason = rejectionReason[causeId] || '';
    
    const result = await moderateCause(causeId, decision, reason);

    if (result.success) {
      setCauses((prev) =>
        prev.map((c) => (c.id === causeId ? { ...c, status: decision } : c))
      );
    } else {
      alert(`Error al moderar: ${result.error}`);
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
      {/* Filtros de Estado */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-2.5 rounded-full shadow-sm">
        {(['all', 'pending', 'approved', 'rejected'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
              filter === tab
                ? 'bg-black text-white shadow-md'
                : 'text-gray-600 hover:text-black hover:bg-gray-100'
            }`}
          >
            {tab === 'all' && `Todos (${causes.length})`}
            {tab === 'pending' && `Pendientes (${causes.filter(c => c.status === 'draft' || c.status === 'pending_moderation').length})`}
            {tab === 'approved' && `Aprobados (${causes.filter(c => c.status === 'approved').length})`}
            {tab === 'rejected' && `Rechazados (${causes.filter(c => c.status === 'rejected').length})`}
          </button>
        ))}
      </div>

      {/* Lista de Contenidos */}
      {filteredCauses.length === 0 ? (
        <div className="bg-white rounded-[30px] p-12 text-center shadow-lg border border-white/50">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-900">No hay causas para mostrar</h3>
          <p className="text-xs text-gray-500 mt-1">Selecciona otro filtro o sube nuevo contenido desde el Dashboard.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCauses.map((cause) => (
            <div
              key={cause.id}
              className="bg-white rounded-[30px] p-6 shadow-xl border border-white/50 flex flex-col justify-between hover:shadow-2xl transition-all duration-300"
            >
              <div className="space-y-4">
                {/* Media preview */}
                <div className="relative aspect-video rounded-2xl bg-gray-100 overflow-hidden border border-gray-200">
                  {cause.media_url ? (
                    cause.media_url.endsWith('.mp4') || cause.media_url.endsWith('.mov') ? (
                      <video src={cause.media_url} className="w-full h-full object-cover" controls />
                    ) : (
                      <Image src={cause.media_url} alt={cause.title} fill className="object-cover" unoptimized />
                    )
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                      Sin multimedia
                    </div>
                  )}
                  
                  {/* Badge de Estado */}
                  <span className={`absolute top-3 right-3 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-md ${
                    cause.status === 'approved' ? 'bg-emerald-500 text-white' :
                    cause.status === 'rejected' ? 'bg-rose-500 text-white' :
                    'bg-amber-400 text-black'
                  }`}>
                    {cause.status}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-extrabold text-gray-900 line-clamp-1">{cause.title}</h3>
                  <p className="text-xs text-gray-600 line-clamp-2 mt-1 font-medium">{cause.description}</p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100 space-y-3">
                {cause.status !== 'approved' && (
                  <input
                    type="text"
                    placeholder="Motivo de rechazo (opcional)..."
                    value={rejectionReason[cause.id] || ''}
                    onChange={(e) => setRejectionReason({ ...rejectionReason, [cause.id]: e.target.value })}
                    className="w-full px-4 py-2 text-xs bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-black"
                  />
                )}

                <div className="flex gap-2">
                  <button
                    disabled={processingId === cause.id || cause.status === 'approved'}
                    onClick={() => handleModerate(cause.id, 'approved')}
                    className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-full shadow-md hover:scale-105 transition-all"
                  >
                    {processingId === cause.id ? 'Procesando...' : 'Aprobar'}
                  </button>
                  <button
                    disabled={processingId === cause.id || cause.status === 'rejected'}
                    onClick={() => handleModerate(cause.id, 'rejected')}
                    className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-full shadow-md hover:scale-105 transition-all"
                  >
                    Rechazar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
