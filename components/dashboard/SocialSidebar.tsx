'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, type Transition } from 'framer-motion';

const sidebarTransition: Transition = {
  duration: 0.6,
  ease: [0.25, 0.8, 0.25, 1],
};

interface Platform {
  id: string;
  label: string;
  color: string;
  connected: boolean;
}

const PLATFORMS: Platform[] = [
  { id: 'facebook', label: 'Facebook', color: '#1877F2', connected: true },
  { id: 'instagram', label: 'Instagram', color: '#E4405F', connected: true },
  { id: 'x', label: 'X', color: '#000000', connected: false },
  { id: 'linkedin', label: 'LinkedIn', color: '#0A66C2', connected: true },
  { id: 'tiktok', label: 'TikTok', color: '#000000', connected: false },
];

const UTILS = [
  { id: 'feed', label: 'Feed Global', color: '#10B981', href: '/dashboard/feed' },
  { id: 'admin', label: 'Moderación Admin', color: '#7C3AED', href: '/dashboard/admin' },
  { id: 'gallery', label: 'Mi Galería', color: '#2563EB', href: '/dashboard/gallery' },
  { id: 'settings', label: 'Ajustes', color: '#4B5563', href: '/dashboard/settings' },
  { id: 'profile', label: 'Mi Perfil', color: '#1F2937' },
];

interface SocialSidebarProps {
  isTransitioning?: boolean;
  onOpenProfile?: () => void;
}

export default function SocialSidebar({ isTransitioning = false, onOpenProfile }: SocialSidebarProps) {
  const [expanded, setExpanded] = useState(false);

  const renderIcon = (id: string) => {
    switch (id) {
      case 'facebook':
        return <svg viewBox="0 0 24 24" fill="white" className="w-[50%] h-[50%]"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>;
      case 'instagram':
        return <svg viewBox="0 0 24 24" fill="white" className="w-[50%] h-[50%]"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg>;
      case 'x':
        return <svg viewBox="0 0 24 24" fill="white" className="w-[45%] h-[45%]"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>;
      case 'linkedin':
        return <svg viewBox="0 0 24 24" fill="white" className="w-[50%] h-[50%]"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>;
      case 'tiktok':
        return <svg viewBox="0 0 24 24" fill="white" className="w-[50%] h-[50%]"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" /></svg>;
      case 'feed':
        return <svg viewBox="0 0 24 24" fill="white" className="w-[55%] h-[55%]"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" /></svg>;
      case 'admin':
        return <svg viewBox="0 0 24 24" fill="white" className="w-[55%] h-[55%]"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" /></svg>;
      case 'gallery':
        return <svg viewBox="0 0 24 24" fill="white" className="w-[50%] h-[50%]"><path d="M4 5h16a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V6a1 1 0 011-1zm1 2v10h14V7H5zm2 8l3-4 2.5 3L14 11l4 5H7z" /></svg>;
      case 'settings':
        return <svg viewBox="0 0 24 24" fill="white" className="w-[50%] h-[50%]"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.488.488 0 00-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 00-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.488.488 0 00-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6A3.6 3.6 0 1112 8.4a3.6 3.6 0 010 7.2z" /></svg>;
      case 'profile':
        return <svg viewBox="0 0 24 24" fill="white" className="w-[50%] h-[50%]"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>;
      default:
        return null;
    }
  };

  return (
    <div className={`flex flex-col gap-[2cqh] w-full h-full [container-type:size] ${expanded ? 'items-start' : 'items-center'}`}>
      <motion.div
        layout
        onClick={() => setExpanded(!expanded)}
        className={`cursor-pointer select-none flex flex-col justify-between ${expanded ? 'items-start' : 'items-center'}`}
        animate={{
          width: expanded ? '14vw' : '100%',
          borderRadius: expanded ? '25px' : '50px',
          x: isTransitioning ? -300 : 0,
          opacity: isTransitioning ? 0 : 1,
          scale: isTransitioning ? 1.2 : 1,
        }}
        transition={sidebarTransition}
        style={{
          background: '#D9D9D9',
          padding: expanded ? '3cqh 16px' : '3cqh 0',
          overflow: 'hidden',
          height: '72%',
          willChange: 'transform, opacity',
        }}
      >
        <div className="flex flex-col items-center justify-between w-full h-full py-[1cqh]">
          {PLATFORMS.map((p, i) => (
            <motion.div
              key={p.id}
              className={`flex items-center w-full h-[18%] ${expanded ? 'justify-between px-1' : 'justify-center'}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex-shrink-0 aspect-square rounded-full flex items-center justify-center shadow-sm"
                  style={{
                    width: 'min(55cqw, 12cqh)',
                    background: p.color,
                  }}
                >
                  {renderIcon(p.id)}
                </div>
                <AnimatePresence>
                  {expanded && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-xs font-semibold text-[#000000] whitespace-nowrap overflow-hidden"
                    >
                      {p.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>

              <AnimatePresence>
                {expanded && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    transition={{ duration: 0.2 }}
                    className={`flex-shrink-0 w-2.5 h-2.5 rounded-full mr-1 ${p.connected ? 'bg-[#10B981]' : 'bg-[#9CA3AF]'
                      }`}
                    title={p.connected ? 'Conectada' : 'No conectada'}
                  />
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* BOTONES DE NAVEGACIÓN Y UTILIDADES */}
      <div className={`flex flex-wrap gap-[2cqw] w-full h-[25%] items-center ${expanded ? 'justify-start px-2' : 'justify-center'}`}>
        {UTILS.map((u) => {
          if (u.href) {
            return (
              <Link key={u.id} href={u.href} className="block">
                <motion.div
                  animate={{
                    x: isTransitioning ? -300 : 0,
                    opacity: isTransitioning ? 0 : 1,
                    scale: isTransitioning ? 1.2 : 1,
                  }}
                  transition={sidebarTransition}
                  className="aspect-square rounded-full flex items-center justify-center transition-transform hover:scale-110 cursor-pointer shadow-md border border-white/20"
                  style={{
                    width: 'min(80cqw, 22cqh)',
                    background: u.color,
                    willChange: 'transform, opacity',
                  }}
                  title={u.label}
                >
                  {renderIcon(u.id)}
                </motion.div>
              </Link>
            );
          }

          return (
            <motion.button
              key={u.id}
              onClick={onOpenProfile}
              animate={{
                x: isTransitioning ? -300 : 0,
                opacity: isTransitioning ? 0 : 1,
                scale: isTransitioning ? 1.2 : 1,
              }}
              transition={sidebarTransition}
              className="aspect-square rounded-full flex items-center justify-center transition-transform hover:scale-110 cursor-pointer shadow-md border border-white/20"
              style={{
                width: 'min(80cqw, 22cqh)',
                background: u.color,
                willChange: 'transform, opacity',
              }}
              title={u.label}
            >
              {renderIcon(u.id)}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
