'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface UploadQueueWidgetProps {
  description?: string;
  isUploading?: boolean;
  hasError?: boolean;
  errorMessage?: string | null;
  queueCount?: number;
  thumbnailUrl?: string;
  failedCount?: number;
  onViewAll?: () => void;
}

export default function UploadQueueWidget({
  description,
  isUploading = false,
  hasError = false,
  errorMessage = null,
  queueCount = 12,
  thumbnailUrl,
  failedCount = 1,
  onViewAll,
}: UploadQueueWidgetProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showErrorState, setShowErrorState] = useState(hasError);

  // Extraer la primera línea de la descripción del contenido
  const firstLineDescription = description
    ? description.split('\n')[0].trim()
    : 'Contenido sob...';

  const defaultImage = 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=600&q=80';

  return (
    <div
      className="w-full flex flex-col gap-1 select-none box-border relative group pointer-events-auto"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Tarjeta Gris Principal #D9D9D9 (Expandible al hacer clic) */}
      <motion.div
        layout
        onClick={() => setShowErrorState(!showErrorState)}
        animate={{
          height: showErrorState ? '37.4vh' : '29vh',
        }}
        transition={{ duration: 0.35, ease: [0.25, 0.8, 0.25, 1] }}
        className="w-full flex flex-col justify-between shadow-sm box-border overflow-hidden cursor-pointer"
        style={{
          background: '#D9D9D9',
          borderRadius: '20px',
        }}
      >
        {/* Contenido superior (Header + Recuadro Blanco): Invariante y congelado durante la animación */}
        <div className="w-full flex flex-col items-center gap-1 shrink-0">
          {/* Header: Punto Rojo + Título "Subidas en fila" */}
          <div
            className="w-full flex items-center gap-2.5"
            style={{
              paddingTop: '1.2vh',
              paddingLeft: '1vw',
              paddingRight: '1vw',
            }}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF4D4D] flex-shrink-0 inline-block" />
            <h3 className="text-[3vh] font-normal text-black tracking-tight leading-none">
              Subidas en fila
            </h3>
          </div>

          {/* Recuadro Blanco Interno: Medidas e imágenes 100% fijas e invariantes con mayor separación vertical del título */}
          <div
            className="w-[87%] h-[65%] bg-white rounded-[14px] p-2 flex flex-col shadow-xs mx-auto shrink-0"
            style={{
              marginTop: '2.2vh',
            }}
          >
            {/* Imagen con bordes superiores redondeados e inferiores rectos */}
            <div className="relative w-full h-[78%] rounded-t-[14px] rounded-b-none overflow-hidden bg-emerald-900 shrink-0">
              <img
                src={thumbnailUrl || defaultImage}
                alt="Preview"
                className="w-full h-full object-cover"
              />
              {/* Badge de puntos estilo selector en esquina superior derecha */}
              <div className="absolute top-2 right-2 bg-black/40 backdrop-blur-xs px-2 py-1 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-white/90" />
                <span className="w-1.5 h-1.5 rounded-full bg-white/90" />
                <span className="w-1.5 h-1.5 rounded-full bg-white/90" />
                <span className="w-1.5 h-1.5 rounded-full bg-white/90" />
              </div>
            </div>

            {/* Texto de previsualización de la descripción */}
            <div
              className="font-normal text-[2.2vh] text-black truncate leading-tight flex-1 flex items-center"
              style={{
                paddingLeft: '1vw',
                paddingRight: '0.6vw',
                paddingTop: '.5vh',
                paddingBottom: '0.2vh',
              }}
            >
              {firstLineDescription}
            </div>
          </div>
        </div>

        {/* Zona Intermedia: Texto "Cargando 12 más..." centrado entre el borde inferior del recuadro blanco y el borde superior del recuadro rojo */}
        <div className="w-full flex-1 flex items-center justify-center py-1">
          <p className="text-center text-sm font-normal text-[#555555]">
            {isUploading ? 'Procesando archivo...' : `Cargando ${queueCount} más...`}
          </p>
        </div>

        {/* Recuadro Rojo: Revelado con animación al fallar o hacer clic (Alto exacto 8.4vh = 37.4vh - 29vh) */}
        <AnimatePresence>
          {showErrorState && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: '5.4vh' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="w-full bg-[#EF4444] text-white font-extrabold text-base text-center shadow-xs leading-none flex items-center justify-center rounded-b-[20px] shrink-0"
              style={{ height: '5.4vh' }}
            >
              {errorMessage || `Falló ${failedCount} archivo`}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Píldora / Botón Oscuro "Ver todo": Aparece suavemente al hacer hover sin parpadeos ni saltos de DOM */}
      <motion.button
        initial={false}
        animate={{
          opacity: isHovered ? 1 : 0,
          y: isHovered ? 0 : 4,
        }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        onClick={onViewAll}
        className={`w-full h-[5vh] bg-[#2E2E2E] hover:bg-[#222222] active:scale-98 text-white font-extrabold text-base py-3.5 rounded-full text-center shadow-xs leading-none flex items-center justify-center ${isHovered ? 'pointer-events-auto cursor-pointer' : 'pointer-events-none'
          }`}
      >
        Ver todo
      </motion.button>
    </div>
  );
}
