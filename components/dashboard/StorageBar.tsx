'use client';

import { motion } from 'framer-motion';

interface StorageBarProps {
  usedGB?: number;
  totalGB?: number;
}

export default function StorageBar({ usedGB = 238, totalGB = 688 }: StorageBarProps) {
  // Ocupación: 238 / 688 = 34.593%
  const percentage = (usedGB / totalGB) * 100;

  return (
    <div className="flex flex-col justify-center h-full gap-2.5">
      <p className="text-2xl font-black text-[#000000] tracking-tight leading-none">
        {usedGB}/{totalGB} GB
      </p>

      {/* 
        Barra de progreso de precisión:
        Track de color #C4C4C4. Indicador activo en #808080.
      */}
      <div
        className="w-full h-2 rounded-full overflow-hidden"
        style={{ background: '#C4C4C4' }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ background: '#808080' }} // Indicador activo
        />
      </div>

      <p className="text-[10px] font-semibold text-[var(--nuh-text-secondary)]">
        34.5% utilizado
      </p>
    </div>
  );
}
