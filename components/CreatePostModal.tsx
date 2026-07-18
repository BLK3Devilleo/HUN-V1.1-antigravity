'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CreatePostForm from './CreatePostForm';

export default function CreatePostModal() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/25 hover:scale-[1.02]"
      >
        <span className="text-base leading-none">+</span>
        Nuevo Post
      </button>

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 flex items-start justify-end p-4 sm:p-6">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70 backdrop-blur-md"
              onClick={() => setOpen(false)}
            />

            {/* Panel lateral */}
            <motion.div
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 60 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="relative z-10 w-full max-w-lg h-full max-h-[calc(100vh-3rem)] bg-[#0f1014]/95 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl flex flex-col"
            >
              {/* Header del panel */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-white/8 flex-shrink-0">
                <div>
                  <h2 className="text-sm font-bold text-white">Nuevo Contenido</h2>
                  <p className="text-xs text-white/35 mt-0.5">Crea y programa tu publicación</p>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all text-sm"
                >
                  ✕
                </button>
              </div>

              {/* Formulario con scroll */}
              <div className="flex-1 overflow-y-auto px-6 py-5"
                style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>
                <CreatePostForm
                  onSuccess={() => {
                    setOpen(false);
                    // Recargar la página para actualizar el Kanban
                    window.location.reload();
                  }}
                  onClose={() => setOpen(false)}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
