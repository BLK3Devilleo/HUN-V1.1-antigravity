'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConversationsSidebarProps {
  onBackToDashboard: () => void;
  selectedOrg?: string;
  onSelectOrg?: (org: string) => void;
  onSelectPost?: (postTitle: string) => void;
}

const PROJECTS = [
  {
    id: 'org-1',
    name: 'Organización número 1',
    posts: [
      { id: '1', title: 'Salvemos los árboles', active: true },
      { id: '2', title: 'Esterilizacion de lomi...', active: false },
      { id: '3', title: 'Técnicas de cuidado...', active: false },
      { id: '4', title: 'Cultivos en casa fáci...', active: false },
    ],
  },
  {
    id: 'org-2',
    name: 'Organización número 2',
    posts: [
      { id: '5', title: 'Anuncio de Producto B', active: true },
      { id: '6', title: 'Campaña de Verano', active: false },
    ],
  },
  {
    id: 'org-3',
    name: 'Organización número 3',
    posts: [
      { id: '7', title: 'Boletín Mensual', active: true },
    ],
  },
];

export default function ConversationsSidebar({
  onBackToDashboard,
  selectedOrg = 'org-1',
  onSelectOrg,
  onSelectPost,
}: ConversationsSidebarProps) {
  const [currentOrgId, setCurrentOrgId] = useState(selectedOrg);
  const [activePostId, setActivePostId] = useState('1');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const activeProject = PROJECTS.find((p) => p.id === currentOrgId) || PROJECTS[0];

  const handleOrgChange = (id: string) => {
    setCurrentOrgId(id);
    setIsDropdownOpen(false);
    if (onSelectOrg) onSelectOrg(id);
  };

  const handlePostClick = (post: { id: string; title: string }) => {
    setActivePostId(post.id);
    if (onSelectPost) onSelectPost(post.title);
  };

  return (
    <div className="w-[15.5vw] flex flex-col justify-between h-[calc(100vh-14.9vh-4.0741vh)] gap-3 select-none">
      {/* CARD PRINCIPAL (Gris #D9D9D9 con bordes redondeados) */}
      <div className="w-full bg-[#D9D9D9] rounded-[24px] p-5 flex flex-col justify-between flex-1 shadow-sm overflow-hidden">
        <div className="flex flex-col gap-4">
          {/* Título de Organización */}
          <span className="text-xs font-semibold text-black tracking-tight px-1">
            {activeProject.name}
          </span>

          {/* Lista de Carpetas / Publicaciones pendientes */}
          <div className="flex flex-col gap-2.5 overflow-y-auto max-h-[46vh] scrollbar-none pr-1">
            {activeProject.posts.map((post) => {
              const isSelected = post.id === activePostId;
              return (
                <div
                  key={post.id}
                  onClick={() => handlePostClick(post)}
                  className={`flex items-center gap-2.5 px-2 py-1.5 rounded-xl cursor-pointer transition-all ${
                    isSelected ? 'font-bold text-black' : 'text-[#333333] hover:text-black'
                  }`}
                >
                  {/* Icono de Carpeta gris */}
                  <svg
                    className={`w-5 h-5 flex-shrink-0 ${isSelected ? 'text-[#555555]' : 'text-[#777777]'}`}
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

        {/* Botón Crear Nuevo en el fondo de la card */}
        <button
          onClick={onBackToDashboard}
          className="w-full py-3 px-4 rounded-2xl bg-[#BFBFBF] hover:bg-[#B3B3B3] text-black text-xs font-bold transition-all active:scale-95 text-center shadow-sm"
        >
          Crear nuevo
        </button>
      </div>

      {/* PÍLDORA INFERIOR DE ORGANIZACIÓN / PROYECTO CON DROPDOWN */}
      <div className="relative">
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="w-full flex items-center justify-between px-5 py-3 rounded-full text-xs font-semibold bg-[#D9D9D9] hover:bg-[#CFCFCF] text-black transition-all active:scale-95 shadow-sm"
        >
          <span className="truncate pr-2">{activeProject.name}</span>
          <svg
            className={`w-4 h-4 opacity-60 flex-shrink-0 transition-transform ${
              isDropdownOpen ? 'rotate-180' : ''
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown flotante para cambiar de organización */}
        <AnimatePresence>
          {isDropdownOpen && (
            <motion.div
              initial={{ opacity: 0, y: 5, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 5, scale: 0.95 }}
              className="absolute bottom-14 left-0 w-full bg-white rounded-2xl border border-black/10 shadow-2xl p-2 z-50 flex flex-col gap-1"
            >
              {PROJECTS.map((proj) => (
                <button
                  key={proj.id}
                  onClick={() => handleOrgChange(proj.id)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center justify-between ${
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
