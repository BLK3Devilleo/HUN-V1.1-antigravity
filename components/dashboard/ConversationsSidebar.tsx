'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { getDashboardData, type DashboardOrg } from '@/app/actions/dashboard';

export interface ConversationItem {
  id: string;
  title: string;
  date: string;
  active?: boolean;
}

interface ConversationsSidebarProps {
  onBackToDashboard: () => void;
  selectedOrg?: string;
  onSelectOrg?: (org: string) => void;
  onSelectPost?: (postTitle: string) => void;
  onSelectConversation?: (item: any) => void;
  onNewPostClick?: () => void;
  conversationsList?: { id: string; title: string; active?: boolean }[];
  activeConversationId?: string | null;
}

const DEFAULT_PROJECTS = [
  {
    id: 'org-1',
    name: '[MOCK] Organización número 1',
    posts: [
      { id: '1', title: '[MOCK] Salvemos los árboles', active: true },
      { id: '2', title: '[MOCK] Esterilizacion de lomi...', active: false },
      { id: '3', title: '[MOCK] Técnicas de cuidado...', active: false },
      { id: '4', title: '[MOCK] Cultivos en casa fáci...', active: false },
    ],
  },
  {
    id: 'org-2',
    name: '[MOCK] Organización número 2',
    posts: [
      { id: '5', title: '[MOCK] Anuncio de Producto B', active: true },
      { id: '6', title: '[MOCK] Campaña de Verano', active: false },
    ],
  },
  {
    id: 'org-3',
    name: '[MOCK] Organización número 3',
    posts: [
      { id: '7', title: '[MOCK] Boletín Mensual', active: true },
    ],
  },
];

export default function ConversationsSidebar({
  onBackToDashboard,
  selectedOrg = 'org-1',
  onSelectOrg,
  onSelectPost,
  onSelectConversation,
  onNewPostClick,
  conversationsList,
  activeConversationId,
}: ConversationsSidebarProps) {
  const [projects, setProjects] = useState<DashboardOrg[]>(DEFAULT_MOCK_PROJECTS);
  const [currentOrgId, setCurrentOrgId] = useState(selectedOrg);
  const [activePostId, setActivePostId] = useState('1');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const activeProject = DEFAULT_PROJECTS.find((p) => p.id === currentOrgId) || DEFAULT_PROJECTS[0];
  const displayPosts = conversationsList || activeProject.posts;

  const handleOrgChange = (id: string) => {
    setCurrentOrgId(id);
    setIsDropdownOpen(false);
    if (onSelectOrg) onSelectOrg(id);
  };

  const handlePostClick = (post: { id: string; title: string }) => {
    setActivePostId(post.id);
    if (onSelectPost) onSelectPost(post.title);
    if (onSelectConversation) onSelectConversation(post);
  };

  return (
    <div className="w-[15.5vw] flex flex-col justify-between h-[calc(100vh-16.5741vh-4.0741vh)] gap-3 select-none">
      {/* CARD PRINCIPAL (Gris #D9D9D9 con bordes redondeados) */}
      <div className="w-full bg-[#D9D9D9] rounded-[24px] p-5 flex flex-col justify-between flex-1 overflow-hidden">
        <div className="flex flex-col gap-4">
          {/* Título de Organización */}
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-black text-black tracking-tight truncate">
              {activeProject.name}
            </span>
          </div>

          {/* Enlace directo a Galería de la Organización */}
          <Link
            href="/dashboard/gallery"
            className="w-full py-2 px-3 rounded-xl bg-white hover:bg-black hover:text-white text-black text-[11px] font-extrabold transition-all shadow-sm flex items-center justify-between group"
          >
            <span>🖼️ Ver Galería de Medios</span>
            <span className="text-xs group-hover:translate-x-0.5 transition-transform">→</span>
          </Link>

          {/* Lista de Carpetas / Publicaciones */}
          <div className="flex flex-col gap-2 overflow-y-auto max-h-[42vh] scrollbar-none pr-1">
            {displayPosts.map((post) => {
              const isSelected = activeConversationId ? post.id === activeConversationId : false;
              return (
                <div
                  key={post.id}
                  onClick={() => handlePostClick(post)}
                  className={`flex items-center gap-2.5 px-2.5 py-2 rounded-xl cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-black/10 font-black text-black shadow-xs'
                      : 'text-[#333333] hover:text-black hover:bg-black/5'
                  }`}
                >
                  <svg
                    className={`w-4 h-4 flex-shrink-0 ${isSelected ? 'text-black' : 'text-[#777777]'}`}
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
                  </svg>
                  <span className="text-xs truncate">{post.title}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Botón Crear Nuevo */}
        <button
          onClick={() => {
            if (onNewPostClick) onNewPostClick();
          }}
          className="w-full py-3 px-4 rounded-2xl bg-[#BFBFBF] hover:bg-[#B3B3B3] text-black text-xs font-bold transition-all active:scale-95 text-center cursor-pointer shadow-sm"
        >
          + Crear nuevo
        </button>
      </div>

      {/* PÍLDORA INFERIOR DE ORGANIZACIÓN CON DROPDOWN */}
      <div className="relative">
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="w-full flex items-center justify-between px-5 py-3 rounded-full text-xs font-semibold bg-[#D9D9D9] hover:bg-[#CFCFCF] text-black transition-all active:scale-95"
        >
          <span className="truncate pr-2">{activeProject.name}</span>
          <svg
            className={`w-4 h-4 opacity-70 flex-shrink-0 transition-transform ${
              isDropdownOpen ? 'rotate-180' : ''
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown flotante */}
        <AnimatePresence>
          {isDropdownOpen && (
            <motion.div
              initial={{ opacity: 0, y: 5, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 5, scale: 0.95 }}
              className="absolute bottom-14 left-0 w-full bg-white rounded-2xl border border-black/10 p-2 z-50 flex flex-col gap-1"
            >
              {DEFAULT_PROJECTS.map((proj) => (
                <button
                  key={proj.id}
                  onClick={() => handleOrgChange(proj.id)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-colors flex items-center justify-between cursor-pointer ${
                    proj.id === currentOrgId ? 'bg-black text-white' : 'hover:bg-neutral-100 text-black'
                  }`}
                >
                  <span className="truncate">{proj.name}</span>
                  <span className="text-[10px] opacity-60">({proj.posts.length})</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
