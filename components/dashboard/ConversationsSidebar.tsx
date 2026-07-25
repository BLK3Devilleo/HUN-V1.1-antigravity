'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

export interface ProjectItem {
  id: string;
  title: string;
  date?: string;
  active?: boolean;
}

interface ConversationsSidebarProps {
  onBackToDashboard?: () => void;
  selectedOrg?: string;
  onSelectOrg?: (org: string) => void;
  onSelectPost?: (postTitle: string) => void;
  onSelectProject?: (item: any) => void;
  onSelectConversation?: (item: any) => void;
  onDeleteProject?: (projectId: string) => void;
  onNewPostClick?: () => void;
  onNewProjectClick?: () => void;
  projectsList?: { id: string; title: string; active?: boolean }[];
  conversationsList?: { id: string; title: string; active?: boolean }[];
  activeProjectId?: string | null;
  activeConversationId?: string | null;
}

const DEFAULT_PROJECTS = [
  {
    id: 'org-1',
    name: 'Organización número 1',
    posts: [
      { id: '1', title: 'Salvemos los árboles', active: true },
      { id: '2', title: 'Esterilización de lomitos comunitarios', active: false },
      { id: '3', title: 'Técnicas de cuidado del suelo fértil', active: false },
      { id: '4', title: 'Cultivos en casa fáciles y sostenibles', active: false },
    ],
  },
  {
    id: 'org-2',
    name: 'Organización número 2',
    posts: [
      { id: '5', title: 'Anuncio de Producto B', active: true },
      { id: '6', title: 'Campaña de Verano Ecológica', active: false },
    ],
  },
  {
    id: 'org-3',
    name: 'Organización número 3',
    posts: [
      { id: '7', title: 'Boletín Mensual Informativo', active: true },
    ],
  },
];

export default function ConversationsSidebar({
  onBackToDashboard,
  selectedOrg = 'org-1',
  onSelectOrg,
  onSelectPost,
  onSelectProject,
  onSelectConversation,
  onDeleteProject,
  onNewPostClick,
  onNewProjectClick,
  projectsList,
  conversationsList,
  activeProjectId,
  activeConversationId,
}: ConversationsSidebarProps) {
  const [currentOrgId, setCurrentOrgId] = useState(selectedOrg);
  const [activePostId, setActivePostId] = useState('1');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const activeOrg = DEFAULT_PROJECTS.find((p) => p.id === currentOrgId) || DEFAULT_PROJECTS[0];
  const displayPosts = projectsList || conversationsList || activeOrg.posts;
  const currentActiveId = activeProjectId !== undefined ? activeProjectId : activeConversationId;
  const handleCreateNew = onNewProjectClick || onNewPostClick;
  const handleSelect = onSelectProject || onSelectConversation;

  const handleOrgChange = (id: string) => {
    setCurrentOrgId(id);
    setIsDropdownOpen(false);
    if (onSelectOrg) onSelectOrg(id);
  };

  const handlePostClick = (post: { id: string; title: string }) => {
    setActivePostId(post.id);
    if (onSelectPost) onSelectPost(post.title);
    if (handleSelect) handleSelect(post);
  };

  return (
    <div className="w-[16vw] min-w-[250px] max-w-[320px] h-[83vh] flex flex-col justify-between gap-4 select-none box-border">
      {/* CONTENEDOR PRINCIPAL GRIS (#D9D9D9) */}
      <div className="w-full flex-1 bg-[#D9D9D9] rounded-[24px] p-6 flex flex-col justify-between overflow-hidden shadow-sm box-border">
        {/* BLOQUE SUPERIOR: TÍTULO, BOTÓN GALERÍA Y LISTA DE PROYECTOS */}
        <div className="w-full flex flex-col gap-5">
          {/* 1. Título de Organización */}
          <div className="w-[90%] flex items-center justify-start pl-5 pr-2 pt-2 pb-1">
            <h3 className="text-sm font-black text-black tracking-tight truncate">
              {activeOrg.name}
            </h3>
          </div>

          {/* 2. Botón Galería de Medios */}
          <div className="w-full flex justify-center">
            <Link
              href="/dashboard/gallery"
              className="w-[90%] h-[4vh] py-2.5 px-4 rounded-[25px] bg-white hover:bg-black hover:text-white text-black text-xs font-extrabold transition-all shadow-xs flex items-center justify-center gap-2 group cursor-pointer"
            >
              <span>🖼️ Ver Galería de Medios</span>
              <span className="text-sm group-hover:translate-x-0.5 transition-transform">→</span>
            </Link>
          </div>

          {/* 3. Lista de Proyectos */}
          <div className="w-[80%] h-[20vh]flex flex-col gap-2 overflow-y-auto max-h-[30vh] scrollbar-none pr-1 pl-6">
            {displayPosts.map((post) => {
              const isSelected = currentActiveId ? post.id === currentActiveId : false;
              return (
                <div
                  key={post.id}
                  onClick={() => handlePostClick(post)}
                  className={`w-full flex items-center justify-between px-3.5 py-3 min-h-[46px] rounded-xl cursor-pointer transition-all ${isSelected
                    ? 'bg-black/10 font-black text-black shadow-xs'
                    : 'text-[#333333] hover:text-black hover:bg-black/5 font-bold'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <svg
                      className={`w-5 h-5 flex-shrink-0 ${isSelected ? 'text-black' : 'text-[#666666]'}`}
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
                    </svg>
                    <span className="text-[13px] truncate flex-1 min-w-0" title={post.title}>
                      {post.title}
                    </span>
                  </div>

                  {onDeleteProject && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteProject(post.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white text-[#777777] rounded-full w-5 h-5 flex-shrink-0 transition-all flex items-center justify-center cursor-pointer ml-1"
                      title="Eliminar este proyecto"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* BLOQUE INFERIOR: BOTÓN + CREAR NUEVO */}
        <div className="w-full flex justify-center pt-2 pb-1">
          <button
            onClick={() => {
              if (handleCreateNew) handleCreateNew();
            }}
            className="w-full py-3 px-4 rounded-2xl bg-[#BFBFBF] hover:bg-[#B3B3B3] text-black text-xs font-extrabold transition-all active:scale-95 text-center cursor-pointer shadow-sm"
          >
            + Crear nuevo
          </button>
        </div>
      </div>

      {/* PÍLDORA DE ORGANIZACIÓN (CON DROPDOWN DESPLEGABLE) */}
      <div className="relative w-full h-[10vh]">
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="w-full h-[6vh] flex items-center justify-between pl-14 pr-5 py-3.5 rounded-full text-xs font-extrabold bg-[#D9D9D9] hover:bg-[#CFCFCF] text-black transition-all active:scale-95 shadow-sm"
        >
          <span className="truncate pr-2">{activeOrg.name}</span>
          <svg
            className={`w-4 h-4 opacity-70 flex-shrink-0 transition-transform ${isDropdownOpen ? 'rotate-180' : ''
              }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <AnimatePresence>
          {isDropdownOpen && (
            <motion.div
              initial={{ opacity: 0, y: 5, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 5, scale: 0.95 }}
              className="absolute bottom-14 left-0 w-full bg-white rounded-2xl border border-black/10 p-2 z-50 flex flex-col gap-1 shadow-lg"
            >
              {DEFAULT_PROJECTS.map((proj) => (
                <button
                  key={proj.id}
                  onClick={() => handleOrgChange(proj.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-colors flex items-center justify-between cursor-pointer ${proj.id === currentOrgId ? 'bg-black text-white' : 'hover:bg-neutral-100 text-black'
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
