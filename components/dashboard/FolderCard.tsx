'use client';

import { type ReactNode } from 'react';

interface FolderCardProps {
  title: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export default function FolderCard({ title, children, className = '', onClick }: FolderCardProps) {
  return (
    <div
      onClick={onClick}
      className={`relative w-full h-full flex flex-col ${onClick ? 'cursor-pointer transition-transform hover:scale-[1.03] active:scale-95' : ''} ${className}`}
      style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.06))' }}
    >
      {/* Pestaña (Tab) Superior Blanca */}
      <div
        className="absolute left-0 top-0 bg-white"
        style={{
          height: '14px',
          width: '75px',
          borderRadius: '10px 10px 0 0',
        }}
      />

      {/* Cuerpo Principal Blanco */}
      <div
        className="relative z-10 w-full flex-1 bg-white flex flex-col pb-4"
        style={{
          marginTop: '13px', /* Justo debajo de la pestaña, superponiendo un píxel para que no haya línea */
          borderRadius: '0 16px 16px 16px',
          paddingTop: '2vh',
          paddingLeft: '1.4vw',
          paddingRight: '1.4vw',
        }}
      >
        {/* Título: Texto en Mayúsculas despegado del borde superior */}
        <div className="flex items-center mb-2">
          <span className="text-[15px] font-normal text-[#000000] tracking-tight leading-none">
            {title}
          </span>
        </div>

        {/* Contenido Interno */}
        <div className="flex-1 flex flex-col justify-center">
          {children}
        </div>
      </div>
    </div>
  );
}
