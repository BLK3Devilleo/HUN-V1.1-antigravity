'use client';

import { type ReactNode } from 'react';

interface FolderCardProps {
  title: string;
  children: ReactNode;
  className?: string;
}

export default function FolderCard({ title, children, className = '' }: FolderCardProps) {
  return (
    <div className={`relative w-full h-full flex flex-col ${className}`}>
      {/* 
        Pestañas del Folder (Efecto 3D en Cascada):
        - Pestaña Trasera (Gris Oscuro #999999): Más a la izquierda y más arriba.
        - Pestaña Delantera (Gris Claro #E0E0E0): Conectada al cuerpo de la carpeta.
      */}
      <div className="absolute left-0" style={{ top: '-16px', width: '90px', height: '16px' }}>
        {/* Pestaña Trasera (Gris Oscuro) */}
        <div
          className="absolute"
          style={{
            top: '-2px',
            left: '4px',
            width: '76px',
            height: '18px',
            background: '#999999',
            clipPath: 'polygon(0 100%, 0 0, 72% 0, 100% 100%)',
            borderRadius: '6px 0 0 0',
          }}
        />
        {/* Pestaña Delantera (Gris Claro, alineada con el cuerpo) */}
        <div
          className="absolute"
          style={{
            top: '2px',
            left: '12px',
            width: '76px',
            height: '14px',
            background: '#E0E0E0', // Gris claro idéntico al cuerpo
            clipPath: 'polygon(0 100%, 0 0, 72% 0, 100% 100%)',
            borderRadius: '4px 0 0 0',
          }}
        />
      </div>

      {/* Cuerpo de la Carpeta (Gris Claro #E0E0E0) */}
      <div
        className="relative w-full h-full pt-4 pb-4 px-5 flex flex-col justify-between border border-[#CCCCCC]/50"
        style={{
          background: '#E0E0E0',
          borderRadius: '0 16px 16px 16px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
        }}
      >
        {/* Título de la Carpeta (Sans-Serif normal, no todo mayúsculas) */}
        <span className="text-[13px] font-semibold text-[#1A1A1A] tracking-tight mb-2 block">
          {title}
        </span>

        {/* Contenido Interno */}
        <div className="flex-1 flex flex-col justify-center">
          {children}
        </div>
      </div>
    </div>
  );
}
