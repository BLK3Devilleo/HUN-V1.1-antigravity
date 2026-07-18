'use client';

import { type ReactNode } from 'react';
import { motion } from 'framer-motion';

interface FolderCardProps {
  title: string;
  children: ReactNode;
  delay?: number;
  className?: string;
}

export default function FolderCard({ title, children, delay = 0, className = '' }: FolderCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.25, 0.8, 0.25, 1] }}
      whileHover={{ 
        y: -4, 
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
      }}
      className={`relative pt-5 pb-4 px-5 h-full ${className} border border-white/20`}
      style={{
        background: 'rgba(217, 217, 217, 0.4)', // Gris semi-transparente
        backdropFilter: 'blur(24px) saturate(1.5)', // Cristal esmerilado
        WebkitBackdropFilter: 'blur(24px) saturate(1.5)',
        borderRadius: '16px', // Radio de 16px exactos
      }}
    >
      {/* 
        Lengüeta del Folder (Tab):
      */}
      <div
        className="absolute left-[-1px] top-[-12px] flex items-center justify-center border-t border-l border-r border-white/20"
        style={{
          width: '60px',
          height: '12px',
          background: 'rgba(217, 217, 217, 0.4)',
          backdropFilter: 'blur(24px) saturate(1.5)',
          WebkitBackdropFilter: 'blur(24px) saturate(1.5)',
          borderTopLeftRadius: '8px',
          borderTopRightRadius: '8px',
        }}
      >
      </div>

      {/* Label descriptiva encima de la carpeta */}
      <span className="absolute top-[-26px] left-[4px] text-[11px] font-bold text-[var(--nuh-text-secondary)] tracking-tight drop-shadow-sm">
        {title}
      </span>

      {/* Contenido interno del folder */}
      <div className="relative h-full flex flex-col justify-center z-10">
        {children}
      </div>
    </motion.div>
  );
}
