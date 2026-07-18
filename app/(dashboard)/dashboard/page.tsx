'use client';

import { motion } from 'framer-motion';
import BackgroundEffects from '@/components/dashboard/BackgroundEffects';
import SocialSidebar from '@/components/dashboard/SocialSidebar';
import UploadQueueWidget from '@/components/dashboard/UploadQueueWidget';
import FolderCard from '@/components/dashboard/FolderCard';
import ContentStack from '@/components/dashboard/ContentStack';
import StorageBar from '@/components/dashboard/StorageBar';

export default function DashboardPage() {
  return (
    <div
      className="h-screen w-screen overflow-hidden relative flex flex-col"
      style={{
        paddingTop: '48px', // Padding Externo Superior: 48px
        paddingLeft: '40px', // Padding Externo Lateral Izquierdo: 40px
        paddingRight: '40px', // Padding Externo Lateral Derecho: 40px
        paddingBottom: '40px',
      }}
    >
      {/* ================================================
          CAPA 0: Fondo base (Gris Mercurio #F2F2F2)
          ================================================ */}
      <div className="fixed inset-0 z-0" style={{ background: '#F2F2F2' }} />

      {/* ================================================
          CAPA 1: Efectos animados (Aurora vibrante)
          ================================================ */}
      <BackgroundEffects />

      {/* ================================================
          CAPA 2: Cristal semi-transparente (Opacidad baja a 0.35 para transparencia real)
          ================================================ */}
      <div
        className="fixed inset-0 z-[1] pointer-events-none"
        style={{
          background: 'rgba(242, 242, 242, 0.35)',
          backdropFilter: 'blur(60px) saturate(1.2)',
          WebkitBackdropFilter: 'blur(60px) saturate(1.2)',
        }}
      />

      {/* ================================================
          CAPA 3: Todo el contenido UI (encima del cristal)
          ================================================ */}
      <div className="relative z-10 h-full flex flex-col justify-between">
        
        {/* ------ TOP BAR (Navegación sutil según diseño) ------ */}
        <header className="flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            {/* Cápsula de navegación superior */}
            <div className="w-[100px] h-[24px] rounded-full bg-black/[0.08]" />
            <div className="w-[50px] h-[24px] rounded-full bg-black/[0.08]" />
          </div>
          <div />
        </header>

        {/* ------ MIDDLE CONTENT: Sidebar + Hero + Widget ------ */}
        <main className="flex-1 flex items-center justify-between min-h-0 relative">
          
          {/* LEFT: Social Sidebar (Ancho colapsado ~80px) */}
          <div className="z-20">
            <SocialSidebar />
          </div>

          {/* CENTER: Hero NUH */}
          <div className="flex flex-col items-center justify-center -mt-[2vh]">
            {/* Subtítulo - Separado por 12px de NUH */}
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="text-xs md:text-sm font-medium text-[var(--nuh-text-secondary)] italic select-none"
              style={{ marginBottom: '12px' }} // Separación de 12px
            >
              Agiliza tu comunicación con...
            </motion.p>

            {/* NUH GIGANTE (Extra-bold, kerning negativo de -0.04em) */}
            <motion.h1
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: [0.25, 0.8, 0.25, 1] }}
              className="nuh-title tracking-[-0.04em] font-black leading-none"
              style={{
                fontSize: 'clamp(100px, 15vw, 240px)',
              }}
            >
              NUH
            </motion.h1>

            {/* Botonera - Separada por 20px de NUH */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="flex items-center gap-3"
              style={{ marginTop: '20px' }} // Separación de 20px
            >
              {/* Selector "Organización" (Ancho ~220px, Chevron a 12px del borde, truncado a 17 chars) */}
              <button
                className="flex items-center justify-between px-4 py-2.5 rounded-full text-xs font-semibold border border-black/5 transition-all hover:bg-black/[0.03] active:scale-95"
                style={{
                  width: '220px',
                  background: 'rgba(0, 0, 0, 0.05)',
                  color: '#000000',
                }}
              >
                <span className="truncate pr-2">
                  {"Organización núme...".substring(0, 17)}
                </span>
                <svg
                  className="w-3.5 h-3.5 opacity-40 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  style={{ marginRight: '2px' }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Botón "Crear" (Ancho ~110px, Gradiente de 90° y centrado absoluto) */}
              <button
                className="btn-crear text-xs font-bold rounded-full flex items-center justify-center shadow-sm"
                style={{
                  width: '110px',
                  height: '36px',
                }}
              >
                Crear
              </button>
            </motion.div>
          </div>

          {/* RIGHT: Upload Queue Widget */}
          <div className="z-20">
            <UploadQueueWidget />
          </div>
        </main>

        {/* ------ BOTTOM DOCK: Los 4 Widgets ------ */}
        {/* Separación vertical de 64px del bloque central (incorporado mediante flex-1 en main y justify-between en contenedor) */}
        <div className="flex-shrink-0 pt-[24px]">
          <div
            className="grid grid-cols-2 lg:grid-cols-4 gap-[24px]" // Separación horizontal (Gutter) de 24px
            style={{
              height: 'clamp(140px, 20vh, 200px)',
            }}
          >
            {/* Carpeta 1: Contenido */}
            <FolderCard title="Contenido" delay={0.1}>
              <ContentStack />
            </FolderCard>

            {/* Carpeta 2: Almacenamiento */}
            <FolderCard title="Almacenamiento" delay={0.15}>
              <StorageBar usedGB={238} totalGB={688} />
            </FolderCard>

            {/* Carpeta 3: Alcance total */}
            <FolderCard title="Alcance total (mes)" delay={0.2}>
              <div className="flex flex-col justify-center h-full gap-1">
                <p className="text-2xl font-black text-[#000000] tracking-tight leading-none">
                  24.8K
                </p>
                <p className="text-[9px] font-semibold text-[var(--nuh-text-secondary)]">
                  +12.3% vs. mes anterior
                </p>
                <div className="flex items-end gap-[2px] h-6 mt-1.5">
                  {[35, 50, 42, 65, 55, 80, 72, 90, 85, 95].map((h, i) => (
                    <motion.div
                      key={i}
                      initial={{ height: 0 }}
                      animate={{ height: `${h}%` }}
                      transition={{ duration: 0.4, delay: 0.3 + i * 0.03 }}
                      className="flex-1 rounded-sm"
                      style={{
                        background: h > 70 ? '#808080' : 'rgba(0,0,0,0.1)',
                      }}
                    />
                  ))}
                </div>
              </div>
            </FolderCard>

            {/* Carpeta 4: Planificador */}
            <FolderCard title="Planificador" delay={0.25}>
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
        </div>

      </div>
    </div>
  );
}
