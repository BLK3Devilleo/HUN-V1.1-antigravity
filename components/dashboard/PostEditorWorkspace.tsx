'use client';

import { useState } from 'react';

interface SelectedMedia {
  file: File;
  url: string;
  isVideo: boolean;
}

interface PostEditorWorkspaceProps {
  initialMedia: SelectedMedia[];
  currentPostTitle?: string;
}

const DEFAULT_IMAGES = [
  'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=800&q=80',
];

const SOCIAL_PLATFORMS = [
  { id: 'facebook', name: 'Facebook', icon: 'f' },
  { id: 'instagram', name: 'Instagram', icon: '📷' },
  { id: 'x', name: 'X', icon: '𝕏' },
  { id: 'linkedin', name: 'LinkedIn', icon: 'in' },
  { id: 'tiktok', name: 'TikTok', icon: '🎵' },
];

export default function PostEditorWorkspace({
  initialMedia,
  currentPostTitle = 'Salvemos los árboles',
}: PostEditorWorkspaceProps) {
  const [caption, setCaption] = useState('');
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [selectedPlatform, setSelectedPlatform] = useState('facebook');
  const [thumbnails, setThumbnails] = useState<string[]>(
    initialMedia.length > 0
      ? initialMedia.map((m) => m.url)
      : DEFAULT_IMAGES
  );

  const activeMediaUrl = thumbnails[activeMediaIndex] || DEFAULT_IMAGES[0];
  const isVideo = initialMedia[activeMediaIndex]?.isVideo || false;

  // Manejar adición de nueva imagen
  const handleAddImage = () => {
    const nextImage =
      DEFAULT_IMAGES[thumbnails.length % DEFAULT_IMAGES.length];
    if (thumbnails.length < 7) {
      setThumbnails((prev) => [...prev, nextImage]);
    }
  };

  return (
    <div className="flex flex-col items-center justify-start gap-[1.2037vh] w-full select-none relative">
      {/* TÍTULO SUPERIOR CENTRADO */}
      <h2 className="text-sm font-bold text-black tracking-tight mb-1 text-center">
        {currentPostTitle}
      </h2>

      {/* CONTENEDOR DE PREVISUALIZACIÓN DE CONTENIDO DE 1091px (56.8229vw) x 398px (36.8519vh) CENTRADO */}
      <div className="relative w-full flex items-center justify-center">
        {/* RECUADRO DE PREVISUALIZACIÓN DE CONTENIDO (IMAGEN + DOTS + DESCRIPCIÓN) - 1091px x 398px */}
        <div className="bg-white/60 backdrop-blur-sm border-2 border-[#888888]/40 rounded-[26px] p-3 flex gap-3 items-center justify-between w-[56.8229vw] h-[36.8519vh] shadow-sm">
          {/* COLUMNA IZQUIERDA: CONTENEDOR DE LA IMAGEN (SIEMPRE CUADRADO CON ASPECT-SQUARE, ALTO DE REFERENCIA 84.4221%) Y PUNTOS DE PAGINACIÓN */}
          <div
            className="flex flex-col items-center justify-between h-full"
            style={{
              marginLeft: '1.3749%',
            }}
          >
            {/* CONTENEDOR DE LA IMAGEN (336px x 336px) - SIEMPRE CUADRADO, TOMA DE REFERENCIA EL ALTO DEL CONTENEDOR GENERAL */}
            <div
              className="aspect-square rounded-[18px] overflow-hidden border border-black/10 bg-neutral-900 flex items-center justify-center shadow-sm"
              style={{
                height: '84.4221%',
                marginTop: '3.7688%',
              }}
            >
              {isVideo ? (
                <video
                  src={activeMediaUrl}
                  controls
                  className="w-full h-full object-cover"
                />
              ) : (
                <img
                  src={activeMediaUrl}
                  alt="active-media"
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            {/* PUNTOS DE PAGINACIÓN DE CARRUSEL (Centrados con la imagen, 15px = 3.7688% del borde inferior) */}
            <div
              className="flex items-center justify-center gap-1.5 w-full"
              style={{
                marginBottom: '3.7688%',
              }}
            >
              {Array.from({ length: Math.max(7, thumbnails.length) }).map(
                (_, idx) => (
                  <span
                    key={idx}
                    className={`rounded-full transition-all ${
                      idx === activeMediaIndex
                        ? 'w-2 h-2 bg-[#555555]'
                        : 'w-1.5 h-1.5 bg-[#BBBBBB]'
                    }`}
                  />
                )
              )}
            </div>
          </div>

          {/* COLUMNA DERECHA: RECUADRO VISTA PREVIA DE TEXTO (SE ADAPTA AUTOMÁTICAMENTE CON FLEX-1, ALTO DE 91.4573%, CENTRADO VERTICALMENTE) */}
          <div
            className="flex-1 bg-white border-2 border-[#888888]/40 rounded-[18px] p-4 flex flex-col overflow-y-auto self-center"
            style={{
              height: '91.4573%',
              marginRight: '1.3749%',
            }}
          >
            {caption.trim() ? (
              <p className="text-xs font-normal text-black leading-relaxed whitespace-pre-wrap">
                {caption}
              </p>
            ) : (
              <span className="text-xs italic text-[#999999] font-normal">
                Descripción de contenido
              </span>
            )}
          </div>
        </div>

        {/* BARRA DERECHA DE REDES SOCIALES (Ubicada al lado derecho del recuadro de 1091px con su separación) */}
        <div className="absolute left-[calc(50%+28.41145vw+1.2vw)] flex flex-col items-center gap-2">
          {/* Botón superior chevron down */}
          <button className="w-11 h-11 bg-[#888888] hover:bg-[#777777] text-white rounded-full flex items-center justify-center shadow-sm transition-transform active:scale-95">
            <svg
              className="w-6 h-6"
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

          {/* Barra vertical de redes sociales */}
          <div className="bg-[#D9D9D9] p-1 rounded-full flex flex-col gap-1.5 border border-black/10 shadow-sm">
            {SOCIAL_PLATFORMS.map((plat) => {
              const isSelected = selectedPlatform === plat.id;
              return (
                <button
                  key={plat.id}
                  onClick={() => setSelectedPlatform(plat.id)}
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all ${isSelected
                    ? 'bg-black text-white shadow-md scale-105'
                    : 'bg-black/80 text-white/90 hover:bg-black'
                    }`}
                  title={plat.name}
                >
                  {plat.id === 'facebook' && 'f'}
                  {plat.id === 'instagram' && (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                    </svg>
                  )}
                  {plat.id === 'x' && '𝕏'}
                  {plat.id === 'linkedin' && 'in'}
                  {plat.id === 'tiktok' && (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* BARRA INTERMEDIA DE CONTROL Y MINIATURAS (838px x 129px) + BOTONES (217px x 61px) - ANCHO TOTAL 1091px (56.8229vw) */}
      <div
        className="flex flex-col items-center gap-1 w-[56.8229vw]"
        style={{ marginTop: '.2vh' }}
      >
        <div className="w-full flex items-stretch justify-between">
          {/* Contenedor general de miniaturas (838px x 129px = 43.6458vw x 11.9444vh) */}
          <div className="w-[43.6458vw] h-[11.9444vh] bg-[#E5E5E5]/60 backdrop-blur-sm border-2 border-[#888888]/40 rounded-[22px] p-3 px-4 flex items-center justify-between shadow-sm">
            {/* Fila de 7 cajas de miniaturas */}
            <div className="flex items-center gap-2.5">
              {Array.from({ length: 7 }).map((_, idx) => {
                const thumbUrl = thumbnails[idx];
                const isActive = idx === activeMediaIndex;

                return (
                  <div
                    key={idx}
                    onClick={() => thumbUrl && setActiveMediaIndex(idx)}
                    className={`w-14 h-14 rounded-2xl overflow-hidden cursor-pointer transition-all flex items-center justify-center ${thumbUrl
                      ? isActive
                        ? 'border-2 border-black scale-105 shadow-md'
                        : 'border border-black/20 hover:border-black'
                      : 'border-2 border-[#888888]/40 bg-white'
                      }`}
                  >
                    {thumbUrl ? (
                      <img
                        src={thumbUrl}
                        alt={`thumb-${idx}`}
                        className="w-full h-full object-cover"
                      />
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pila vertical de 2 botones de 217px x 61px (11.3021vw x 5.6481vh) con gap de 6px (0.5556vh) */}
          <div
            className="flex flex-col justify-between"
            style={{
              width: '11.3021vw',
              height: '11.9444vh',
              marginLeft: '1.875vw',
            }}
          >
            {/* Primer botón "+ Añadir" (217px x 61px) */}
            <button
              onClick={handleAddImage}
              style={{
                width: '11.3021vw',
                height: '5.6481vh',
              }}
              className="border-2 border-[#666666]/60 bg-white hover:bg-neutral-100 text-black text-xs font-bold rounded-full transition-all active:scale-95 shadow-sm flex items-center justify-center"
            >
              + Añadir
            </button>

            {/* Segundo botón "Imagen/Carrusel" (217px x 61px) */}
            <button
              style={{
                width: '11.3021vw',
                height: '5.6481vh',
              }}
              className="border-2 border-[#666666]/60 bg-white hover:bg-neutral-100 text-black text-xs font-bold rounded-full transition-all active:scale-95 shadow-sm flex items-center justify-center"
            >
              Imagen/Carrusel
            </button>
          </div>
        </div>

        {/* Flechas de navegación centradas debajo del contenedor de miniaturas */}
        <div className="w-[43.6458vw] flex items-center justify-center gap-6 text-[#666666] self-start mt-1">
          <button
            onClick={() =>
              setActiveMediaIndex((prev) => Math.max(0, prev - 1))
            }
            className="hover:text-black font-extrabold text-sm"
          >
            ◄
          </button>
          <button
            onClick={() =>
              setActiveMediaIndex((prev) =>
                Math.min(thumbnails.length - 1, prev + 1)
              )
            }
            className="hover:text-black font-extrabold text-sm"
          >
            ►
          </button>
        </div>
      </div>

      {/* CAJA DE TEXTO INFERIOR EN FORMA DE PÍLDORA CON BOTONES DE ACCIÓN */}
      <div className="flex items-center gap-3 w-[56.8229vw] mt-2">
        <div className="flex-1 bg-white border-2 border-[#888888]/50 rounded-[32px] p-3 px-5 flex items-center justify-between gap-3 shadow-sm min-h-[10vh]">
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Escribe la descripción de la publicación..."
            rows={2}
            className="w-full bg-transparent text-xs font-normal text-black outline-none border-none placeholder:text-[#999999] placeholder:italic resize-none leading-relaxed"
          />
        </div>

        {/* Pila vertical de botones redondos (Calendario Azul + Confirmar Gris) */}
        <div className="flex flex-col gap-2">
          <button
            className="w-11 h-11 bg-[#38BDF8] hover:bg-[#0284C7] text-white rounded-full flex items-center justify-center shadow-md transition-transform active:scale-95"
            title="Programar publicación"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </button>

          <button
            className="w-11 h-11 bg-[#4A4A4A] hover:bg-[#333333] text-white rounded-full flex items-center justify-center shadow-md transition-transform active:scale-95"
            title="Confirmar y publicar"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
