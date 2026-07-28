'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

export default function ContentStack() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="relative flex flex-col cursor-pointer select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* =========================================================
          TÍTULO ESTÁTICO DE LA SECCIÓN (Independiente de la animación)
          ========================================================= */}
      <div className="flex items-center z-40 pl-1" style={{ marginBottom: '1.6vh', marginLeft: '0.4vw' }}>
        <span className="text-[2.4vh] font-[500] text-[#000000] tracking-tight leading-none">
          Contenidos
        </span>
      </div>

      {/* =========================================================
          ÁREA DE CARTAS ANIMADAS (3D Stack)
          Ancho: 310px / 1920px = 16.1458vw
          Alto: 357px / 1080px = 33.0556vh
          ========================================================= */}
      <div
        className="relative"
        style={{
          width: '16.1458vw',
          height: '35vh',
        }}
      >
        {/* CARTA 3 (Posterior): Oculta por defecto. Scale 0.64 (20% menos que Carta 2), Rotación 10° */}
        <motion.div
          className="absolute inset-0 bg-[#E5E5E5] border border-black/10 shadow-sm pointer-events-none"
          initial={false}
          animate={{
            opacity: isHovered ? 1 : 0,
            scale: isHovered ? 0.7 : 1,
            rotate: isHovered ? 10 : 0,
          }}
          transition={{ duration: 0.25, ease: [0.25, 0.8, 0.25, 1] as const }}
          style={{
            borderRadius: '16px',
            transformOrigin: 'bottom right',
            willChange: 'transform, opacity',
            zIndex: 10,
          }}
        />

        {/* CARTA 2 (Intermedia): Oculta por defecto. Scale 0.8 (20% menos que Carta 1), Rotación 5° */}
        <motion.div
          className="absolute inset-0 bg-[#EEEEEE] border border-black/10 shadow-md pointer-events-none"
          initial={false}
          animate={{
            opacity: isHovered ? 1 : 0,
            scale: isHovered ? .9 : 1,
            rotate: isHovered ? 5 : 0,
          }}
          transition={{ duration: 0.25, ease: [0.25, 0.8, 0.25, 1] as const }}
          style={{
            borderRadius: '16px',
            transformOrigin: 'bottom right',
            willChange: 'transform, opacity',
            zIndex: 20,
          }}
        />

        {/* CARTA 1 (Principal / Frontal): Rotación -2° al hover */}
        <motion.div
          className="relative z-30 w-full h-full bg-white border border-black/10 shadow-lg p-3 flex flex-col justify-between"
          initial={false}
          animate={{
            rotate: isHovered ? -2 : 0,
          }}
          transition={{ duration: 0.25, ease: [0.25, 0.8, 0.25, 1] as const }}
          style={{
            borderRadius: '16px',
            transformOrigin: 'bottom right',
            willChange: 'transform',
          }}
        >
          {/* Cuerpo / Previsualización interna de la card */}
          <div className="flex-1 w-full bg-[#F6F6F6] rounded-xl border border-black/5 p-3 flex flex-col justify-between select-none">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-[#666666] uppercase tracking-wider">
                Publicación #01
              </span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#10B981]/10 text-[#10B981]">
                Listo
              </span>
            </div>

            <div className="my-auto text-center py-2">
              <p className="text-xs font-semibold text-[#333333]">
                Campaña "Build For Venezuela"
              </p>
              <p className="text-[10px] text-[#999999] mt-0.5">
                3 archivos multimedia listos
              </p>
            </div>

            <div className="w-full bg-[#D9D9D9] h-1.5 rounded-full overflow-hidden">
              <div className="bg-[#000000] h-full w-[75%]" />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
