'use client';

import { motion } from 'framer-motion';

export default function ContentStack() {
  return (
    <div className="relative w-full h-full min-h-[110px]">
      {/* 
        Efecto 3D de precisión:
        Tres planos superpuestos con un desfase de 8px hacia la derecha y 8px hacia arriba (simulado en translate)
      */}
      <div className="absolute inset-0">
        {/* Tercera Capa (Fondo) */}
        <div
          className="absolute rounded-lg border border-black/5"
          style={{
            background: '#C4C4C4',
            width: '85%',
            height: '85%',
            right: '0px',
            top: '0px',
            zIndex: 1,
          }}
        />

        {/* Segunda Capa (Medio) */}
        <div
          className="absolute rounded-lg border border-black/5"
          style={{
            background: '#CECECE',
            width: '85%',
            height: '85%',
            right: '8px',
            top: '8px',
            zIndex: 2,
          }}
        />

        {/* Primera Capa (Frente) */}
        <div
          className="absolute rounded-lg border border-black/5 flex items-end p-2.5"
          style={{
            background: '#D9D9D9',
            width: '85%',
            height: '85%',
            right: '16px',
            top: '16px',
            zIndex: 3,
          }}
        >
          {/* Círculo indicador micro en la esquina inferior izquierda */}
          <div className="w-5 h-5 rounded-full bg-black flex items-center justify-center text-[9px] font-bold text-white">
            N
          </div>
        </div>
      </div>

      {/* 
        Botón (+):
        Círculo de 32px de diámetro. Color #C4C4C4. Símbolo "+" centrado.
        Ubicado de forma flotante según el diseño original.
      */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className="absolute z-10 w-8 h-8 rounded-full flex items-center justify-center text-xl font-light text-black hover:brightness-95 transition-all"
        style={{
          width: '32px',
          height: '32px',
          background: '#C4C4C4',
          right: '25%',
          bottom: '25%',
        }}
      >
        +
      </motion.button>
    </div>
  );
}
