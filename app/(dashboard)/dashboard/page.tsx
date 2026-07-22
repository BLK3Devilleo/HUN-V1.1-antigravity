'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence, type Transition } from 'framer-motion';
import Link from 'next/link';
import SocialSidebar from '@/components/dashboard/SocialSidebar';
import UploadQueueWidget from '@/components/dashboard/UploadQueueWidget';
import FolderCard from '@/components/dashboard/FolderCard';
import ContentStack from '@/components/dashboard/ContentStack';
import StorageBar from '@/components/dashboard/StorageBar';
import ConversationsSidebar from '@/components/dashboard/ConversationsSidebar';
import PostEditorWorkspace from '@/components/dashboard/PostEditorWorkspace';
import { createBrowserClient } from '@/lib/supabase';

interface SelectedMedia {
  file?: File;
  url: string;
  isVideo?: boolean;
}

export default function DashboardPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<SelectedMedia[]>([]);
  const [isEditorActive, setIsEditorActive] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState('org-1');
  const [activePostTitle, setActivePostTitle] = useState('Salvemos los árboles');
  const [activeModal, setActiveModal] = useState<'org' | 'profile' | 'storage' | 'reach' | 'planner' | 'comments' | null>(null);

  const supabase = createBrowserClient();

  const orgNames: Record<string, string> = {
    'org-1': 'Organización número 1',
    'org-2': 'Organización número 2',
    'org-3': 'Organización número 3',
  };

  // Selector de multimedia
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

  const handleCrearClick = () => {
    setActivePostTitle('Nueva Publicación');
    setIsEditorActive(true);
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleBackToDashboard = () => {
    setIsEditorActive(false);
  };

  const handleSelectPostFromSidebar = (postTitle: string) => {
    setActivePostTitle(postTitle);
    setIsEditorActive(true);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  const transitionProps: Transition = {
    duration: 0.4,
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

      {/* TOP BAR */}
      <div
        className="absolute flex items-center z-40"
        style={{ top: '4.0741vh', left: '2.2917vw', gap: '0.6vw' }}
      >
        <div
          className="rounded-full text-sm font-bold text-black flex items-center justify-center select-none shadow-sm cursor-pointer hover:bg-[#B8B8B8] transition-colors"
          style={{
            width: '15.5vw',
            height: '5.9vh',
            background: '#C4C4C4',
          }}
          onClick={handleBackToDashboard}
        >
          Build 4 Venezuela
        </div>
        <div
          className="px-6 rounded-full text-sm font-bold text-black flex items-center justify-center select-none shadow-sm cursor-pointer hover:bg-[#B8B8B8]"
          style={{
            width: '7vw',
            height: '5.9vh',
            background: '#C4C4C4',
          }}
          onClick={() => setActiveModal('profile')}
        >
          PRO
        </div>
      </div>

      {/* TÍTULO NUH */}
      <motion.div
        animate={{
          top: isEditorActive ? '4.0741vh' : '8vh',
          right: isEditorActive ? '2.2917vw' : '0vw',
          left: isEditorActive ? 'auto' : '0vw',
          width: isEditorActive ? 'auto' : '100%',
          scale: isEditorActive ? 0.22 : 1,
        }}
        transition={transitionProps}
        className={`absolute flex flex-col items-center pointer-events-none z-10 ${isEditorActive ? 'origin-top-right' : 'origin-top'
          }`}
        style={{ willChange: 'transform, top, right, left' }}
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
          className="nuh-title tracking-[-0.08em] font-black leading-none text-center select-none cursor-pointer"
          style={{ fontSize: 'clamp(120px, 20vw, 380px)' }}
          onClick={handleBackToDashboard}
        >
          NUH
        </h1>
      </motion.div>

      {/* SIDEBAR DE REDES Y NAVEGACIÓN COMPLETA */}
      <div
        className="absolute z-30"
        style={{
          top: '14.9vh',
          left: '2.2917vw',
          width: '5.2vw',
          height: '42vh',
        }}
      >
        <SocialSidebar
          isTransitioning={isEditorActive}
          onOpenProfile={() => setActiveModal('profile')}
        />
      </div>

      {/* DASHBOARD VIEW: BOTONES ORGANIZACIÓN Y CREAR */}
      <AnimatePresence>
        {!isEditorActive && (
          <motion.div
            key="dashboard-buttons"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.2, y: 300 }}
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

                {/* Dropdown de Organización */}
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

              {/* Botón Crear */}
              <button
                onClick={handleCrearClick}
                className="btn-crear text-sm font-bold rounded-full flex items-center justify-center transition-transform active:scale-95 hover:opacity-90 shadow-md cursor-pointer"
                style={{ width: '10vw', height: '5.5vh' }}
              >
                + Crear
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* WIDGET UPLOAD QUEUE */}
      <AnimatePresence>
        {!isEditorActive && (
          <motion.div
            key="dashboard-upload-queue"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, scale: 1.2, x: 400, y: -300 }}
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

      {/* SECCIÓN INFERIOR: CONTENIDO + 4 CARPETAS */}
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
            <motion.div
              exit={{ opacity: 0, scale: 1.2, x: -400, y: 300 }}
              transition={transitionProps}
              style={{ willChange: 'transform, opacity' }}
            >
              <ContentStack />
            </motion.div>

            <motion.div
              exit={{ opacity: 0, scale: 1.2, x: 500, y: 300 }}
              transition={transitionProps}
              className="flex flex-1 items-end justify-end pointer-events-auto"
              style={{ gap: '1.2vw', height: '100%', willChange: 'transform, opacity' }}
            >
              <div style={{ width: '18vw', height: '100%' }}>
                <FolderCard title="Almacenamiento" onClick={() => setActiveModal('storage')}>
                  <StorageBar usedGB={3500} totalGB={3688} />
                </FolderCard>
              </div>

              <div style={{ width: '15vw', height: '100%' }}>
                <FolderCard title="Alcance total (mes)" onClick={() => setActiveModal('reach')}>
                  <div className="flex flex-col justify-center h-full">
                    <p className="text-3xl font-extrabold text-[#000000] tracking-tight leading-none">
                      252K
                    </p>
                  </div>
                </FolderCard>
              </div>

              <div style={{ width: '15vw', height: '100%' }}>
                <FolderCard title="Planificador" onClick={() => setActiveModal('planner')}>
                  <div className="flex flex-col justify-center h-full">
                    <p className="text-3xl font-extrabold text-[#000000] tracking-tight leading-none">
                      8 hoy
                    </p>
                  </div>
                </FolderCard>
              </div>

              <div style={{ width: '15vw', height: '100%' }}>
                <FolderCard title="Comentarios" onClick={() => setActiveModal('comments')}>
                  <div className="flex flex-col justify-center h-full">
                    <p className="text-3xl font-extrabold text-[#000000] tracking-tight leading-none">
                      100
                    </p>
                    <p className="text-xs font-semibold text-[#666666] mt-1">
                      Nuevos
                    </p>
                  </div>
                </FolderCard>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* VISTA DEL EDITOR DE PUBLICACIÓN */}
      <AnimatePresence>
        {isEditorActive && (
          <div className="absolute inset-0 z-20 pointer-events-none">
            {/* Panel Izquierdo */}
            <motion.div
              key="editor-sidebar"
              initial={{ opacity: 0, scale: 0.9, x: -30 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.9, x: -30 }}
              transition={transitionProps}
              className="pointer-events-auto absolute"
              style={{
                top: '14.9vh',
                left: '2.2917vw',
                bottom: '4.0741vh',
              }}
            >
              <ConversationsSidebar
                onBackToDashboard={handleCrearClick}
                selectedOrg={selectedOrg}
                onSelectOrg={setSelectedOrg}
                onSelectPost={handleSelectPostFromSidebar}
              />
            </motion.div>

            {/* Panel Central */}
            <div
              className="absolute inset-x-0 flex justify-center pointer-events-none z-20"
              style={{
                top: '14.9vh',
                bottom: '4.0741vh',
              }}
            >
              <motion.div
                key="editor-workspace"
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={transitionProps}
                className="pointer-events-auto flex flex-col items-center justify-between"
                style={{
                  width: '56.8229vw',
                  height: '100%',
                }}
              >
                <PostEditorWorkspace
                  initialMedia={selectedFiles}
                  currentPostTitle={activePostTitle}
                  activeOrgId={selectedOrg}
                />
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL INTERACTIVO DE PERFIL DE USUARIO Y NAVEGACIÓN */}
      <AnimatePresence>
        {activeModal === 'profile' && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[35px] max-w-md w-full p-8 shadow-2xl border border-white/50 space-y-6"
            >
              {/* Header Profile */}
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-lg shadow-md">
                    👤
                  </div>
                  <div>
                    <h3 className="text-base font-black text-gray-900">Mi Perfil de Usuario</h3>
                    <p className="text-xs font-semibold text-gray-500">Sesión Activa NUH</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveModal(null)}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs flex items-center justify-center"
                >
                  ✕
                </button>
              </div>

              {/* Accesos Directos a Páginas Clave */}
              <div className="space-y-2">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">
                  Navegación Rápida
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/dashboard/feed"
                    onClick={() => setActiveModal(null)}
                    className="p-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 rounded-2xl border border-emerald-200 flex items-center gap-2 text-xs font-black transition-all"
                  >
                    <span>🌐 Feed Global</span>
                  </Link>
                  <Link
                    href="/dashboard/admin"
                    onClick={() => setActiveModal(null)}
                    className="p-3 bg-purple-50 hover:bg-purple-100 text-purple-900 rounded-2xl border border-purple-200 flex items-center gap-2 text-xs font-black transition-all"
                  >
                    <span>🛡️ Panel Admin</span>
                  </Link>
                  <Link
                    href="/dashboard/gallery"
                    onClick={() => setActiveModal(null)}
                    className="p-3 bg-blue-50 hover:bg-blue-100 text-blue-900 rounded-2xl border border-blue-200 flex items-center gap-2 text-xs font-black transition-all"
                  >
                    <span>🖼️ Mi Galería</span>
                  </Link>
                  <Link
                    href="/dashboard/settings"
                    onClick={() => setActiveModal(null)}
                    className="p-3 bg-slate-50 hover:bg-slate-100 text-slate-900 rounded-2xl border border-slate-200 flex items-center gap-2 text-xs font-black transition-all"
                  >
                    <span>⚙️ Ajustes</span>
                  </Link>
                </div>
              </div>

              {/* Botón Cerrar Sesión */}
              <div className="pt-2">
                <button
                  onClick={handleLogout}
                  className="w-full py-3.5 px-4 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-black uppercase tracking-wider transition-all shadow-md hover:scale-105 cursor-pointer"
                >
                  Cerrar Sesión
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
