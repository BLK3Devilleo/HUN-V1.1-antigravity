'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
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

const DEFAULT_MOCK_PROJECTS = [
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

  const scrollRef = useRef<HTMLDivElement>(null);
  const [showTopFade, setShowTopFade] = useState(false);
  const [showBottomFade, setShowBottomFade] = useState(false);

  const activeOrg = DEFAULT_MOCK_PROJECTS.find((p: { id: string }) => p.id === currentOrgId) || DEFAULT_MOCK_PROJECTS[0];
  const displayPosts = projectsList || conversationsList || activeOrg.posts;
  const currentActiveId = activeProjectId !== undefined ? activeProjectId : activeConversationId;
  const handleCreateNew = onNewProjectClick || onNewPostClick;
  const handleSelect = onSelectProject || onSelectConversation;

  const checkScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    const isScrollable = scrollHeight > clientHeight + 4;
    setShowTopFade(isScrollable && scrollTop > 3);
    setShowBottomFade(isScrollable && scrollTop < scrollHeight - clientHeight - 4);
  }, []);

  useEffect(() => {
    checkScrollState();
  }, [displayPosts, checkScrollState]);

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
    <div className="w-[10vw] min-w-[230px] h-[83.1vh] flex flex-col justify-between gap-4 select-none box-border">
      {/* CONTENEDOR PRINCIPAL GRIS (#D9D9D9) */}
      <div
        className="w-full flex-1 bg-[#D9D9D9] rounded-[24px] flex flex-col justify-between overflow-hidden shadow-sm box-border"
        style={{ paddingBottom: '4.5%' }}
      >
        {/* BLOQUE SUPERIOR: TÍTULO, BOTÓN GALERÍA Y LISTA DE PROYECTOS */}
        <div className="w-full flex flex-col gap-3 flex-1 min-h-0 overflow-hidden">
          {/* 1. Título de Organización despegado del borde izquierdo y superior */}
          <div
            className="w-full flex items-center justify-start shrink-0"
            style={{
              paddingTop: '1.5vh',   // Linea 103: Separación del borde superior
              paddingLeft: '1.6vw',  // Linea 104: Separación del borde izquierdo
              paddingRight: '1vw',
            }}
          >
            <h3 className="text-[2hv] font-[400] text-black tracking-tight truncate">
              {activeOrg.name}
            </h3>
          </div>

          {/* 2. Botón Galería de Medios */}
          <div className="w-full flex justify-center shrink-0">
            <Link
              href="/dashboard/gallery"
              className="w-[90%] h-[4.6vh] py-2 px-3.5 rounded-[25px] bg-transparent border-[1px] border-black/30 hover:bg-black/70 hover:text-white hover:border-black text-black text-xs font-[500] text-[1.8vh] transition-all shadow-2xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <svg
                className="w-4.5 h-4.5 flex-shrink-0 stroke-current"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span>Ver Galería de Medios</span>
            </Link>
          </div>

          {/* 3. Lista de Proyectos: Con overlays de degradado superior e inferior sin mask-image para respuesta instantánea de hover y clic */}
          <div className="relative w-full flex-1 min-h-0 overflow-hidden mt-1">
            {/* Overlay Degradado Superior */}
            <div
              className={`absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-[#D9D9D9] to-transparent pointer-events-none z-10 transition-opacity duration-200 ${showTopFade ? 'opacity-100' : 'opacity-0'
                }`}
            />

            {/* Lista Scrolleable */}
            <div
              ref={scrollRef}
              onScroll={checkScrollState}
              className={`w-full h-full flex flex-col items-center gap-1.5 scrollbar-none py-1.5 flex-1 min-h-0 ${displayPosts.length > 5 ? 'overflow-y-auto' : 'overflow-y-hidden'
                }`}
            >
              {displayPosts.map((post: { id: string; title: string }) => {
                const isSelected = currentActiveId ? post.id === currentActiveId : false;
                return (
                  <div
                    key={post.id}
                    onClick={() => handlePostClick(post)}
                    className={`group w-[90%] flex items-center justify-between pl-4.5 pr-3 py-2 rounded-[4px] cursor-pointer transition-colors duration-100 mx-auto shrink-0 select-none ${isSelected
                      ? 'bg-black/10 font-[600] text-black shadow-xs'
                      : 'text-[#333333] hover:text-black hover:bg-black/5 font-[500]'
                      }`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0 flex-1 pointer-events-none">
                      <svg
                        className={`w-[4vh] h-[3vh] min-w-[18px] min-h-[18px] flex-shrink-0 ml-0.5 ${isSelected ? 'text-black' : 'text-[#666666]'
                          }`}
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
                      </svg>
                      <span className="block text-[1.8vh] truncate min-w-0 max-w-[80%] flex-1" title={post.title}>
                        {post.title}
                      </span>
                    </div>

                    {onDeleteProject && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteProject(post.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white text-[#777777] rounded-full w-5 h-5 flex-shrink-0 transition-all flex items-center justify-center cursor-pointer ml-1 pointer-events-auto"
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

            {/* Overlay Degradado Inferior */}
            <div
              className={`absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-[#D9D9D9] to-transparent pointer-events-none z-10 transition-opacity duration-200 ${showBottomFade ? 'opacity-100' : 'opacity-0'
                }`}
            />
          </div>
        </div>

        {/* BLOQUE INFERIOR: BOTÓN + CREAR NUEVO (Anclado a la base inferior con items-end para que su altura crezca hacia arriba) */}
        <div className="w-full flex items-end justify-center shrink-0">
          <button
            onClick={() => {
              if (handleCreateNew) handleCreateNew();
            }}
            className="w-[90%] h-[5.5vh] px-4 rounded-[13px] bg-[#BFBFBF] hover:bg-[#B3B3B3] text-[#292929] text-[2.3vh] font-[600] transition-all active:scale-95 text-center cursor-pointer shadow-sm mx-auto flex items-center justify-center"
          >
            Crear nuevo
          </button>
        </div>
      </div>

      {/* PÍLDORA DE ORGANIZACIÓN (CON DROPDOWN DESPLEGABLE) */}
      <div className="relative w-full h-[10vh]">
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="w-full h-[6vh] flex items-center justify-between rounded-full text-[2.4vh] font-[400] bg-[#D9D9D9] hover:bg-[#CFCFCF] text-black transition-all active:scale-95 shadow-sm"
          style={{
            paddingLeft: '1.2vw',   // Linea 190: Separación del borde izquierdo de la píldora
            paddingRight: '1.2vw',
            paddingTop: '0.4vh',    // Linea 192: Separación superior de la píldora
          }}
        >
          <span className="truncate max-w-[84%] pr-2">{activeOrg.name}</span>
          <svg
            className={`w-6 h-6 opacity-70 flex-shrink-0 transition-transform ${isDropdownOpen ? 'rotate-180' : ''
              }`}
            fill="none"
            viewBox="0 0 25 25"
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
              {DEFAULT_MOCK_PROJECTS.map((proj: { id: string; name: string; posts: any[] }) => (
                <button
                  key={proj.id}
                  onClick={() => handleOrgChange(proj.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-colors flex items-center justify-between cursor-pointer ${proj.id === currentOrgId ? 'bg-black text-white' : 'hover:bg-neutral-100 text-black'
                    }`}
                >
                  <span className="truncate">{proj.name}</span>
                  <span className="text-[10px] opacity-60">({proj.posts?.length || 0})</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
