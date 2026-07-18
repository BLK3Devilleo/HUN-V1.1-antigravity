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
      style={{
        background: '#F2F2F2',
      }}
    >
      {/* 
        =========================================================
        SIDEBAR (Redes Conectadas)
        ========================================================= 
      */}
      <div 
        className="absolute z-20"
        style={{
          top: '16.9vh', // Padding superior: 16.9% del alto del vw (Documento asume vw=vh en algunas partes, usaremos vh para vertical)
          left: '2.3vw', // Padding izquierdo: 2.3% del ancho del vw
        }}
      >
        <SocialSidebar />
      </div>

      {/* 
        =========================================================
        HERO "NUH" Y BOTONES
        ========================================================= 
      */}
      <div 
        className="absolute w-full flex flex-col items-center"
        style={{
          top: '14.1vh', // Padding superior del vw: (152px) 14.1% del alto
        }}
      >
        <p
          className="font-medium text-[var(--nuh-text-secondary)] italic select-none"
          style={{
            fontSize: '1.2vw',
            marginBottom: '0.8vh',
          }}
        >
          Agiliza tu comunicación con...
        </p>

        {/* NUH GIGANTE - Ancho exacto 33% del vw según PDF */}
        <div style={{ width: '33vw', textAlign: 'center' }}>
          <h1
            className="nuh-title tracking-[-0.04em] font-black leading-none"
            style={{
              fontSize: '26vw', // Aproximación para que el texto llene el ancho de 33vw
            }}
          >
            NUH
          </h1>
        </div>
      </div>

      {/* CONTENEDOR BOTONES ORGANIZACIÓN Y CREAR */}
      <div 
        className="absolute w-full flex justify-center"
        style={{
          top: '40.7vh', // Posición centrado verticalmente con padding superior 40.7% del alto
        }}
      >
        <div 
          className="flex items-center"
          style={{
            width: '35.9vw',
            height: '7.2vh',
            gap: '0.5vw', // Padding entre botones: .5% del ancho
          }}
        >
          {/* Botón Organización */}
          <button
            className="flex items-center justify-between px-4 rounded-full text-xs font-semibold border border-black/10"
            style={{
              width: '23.5vw', // 23.5% del ancho del vw
              height: '7.2vh',
              background: '#D9D9D9',
              color: '#000000',
            }}
          >
            <span className="truncate pr-2">
              {"Organización núme...".substring(0, 17)}
            </span>
            <svg
              className="w-4 h-4 opacity-40 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Botón Crear */}
          <button
            className="btn-crear text-xs font-bold rounded-full flex items-center justify-center shadow-sm"
            style={{
              width: '12vw', // 12% del ancho del vw
              height: '7.2vh',
            }}
          >
            Crear
          </button>
        </div>
      </div>

      {/* 
        =========================================================
        WIDGET UPLOAD QUEUE
        ========================================================= 
      */}
      <div 
        className="absolute z-20"
        style={{
          top: '4.1vh', // Padding límite superior: 4.1% del alto
          right: '2.3vw', // Padding derecho: 2.3% del ancho
          width: '18.2vw', // 18.2% del ancho
          height: '43vh', // 43% del alto
        }}
      >
        <UploadQueueWidget />
      </div>

      {/* 
        =========================================================
        FOLDERS INFERIORES
        ========================================================= 
        Padding inferior con el borde de la pantalla: 4.1% del alto del vw
        Padding horizontal entre folders: 2% del ancho del vw
      */}
      <div 
        className="absolute flex items-end justify-between"
        style={{
          bottom: '4.1vh', 
          left: '2.3vw', 
          right: '2.3vw', 
          height: '17.7vh',
        }}
      >
        {/* Contenido (Izquierda) */}
        <div style={{ width: '16.1vw', height: '100%' }}>
          <FolderCard title="Contenido">
            <ContentStack />
          </FolderCard>
        </div>

        {/* Los 4 folders (De izquierda a derecha invertimos el orden de las medidas dadas "de derecha a izquierda") */}
        <div className="flex" style={{ gap: '2vw', height: '100%' }}>
          
          {/* Cuarto Folder según PDF (que es el 1ro de izquierda a derecha de los 4 de la derecha) */}
          <div style={{ width: '20.4vw', height: '100%' }}>
            <FolderCard title="Almacenamiento">
              <StorageBar usedGB={238} totalGB={688} />
            </FolderCard>
          </div>

          {/* Tercer Folder */}
          <div style={{ width: '16.5vw', height: '100%' }}>
            <FolderCard title="Alcance total (mes)">
              <div className="flex flex-col justify-center h-full gap-1">
                <p className="text-2xl font-black text-[#000000] tracking-tight leading-none">
                  24.8K
                </p>
                <p className="text-[9px] font-semibold text-[var(--nuh-text-secondary)]">
                  +12.3% vs. mes anterior
                </p>
                <div className="flex items-end gap-[2px] h-6 mt-1.5">
                  {[35, 50, 42, 65, 55, 80, 72, 90, 85, 95].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-sm"
                      style={{
                        height: `${h}%`,
                        background: h > 70 ? '#808080' : 'rgba(0,0,0,0.1)',
                      }}
                    />
                  ))}
                </div>
              </div>
            </FolderCard>
          </div>

          {/* Segundo Folder */}
          <div style={{ width: '25.3vw', height: '100%' }}>
            <FolderCard title="Planificador">
              <div className="flex flex-col justify-center h-full gap-2 text-left">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#808080]" />
                  <span className="text-[11px] font-medium text-[var(--nuh-text-secondary)]">3 posts hoy</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#808080]" />
                  <span className="text-[11px] font-medium text-[var(--nuh-text-secondary)]">7 programados</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#FF4D4D]" />
                  <span className="text-[11px] font-medium text-[var(--nuh-text-secondary)]">1 fallido</span>
                </div>
              </div>
            </FolderCard>
          </div>

          {/* Primer Folder (el más pegado a la derecha) */}
          <div style={{ width: '18.2vw', height: '100%' }}>
            <FolderCard title="Nuevo">
              <div className="flex items-center justify-center h-full">
                <span className="text-4xl font-light text-black/20">+</span>
              </div>
            </FolderCard>
          </div>

        </div>
      </div>

    </div>
  );
}
