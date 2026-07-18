'use client';

import { type ReactNode } from 'react';

interface FolderCardProps {
  title: string;
  children: ReactNode;
  delay?: number;
  className?: string;
}

export default function FolderCard({ title, children, className = '' }: FolderCardProps) {
  return (
    <div
      className={`folder-shape relative pt-5 pb-4 px-5 h-full ${className}`}
      style={{
        background: 'var(--nuh-card)',
        borderRadius: '16px', // Radio de 16px exactos para tarjetas inferiores
      }}
    >
      {/* 
        Lengüeta del Folder (Tab):
        Restaurada a usar la clase .folder-shape::before de globals.css
      */}
      
      {/* Label descriptiva encima de la carpeta */}
      <span className="absolute top-[-26px] left-[4px] text-[11px] font-bold text-[var(--nuh-text-secondary)] tracking-tight">
        {title}
      </span>

      {/* Contenido interno del folder */}
      <div className="relative h-full flex flex-col justify-center">
        {children}
      </div>
    </div>
  );
}
