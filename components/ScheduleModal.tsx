'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

interface Props {
  onConfirm: (scheduledAt: string) => void;
  onCancel: () => void;
}

export default function ScheduleModal({ onConfirm, onCancel }: Props) {
  // Default: mañana a las 09:00
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0);
  const defaultValue = tomorrow.toISOString().slice(0, 16);

  const [value, setValue] = useState(defaultValue);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-sm backdrop-blur-xl bg-[#0d0e12]/90 border border-white/10 rounded-2xl p-6 shadow-2xl"
      >
        <div className="text-2xl mb-3">🕐</div>
        <h2 className="text-base font-bold text-white mb-1">Programar publicación</h2>
        <p className="text-xs text-white/40 mb-6">
          Elige cuándo quieres que se publique este contenido en las redes seleccionadas.
        </p>

        <label className="block text-xs text-white/50 uppercase tracking-widest mb-2">
          Fecha y hora
        </label>
        <input
          type="datetime-local"
          value={value}
          onChange={e => setValue(e.target.value)}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500/50 transition-colors [color-scheme:dark] mb-6"
        />

        <div className="flex gap-3">
          <button
            onClick={() => onConfirm(new Date(value).toISOString())}
            disabled={!value}
            className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-all duration-200 disabled:opacity-40"
          >
            Confirmar
          </button>
          <button
            onClick={onCancel}
            className="px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-white/50 text-sm hover:text-white hover:bg-white/10 transition-all"
          >
            Cancelar
          </button>
        </div>
      </motion.div>
    </div>
  );
}
