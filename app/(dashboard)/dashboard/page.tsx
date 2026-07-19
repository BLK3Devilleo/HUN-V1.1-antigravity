'use client';

import SocialSidebar from '@/components/dashboard/SocialSidebar';
import UploadQueueWidget from '@/components/dashboard/UploadQueueWidget';
import FolderCard from '@/components/dashboard/FolderCard';
import ContentStack from '@/components/dashboard/ContentStack';
import StorageBar from '@/components/dashboard/StorageBar';

export default function DashboardPage() {
  return (
    <div
      className="h-screen w-screen overflow-hidden relative"
      style={{ background: '#F2F2F2' }}
    >
      {/* =========================================================
          TOP BAR: "Build For Venezuela" + "PRO" pills
          ========================================================= */}
      <div
        className="absolute flex items-center"
        style={{ top: '4.1vh', left: '2.3vw', gap: '0.6vw' }}
      >
        <div
          className="rounded-full text-sm font-semibold text-black flex items-center justify-center select-none"
          style={{
            width: '15.5vw',
            height: '5.9vh',
            background: '#C4C4C4',
          }}
        >
          Build For Venezuela
        </div>
        <div
          className="px-6 rounded-full text-sm font-bold text-black flex items-center justify-center select-none"
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
          SIDEBAR (Redes Conectadas + Settings/Profile)
          ========================================================= */}
      <div
        className="absolute z-20"
        style={{ top: '12vh', left: '2.3vw' }}
      >
        <SocialSidebar />
      </div>

      {/* =========================================================
          HERO "NUH" Y BOTONES
          ========================================================= */}
      <div
        className="absolute w-full flex flex-col items-center"
        style={{ top: '8vh' }}
      >
        <p
          className="font-medium text-[#666666] select-none"
          style={{ fontSize: '1.1vw', marginBottom: '0.5vh' }}
        >
          Agiliza tu comunicación con...
        </p>

        {/* NUH GIGANTE */}
        <h1
          className="nuh-title tracking-[-0.04em] font-black leading-none text-center"
          style={{ fontSize: 'clamp(120px, 20vw, 380px)' }}
        >
          NUH
        </h1>
      </div>

      {/* BOTONES ORGANIZACIÓN Y CREAR */}
      <div
        className="absolute w-full flex justify-center"
        style={{ top: '42vh' }}
      >
        <div
          className="flex items-center"
          style={{ gap: '0.8vw' }}
        >
          {/* Botón Organización */}
          <button
            className="flex items-center justify-between px-5 rounded-full text-sm font-semibold border border-black/10"
            style={{
              width: '22vw',
              height: '5.5vh',
              background: '#D9D9D9',
              color: '#000000',
            }}
          >
            <span className="truncate pr-2">Organización núme...</span>
            <svg className="w-4 h-4 opacity-40 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Botón Crear */}
          <button
            className="btn-crear text-sm font-bold rounded-full flex items-center justify-center"
            style={{ width: '10vw', height: '5.5vh' }}
          >
            Crear
          </button>
        </div>
      </div>

      {/* =========================================================
          WIDGET UPLOAD QUEUE (Esquina superior derecha)
          ========================================================= */}
      <div
        className="absolute z-20"
        style={{
          top: '4vh',
          right: '2.3vw',
          width: '16vw',
          height: '48vh',
        }}
      >
        <UploadQueueWidget />
      </div>

      {/* =========================================================
          FOLDERS INFERIORES (5 carpetas)
          =========================================================
          Canva Pág 3: Contenido | Almacenamiento | Alcance total (mes) | Planificador | Comentarios
      */}
      <div
        className="absolute flex items-end"
        style={{
          bottom: '3vh',
          left: '2.3vw',
          right: '2.3vw',
          height: '22vh',
          gap: '1.2vw',
        }}
      >
        {/* Carpeta 1: Contenido (más alta y ancha) */}
        <div style={{ width: '16vw', height: '130%' }}>
          <FolderCard title="Contenido">
            <ContentStack />
          </FolderCard>
        </div>

        {/* Carpeta 2: Almacenamiento */}
        <div style={{ width: '18vw', height: '100%' }}>
          <FolderCard title="Almacenamiento">
            <StorageBar usedGB={3500} totalGB={3688} />
          </FolderCard>
        </div>

        {/* Carpeta 3: Alcance total (mes) */}
        <div style={{ width: '15vw', height: '100%' }}>
          <FolderCard title="Alcance total (mes)">
            <div className="flex flex-col justify-center h-full">
              <p className="text-3xl font-extrabold text-[#000000] tracking-tight leading-none">
                252K
              </p>
            </div>
          </FolderCard>
        </div>

        {/* Carpeta 4: Planificador */}
        <div style={{ width: '15vw', height: '100%' }}>
          <FolderCard title="Planificador">
            <div className="flex flex-col justify-center h-full">
              <p className="text-3xl font-extrabold text-[#000000] tracking-tight leading-none">
                8 hoy
              </p>
            </div>
          </FolderCard>
        </div>

        {/* Carpeta 5: Comentarios */}
        <div style={{ width: '15vw', height: '100%' }}>
          <FolderCard title="Comentarios">
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
      </div>
    </div>
  );
}
