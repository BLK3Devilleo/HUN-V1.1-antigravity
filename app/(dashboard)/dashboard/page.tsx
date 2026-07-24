'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, type Transition } from 'framer-motion';
import SocialSidebar from '@/components/dashboard/SocialSidebar';
import UploadQueueWidget from '@/components/dashboard/UploadQueueWidget';
import FolderCard from '@/components/dashboard/FolderCard';
import ContentStack from '@/components/dashboard/ContentStack';
import StorageBar from '@/components/dashboard/StorageBar';
import ConversationsSidebar from '@/components/dashboard/ConversationsSidebar';
import PostEditorWorkspace from '@/components/dashboard/PostEditorWorkspace';

interface SelectedMedia {
  file: File;
  url: string;
  isVideo: boolean;
}

export default function DashboardPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<SelectedMedia[]>([]);
  const [isEditorActive, setIsEditorActive] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState('org-1');
  const [activeModal, setActiveModal] = useState<'org' | 'profile' | 'storage' | 'reach' | 'planner' | 'comments' | null>(null);
  const [activeConversation, setActiveConversation] = useState<{ id: string; title: string; date: string } | null>(null);

  useEffect(() => {
    async function loadData() {
      const { getDashboardData } = await import('@/app/actions/dashboard');
      const data = await getDashboardData();
      if (data.organizations && data.organizations.length > 0) {
        const map: Record<string, string> = {};
        data.organizations.forEach((o) => {
          map[o.id] = o.name;
        });
        setOrgNames(map);
        setSelectedOrg(data.activeOrgId || data.organizations[0].id);
      }
      setMetrics({
        usedGB: data.storage.usedGB,
        totalGB: data.storage.totalGB,
        reachCount: data.reachCount,
        plannerCount: data.plannerCount,
        commentsCount: data.commentsCount,
      });
    }
    loadData();
  }, []);

  const [conversationsList, setConversationsList] = useState<{ id: string; title: string; active?: boolean }[]>([
    { id: '1', title: 'Salvemos los árboles' },
    { id: '2', title: 'Esterilizacion de lomi...' },
    { id: '3', title: 'Técnicas de cuidado...' },
    { id: '4', title: 'Cultivos en casa fáci...' },
  ]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  // Selector de multimedia al hacer clic en "Crear"
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).map((file) => ({
        file,
        url: URL.createObjectURL(file),
        isVideo: file.type.startsWith('video/'),
      }));
      setSelectedFiles((prev) => [...prev, ...newFiles]);
    }
  };

  // Abrir vista desde 0 al hacer clic en "Crear" o "+ Crear nuevo"
  const handleNewPostClick = () => {
    setSelectedFiles([]);
    setActiveConversationId(null);
    setIsEditorActive(true);
  };

  const handleCrearClick = handleNewPostClick;

  // Crear una nueva conversación en el menú izquierdo solo al escribir o añadir media
  const handleContentStarted = (titleHint: string) => {
    if (!activeConversationId) {
      const newId = `conv-${Date.now()}`;
      const title = titleHint.trim() ? titleHint.slice(0, 22) : 'Nueva Publicación';
      setConversationsList((prev) => [{ id: newId, title }, ...prev]);
      setActiveConversationId(newId);
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCancelSelection = () => {
    setSelectedFiles([]);
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Iniciar transición al Editor
  const handleConfirm = () => {
    setIsEditorActive(true);
  };

  // Volver al Dashboard (Guardar sesión y revertir animación)
  const handleBackToDashboard = () => {
    setIsEditorActive(false);
  };

  const transitionProps: Transition = {
    duration: 0.6,
    ease: [0.25, 0.8, 0.25, 1],
  };

  return (
    <div
      className="h-screen w-screen overflow-hidden relative"
      style={{ background: '#F2F2F2' }}
    >
      {/* Input de multimedia oculto */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        multiple
        accept="image/*,video/*"
        className="hidden"
      />

      {/* =========================================================
          TOP BAR: "Build For Venezuela" + "PRO"
          PERMANECEN FIJAS EN LA ESQUINA SUPERIOR IZQUIERDA (No se mueven)
          ========================================================= */}
      <div
        className="absolute flex items-center z-40"
        style={{ top: '4.0741vh', left: '2.2917vw', gap: '0.6vw' }}
      >
        <div
          className="rounded-full text-sm font-semibold text-black flex items-center justify-center select-none shadow-sm"
          style={{
            width: '15.5vw',
            height: '5.9vh',
            background: '#C4C4C4',
          }}
        >
          Build For Venezuela
        </div>
        <div
          className="px-6 rounded-full text-sm font-bold text-black flex items-center justify-center select-none shadow-sm"
          style={{
            width: '7vw',
            height: '5.9vh',
            background: '#C4C4C4',
          }}
        >
          PRO
        </div>
      </div>

      {/* =========================================================
          TÍTULO NUH: En modo Editor se encoge y se coloca arriba a la derecha
          Padding al límite superior (44px = 4.0741vh) y derecho (44px = 2.2917vw)
          ========================================================= */}
      <motion.div
        animate={{
          top: isEditorActive ? '4.0741vh' : '8vh',
          right: isEditorActive ? '2.2917vw' : '0vw',
          left: isEditorActive ? 'auto' : '0vw',
          width: isEditorActive ? 'auto' : '100%',
          scale: isEditorActive ? 0.22 : 1,
        }}
        transition={transitionProps}
        className={`absolute flex flex-col items-center z-30 ${
          isEditorActive
            ? 'origin-top-right cursor-pointer pointer-events-auto hover:opacity-80 transition-opacity'
            : 'origin-top pointer-events-none'
        }`}
        style={{ willChange: 'transform, top, right, left' }}
        onClick={() => {
          if (isEditorActive) {
            handleBackToDashboard();
          }
        }}
        title={isEditorActive ? 'Volver al inicio' : undefined}
      >
        {!isEditorActive && (
          <p
            className="font-medium text-[#666666] select-none"
            style={{ fontSize: '1.1vw', marginBottom: '10vh' }}
          >
            Agiliza tu comunicación con...
          </p>
        )}

        <h1
          className="nuh-title tracking-[-0.08em] font-black leading-none text-center select-none"
          style={{ fontSize: 'clamp(120px, 20vw, 380px)' }}
        >
          NUH
        </h1>
      </motion.div>

      {/* =========================================================
          SIDEBAR: Redes + Botón de Ajustes (Permanece fijo)
          ========================================================= */}
      <div
        className="absolute z-30"
        style={{
          top: '14.9vh',
          left: '2.2917vw',
          width: '5.2vw',
          height: '40vh',
        }}
      >
        <SocialSidebar
          isTransitioning={isEditorActive}
          onOpenProfile={() => setActiveModal('profile')}
        />
      </div>

      {/* =========================================================
          DASHBOARD VIEW: BOTONES ORGANIZACIÓN Y CREAR
          ========================================================= */}
      <AnimatePresence>
        {!isEditorActive && (
          <motion.div
            key="dashboard-buttons"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.3, y: 350 }}
            transition={transitionProps}
            className="absolute w-full flex flex-col items-center pointer-events-none z-30"
            style={{ top: '42vh', willChange: 'transform, opacity' }}
          >
            <div
              className="flex items-center pointer-events-auto relative"
              style={{ gap: '0.8vw' }}
            >
              {/* Botón Organización Desplegable */}
              <div className="relative">
                <button
                  onClick={() => setActiveModal(activeModal === 'org' ? null : 'org')}
                  className="flex items-center justify-between px-5 rounded-full text-sm font-semibold border border-black/10 transition-transform active:scale-95 cursor-pointer shadow-sm hover:bg-[#CCCCCC]"
                  style={{
                    width: '22vw',
                    height: '5.5vh',
                    background: '#D9D9D9',
                    color: '#000000',
                  }}
                >
                  <span className="truncate pr-2">{orgNames[selectedOrg] || 'Seleccionar Organización'}</span>
                  <svg
                    className={`w-4 h-4 opacity-60 flex-shrink-0 transition-transform ${activeModal === 'org' ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {/* Dropdown de Organización en Dashboard */}
                <AnimatePresence>
                  {activeModal === 'org' && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 10, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      className="absolute top-full left-0 w-full bg-white rounded-2xl border border-black/10 shadow-2xl p-2 z-50 flex flex-col gap-1"
                    >
                      {Object.entries(orgNames).map(([id, name]) => (
                        <button
                          key={id}
                          onClick={() => {
                            setSelectedOrg(id);
                            setActiveModal(null);
                          }}
                          className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                            selectedOrg === id
                              ? 'bg-black text-white'
                              : 'hover:bg-neutral-100 text-black'
                          }`}
                        >
                          <span>{name}</span>
                          {selectedOrg === id && <span>✓</span>}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Botón Crear (Abre el selector multimedia) */}
              <button
                onClick={handleCrearClick}
                className="btn-crear text-sm font-bold rounded-full flex items-center justify-center transition-transform active:scale-95 hover:opacity-90 shadow-md"
                style={{ width: '10vw', height: '5.5vh' }}
              >
                Crear
              </button>
            </div>

            {/* PREVISUALIZACIÓN MULTIMEDIA Y ACCIONES (CONFIRMAR, CANCELAR, AÑADIR MÁS) EN EL DASHBOARD */}
            <AnimatePresence>
              {selectedFiles.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 15, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="pointer-events-auto mt-4 p-3 px-4 rounded-2xl bg-white/95 backdrop-blur-md border border-black/10 shadow-xl flex items-center justify-between gap-4"
                  style={{ maxWidth: '50vw' }}
                >
                  <div className="flex items-center gap-2.5 overflow-x-auto max-w-[26vw] py-1 scrollbar-none">
                    {selectedFiles.map((media, idx) => (
                      <div
                        key={idx}
                        className="relative group flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden border border-black/10 bg-black/5 shadow-sm"
                      >
                        {media.isVideo ? (
                          <video src={media.url} className="w-full h-full object-cover" />
                        ) : (
                          <img src={media.url} alt={`preview-${idx}`} className="w-full h-full object-cover" />
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveFile(idx);
                          }}
                          className="absolute top-0.5 right-0.5 bg-black/70 hover:bg-red-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Eliminar"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Acciones: + Añadir más, Cancelar, Confirmar */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={handleCrearClick}
                      className="px-3.5 py-2 rounded-full text-xs font-bold bg-neutral-100 hover:bg-neutral-200 text-black border border-black/10 transition-all active:scale-95 flex items-center gap-1 cursor-pointer"
                      title="Añadir más archivos multimedia"
                    >
                      <span className="text-sm font-extrabold">+</span>
                      <span>Añadir</span>
                    </button>

                    <button
                      onClick={handleCancelSelection}
                      className="px-3.5 py-2 rounded-full text-xs font-bold bg-neutral-200 hover:bg-neutral-300 text-neutral-800 transition-all active:scale-95 cursor-pointer"
                      title="Cancelar selección"
                    >
                      Cancelar
                    </button>

                    <button
                      onClick={handleConfirm}
                      className="px-5 py-2 rounded-full text-xs font-black uppercase tracking-wider bg-black text-white hover:bg-neutral-800 transition-all active:scale-95 flex items-center gap-1.5 shadow-md cursor-pointer"
                    >
                      <span>Confirmar</span>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* WIDGET UPLOAD QUEUE (Esquina superior derecha en Dashboard) */}
      <AnimatePresence>
        {!isEditorActive && (
          <motion.div
            key="dashboard-upload-queue"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, scale: 1.3, x: 500, y: -350 }}
            transition={transitionProps}
            className="absolute z-20"
            style={{
              top: '4.1vh',
              right: '2.3vw',
              width: '18.2vw',
              height: '43vh',
              willChange: 'transform, opacity',
            }}
          >
            <UploadQueueWidget />
          </motion.div>
        )}
      </AnimatePresence>

      {/* SECCIÓN INFERIOR: CONTENIDO (CARD) + 4 CARPETAS */}
      <AnimatePresence>
        {!isEditorActive && (
          <motion.div
            key="dashboard-bottom-row"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={transitionProps}
            className="absolute flex items-end justify-between z-20"
            style={{
              bottom: '4.0741vh',
              left: '2.2917vw',
              right: '2.2917vw',
              height: '22vh',
              gap: '1.2vw',
            }}
          >
            {/* Apartado 1: Contenido */}
            <motion.div
              exit={{ opacity: 0, scale: 1.3, x: -500, y: 350 }}
              transition={transitionProps}
              style={{ willChange: 'transform, opacity' }}
            >
              <ContentStack />
            </motion.div>

            {/* Grupo de 4 Folders */}
            <motion.div
              exit={{ opacity: 0, scale: 1.3, x: 600, y: 350 }}
              transition={transitionProps}
              className="flex flex-1 items-end justify-end pointer-events-auto"
              style={{ gap: '1.2vw', height: '100%', willChange: 'transform, opacity' }}
            >
              <div style={{ width: '18vw', height: '100%' }}>
                <FolderCard title="Almacenamiento" onClick={() => setActiveModal('storage')}>
                  <StorageBar usedGB={metrics.usedGB} totalGB={metrics.totalGB} />
                </FolderCard>
              </div>

              <div style={{ width: '15vw', height: '100%' }}>
                <FolderCard title="Alcance total (mes)" onClick={() => setActiveModal('reach')}>
                  <div className="flex flex-col justify-center h-full">
                    <p className="text-3xl font-extrabold text-[#000000] tracking-tight leading-none">
                      {metrics.reachCount >= 1000 ? `${Math.round(metrics.reachCount / 1000)}K` : metrics.reachCount}
                    </p>
                  </div>
                </FolderCard>
              </div>

              <div style={{ width: '15vw', height: '100%' }}>
                <FolderCard title="Planificador" onClick={() => setActiveModal('planner')}>
                  <div className="flex flex-col justify-center h-full">
                    <p className="text-3xl font-extrabold text-[#000000] tracking-tight leading-none">
                      {metrics.plannerCount} hoy
                    </p>
                  </div>
                </FolderCard>
              </div>

              <div style={{ width: '15vw', height: '100%' }}>
                <FolderCard title="Comentarios" onClick={() => setActiveModal('comments')}>
                  <div className="flex flex-col justify-center h-full">
                    <p className="text-3xl font-extrabold text-[#000000] tracking-tight leading-none">
                      {metrics.commentsCount}
                    </p>
                    <p className="text-xs font-semibold text-[var(--nuh-text-secondary)] mt-1">
                      Nuevos
                    </p>
                  </div>
                </FolderCard>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =========================================================
          NUEVA VISTA: EDITOR DE PUBLICACIÓN (ANIMADA DESDE EL CENTRO)
          ========================================================= */}
      <AnimatePresence>
        {isEditorActive && (
          <div className="absolute inset-0 z-20 pointer-events-none">
            {/* Panel Izquierdo: Trabajos en draft (Carpetas) - Separado exactamente 44px (2.2917vw) del borde izquierdo */}
            <motion.div
              key="editor-sidebar"
              initial={{ opacity: 0, scale: 0.8, x: -50 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8, x: -50 }}
              transition={transitionProps}
              className="pointer-events-auto absolute"
              style={{
                top: '16.5741vh',
                left: '2.2917vw',
                bottom: '4.0741vh',
              }}
            >
              <ConversationsSidebar
                onBackToDashboard={handleBackToDashboard}
                selectedOrg={selectedOrg}
                onSelectOrg={setSelectedOrg}
                onSelectConversation={(item) => {
                  setActiveConversation(item);
                  setActiveConversationId(item.id);
                }}
                onNewPostClick={handleNewPostClick}
                conversationsList={conversationsList}
                activeConversationId={activeConversationId}
              />
            </motion.div>

            {/* Panel Central/Derecho: Editor Workspace Centrado visualmente por su centro (1091px @ 1920px = 56.8229vw) */}
            <div
              className="absolute inset-x-0 flex justify-center pointer-events-none z-20"
              style={{
                top: '16.5741vh',
                bottom: '4.0741vh',
              }}
            >
              <motion.div
                key="editor-workspace"
                initial={{ opacity: 0, scale: 0.8, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 30 }}
                transition={transitionProps}
                className="pointer-events-auto flex flex-col items-center justify-between"
                style={{
                  width: '56.8229vw',
                  height: '100%',
                }}
              >
                <PostEditorWorkspace
                  initialMedia={selectedFiles}
                  onContentStarted={handleContentStarted}
                  activeConversationId={activeConversationId}
                />
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
