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
    <div className={`relative h-full ${className}`}>
      {/* Folder Label above the tab */}
      <span
        className="block text-[11px] font-bold text-[#666666] tracking-tight mb-1"
        style={{ paddingLeft: '4px' }}
      >
        {title}
      </span>

      {/* Folder Body with real tab shape */}
      <div className="relative h-[calc(100%-20px)]">
        {/* Tab (Lengüeta) - real folder tab with proper shape */}
        <div
          className="absolute"
          style={{
            top: '-14px',
            left: '0',
            width: '60px',
            height: '14px',
            background: '#D9D9D9',
            borderRadius: '6px 6px 0 0',
          }}
        />

        {/* Folder body */}
        <div
          className="relative w-full h-full pt-4 pb-3 px-4"
          style={{
            background: '#D9D9D9',
            borderRadius: '0 16px 16px 16px',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
