'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SelectedMedia {
  file?: File;
  url: string;
  isVideo?: boolean;
}

export interface ContentVariationBlock {
  id: string;
  number: number;
  caption: string;
  selectedPlatforms: string[];
  thumbnails: string[];
  activeMediaIndex: number;
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
  { id: 'facebook', name: 'Facebook' },
  { id: 'instagram', name: 'Instagram' },
  { id: 'x', name: 'X' },
  { id: 'linkedin', name: 'LinkedIn' },
  { id: 'tiktok', name: 'TikTok' },
];

export default function PostEditorWorkspace({
  initialMedia,
  currentPostTitle = 'Salvemos los árboles',
}: PostEditorWorkspaceProps) {
  // Función para partir multimedia en bloques: Imágenes juntas en Bloque 1, cada Video en su propio Bloque
  const buildInitialBlocks = (): ContentVariationBlock[] => {
    if (initialMedia.length === 0) {
      return [
        {
          id: 'variation-1',
          number: 1,
          caption: '',
          selectedPlatforms: ['facebook', 'instagram'],
          thumbnails: [],
          activeMediaIndex: 0,
        },
      ];
    }

    const images = initialMedia.filter((f) => !f.isVideo);
    const videos = initialMedia.filter((f) => f.isVideo);

    const blocks: ContentVariationBlock[] = [];
    let num = 1;

    if (images.length > 0) {
      blocks.push({
        id: `variation-${num}`,
        number: num++,
        caption: '',
        selectedPlatforms: ['facebook', 'instagram'],
        thumbnails: images.map((img) => img.url),
        activeMediaIndex: 0,
      });
    }

    videos.forEach((vid, idx) => {
      blocks.push({
        id: `variation-${num}`,
        number: num++,
        caption: '',
        selectedPlatforms: ['facebook', 'instagram'],
        thumbnails: [vid.url],
        activeMediaIndex: 0,
      });
    });

    return blocks.length > 0
      ? blocks
      : [
          {
            id: 'variation-1',
            number: 1,
            caption: '',
            selectedPlatforms: ['facebook', 'instagram'],
            thumbnails: [],
            activeMediaIndex: 0,
          },
        ];
  };

  const [variationBlocks, setVariationBlocks] = useState<ContentVariationBlock[]>(buildInitialBlocks);
  const [activeBlockId, setActiveBlockId] = useState<string>(variationBlocks[0]?.id || 'variation-1');
  const [isSocialDropdownOpen, setIsSocialDropdownOpen] = useState(false);

  const thumbnailScrollRef = useRef<HTMLDivElement>(null);
  const workspaceFileInputRef = useRef<HTMLInputElement>(null);
  const dropdownScrollRef = useRef<HTMLDivElement>(null);

  // Obtener el bloque activo actual
  const activeBlock = variationBlocks.find((b) => b.id === activeBlockId) || variationBlocks[0];
  const activeMediaUrl = activeBlock.thumbnails[activeBlock.activeMediaIndex] || '';
  const isVideo =
    activeMediaUrl.endsWith('.mp4') ||
    activeMediaUrl.endsWith('.webm') ||
    activeMediaUrl.includes('video') ||
    activeMediaUrl.startsWith('blob:') && activeBlock.thumbnails.some((url) => url === activeMediaUrl);

  // Actualizar descripción del bloque activo
  const handleCaptionChange = (text: string) => {
    setVariationBlocks((prev) =>
      prev.map((b) => (b.id === activeBlock.id ? { ...b, caption: text } : b))
    );
  };

  // Toggle de redes sociales en el bloque activo
  const togglePlatform = (id: string) => {
    setVariationBlocks((prev) =>
      prev.map((b) => {
        if (b.id !== activeBlock.id) return b;
        const exists = b.selectedPlatforms.includes(id);
        const updated = exists
          ? b.selectedPlatforms.filter((p) => p !== id)
          : [...b.selectedPlatforms, id];
        return { ...b, selectedPlatforms: updated };
      })
    );
  };

  // Selector de multimedia local: Agrupa imágenes en 1 bloque y crea 1 bloque individual por cada video
  const handleWorkspaceFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files).map((file) => ({
        file,
        url: URL.createObjectURL(file),
        isVideo: file.type.startsWith('video/'),
      }));

      const images = filesArray.filter((f) => !f.isVideo);
      const videos = filesArray.filter((f) => f.isVideo);

      setVariationBlocks((prev) => {
        let currentBlocks = [...prev];

        // Si el bloque actual está vacío, lo usamos para las imágenes o reemplazamos
        const isCurrentEmpty = activeBlock.thumbnails.length === 0;

        let nextNum = currentBlocks.length + 1;
        const createdBlocks: ContentVariationBlock[] = [];

        if (images.length > 0) {
          if (isCurrentEmpty) {
            currentBlocks = currentBlocks.map((b) =>
              b.id === activeBlock.id
                ? {
                    ...b,
                    thumbnails: images.map((img) => img.url),
                    activeMediaIndex: 0,
                  }
                : b
            );
          } else {
            createdBlocks.push({
              id: `variation-${Date.now()}-img`,
              number: nextNum++,
              caption: activeBlock.caption || '',
              selectedPlatforms: [...activeBlock.selectedPlatforms],
              thumbnails: images.map((img) => img.url),
              activeMediaIndex: 0,
            });
          }
        }

        videos.forEach((vid, idx) => {
          if (isCurrentEmpty && images.length === 0 && idx === 0) {
            currentBlocks = currentBlocks.map((b) =>
              b.id === activeBlock.id
                ? {
                    ...b,
                    thumbnails: [vid.url],
                    activeMediaIndex: 0,
                  }
                : b
            );
          } else {
            createdBlocks.push({
              id: `variation-${Date.now()}-vid-${idx}`,
              number: nextNum++,
              caption: activeBlock.caption || '',
              selectedPlatforms: [...activeBlock.selectedPlatforms],
              thumbnails: [vid.url],
              activeMediaIndex: 0,
            });
          }
        });

        const updatedList = [...currentBlocks, ...createdBlocks];
        if (createdBlocks.length > 0) {
          setActiveBlockId(createdBlocks[0].id);
        }
        return updatedList;
      });
    }
  };

  // Eliminar multimedia individual del bloque activo
  const handleRemoveMediaFromActiveBlock = (indexToRemove: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setVariationBlocks((prev) =>
      prev.map((b) => {
        if (b.id !== activeBlock.id) return b;
        const updatedThumbnails = b.thumbnails.filter((_, i) => i !== indexToRemove);
        const newIndex = Math.min(b.activeMediaIndex, Math.max(0, updatedThumbnails.length - 1));
        return {
          ...b,
          thumbnails: updatedThumbnails,
          activeMediaIndex: newIndex,
        };
      })
    );
  };

  // Crear un nuevo Bloque de Variación de Contenido vacio (+)
  const handleAddVariationBlock = () => {
    const nextNumber = variationBlocks.length + 1;
    const newBlock: ContentVariationBlock = {
      id: `variation-${Date.now()}`,
      number: nextNumber,
      caption: '',
      selectedPlatforms: ['facebook'],
      thumbnails: [],
      activeMediaIndex: 0,
    };
    setVariationBlocks((prev) => [...prev, newBlock]);
    setActiveBlockId(newBlock.id);
  };

  // Eliminar un Bloque de Variación
  const handleDeleteVariationBlock = (blockId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (variationBlocks.length <= 1) return;
    const filtered = variationBlocks.filter((b) => b.id !== blockId);
    const renumbered = filtered.map((b, idx) => ({ ...b, number: idx + 1 }));
    setVariationBlocks(renumbered);
    if (activeBlockId === blockId) {
      setActiveBlockId(renumbered[0].id);
    }
  };

  const handleAddImage = () => {
    workspaceFileInputRef.current?.click();
  };

  // Navegación fluida de miniaturas en el bloque activo
  const handlePrevThumb = () => {
    setVariationBlocks((prev) =>
      prev.map((b) =>
        b.id === activeBlock.id
          ? { ...b, activeMediaIndex: Math.max(0, b.activeMediaIndex - 1) }
          : b
      )
    );
    if (thumbnailScrollRef.current) {
      const step = thumbnailScrollRef.current.clientWidth * (118 / 838);
      thumbnailScrollRef.current.scrollBy({ left: -step, behavior: 'smooth' });
    }
  };

  const handleNextThumb = () => {
    setVariationBlocks((prev) =>
      prev.map((b) =>
        b.id === activeBlock.id
          ? {
              ...b,
              activeMediaIndex: Math.min(
                b.thumbnails.length - 1,
                b.activeMediaIndex + 1
              ),
            }
          : b
      )
    );
    if (thumbnailScrollRef.current) {
      const step = thumbnailScrollRef.current.clientWidth * (118 / 838);
      thumbnailScrollRef.current.scrollBy({ left: step, behavior: 'smooth' });
    }
  };

  // Cambiar miniatura activa en el bloque actual
  const handleSelectThumbnail = (index: number) => {
    setVariationBlocks((prev) =>
      prev.map((b) => (b.id === activeBlock.id ? { ...b, activeMediaIndex: index } : b))
    );
  };

  // Calcular rangos contiguos de selección para la barra lateral del bloque activo
  const selectionRanges: { start: number; end: number }[] = [];
  let rangeStart: number | null = null;

  SOCIAL_PLATFORMS.forEach((plat, idx) => {
    const isSelected = activeBlock.selectedPlatforms.includes(plat.id);
    if (isSelected) {
      if (rangeStart === null) rangeStart = idx;
    } else {
      if (rangeStart !== null) {
        selectionRanges.push({ start: rangeStart, end: idx - 1 });
        rangeStart = null;
      }
    }
  });
  if (rangeStart !== null) {
    selectionRanges.push({ start: rangeStart, end: SOCIAL_PLATFORMS.length - 1 });
  }

  const hasMediaInActiveBlock = activeBlock.thumbnails.length > 0;

  return (
    <div className="flex flex-col items-center justify-start gap-[1.2037vh] w-full select-none relative">
      {/* Input oculto de archivos para el botón + Añadir */}
      <input
        type="file"
        ref={workspaceFileInputRef}
        onChange={handleWorkspaceFileSelect}
        multiple
        accept="image/*,video/*"
        className="hidden"
      />

      {/* TÍTULO SUPERIOR CENTRADO CON INDICADOR DE BLOQUE ACTIVO */}
      <div className="flex items-center gap-2 mb-1">
        <h2 className="text-sm font-bold text-black tracking-tight text-center">
          {currentPostTitle}
        </h2>
        <span className="text-[11px] font-black bg-black text-white px-2.5 py-0.5 rounded-full">
          Variación {activeBlock.number}
        </span>
      </div>

      {/* CONTENEDOR DE PREVISUALIZACIÓN DE CONTENIDO DE 1091px (56.8229vw) x 398px (36.8519vh) CENTRADO */}
      <div className="relative w-full flex items-center justify-center">
        {/* RECUADRO DE PREVISUALIZACIÓN DE CONTENIDO (IMAGEN + DOTS + DESCRIPCIÓN O CUADRO DE TEXTO CENTRADO) */}
        <div className="bg-white/60 backdrop-blur-sm border-2 border-[#888888]/40 rounded-[26px] p-3 flex items-center justify-center w-[56.8229vw] h-[36.8519vh] relative">
          
          {hasMediaInActiveBlock ? (
            /* VISTA CON MULTIMEDIA (COLUMNA IZQUIERDA IMAGEN/VIDEO + COLUMNA DERECHA TEXTO) */
            <div className="flex gap-3.5 items-center justify-between w-full h-full">
              {/* COLUMNA IZQUIERDA: CONTENEDOR DE LA IMAGEN O VIDEO */}
              <div
                className="flex flex-col items-center justify-between h-full"
                style={{
                  width: '30.7974%',
                  marginLeft: '1.3749%',
                }}
              >
                <div
                  className="w-full aspect-square rounded-[18px] overflow-hidden border border-black/10 bg-neutral-900 flex items-center justify-center relative group"
                  style={{
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

                {/* PUNTOS DE PAGINACIÓN DE CARRUSEL DE LA VARIACIÓN ACTIVA */}
                <div
                  className="flex items-center justify-center gap-1.5 w-full"
                  style={{
                    marginBottom: '3.7688%',
                  }}
                >
                  {Array.from({ length: Math.max(7, activeBlock.thumbnails.length) }).map(
                    (_, idx) => (
                      <span
                        key={idx}
                        className={`rounded-full transition-all ${
                          idx === activeBlock.activeMediaIndex
                            ? 'w-2 h-2 bg-[#555555]'
                            : 'w-1.5 h-1.5 bg-[#BBBBBB]'
                        }`}
                      />
                    )
                  )}
                </div>
              </div>

              {/* COLUMNA DERECHA: RECUADRO VISTA PREVIA DE TEXTO PARA LA VARIACIÓN ACTIVA */}
              <div
                className="flex-1 bg-white border-2 border-[#888888]/40 rounded-[18px] p-4 flex flex-col overflow-y-auto self-center"
                style={{
                  height: '91.4573%',
                  marginRight: '1.3749%',
                }}
              >
                {activeBlock.caption.trim() ? (
                  <p className="text-xs font-normal text-black leading-relaxed whitespace-pre-wrap">
                    {activeBlock.caption}
                  </p>
                ) : (
                  <span className="text-xs italic text-[#999999] font-normal">
                    Descripción de contenido para Variación {activeBlock.number}
                  </span>
                )}
              </div>
            </div>
          ) : (
            /* VISTA SIN MULTIMEDIA: CUADRO DE TEXTO CENTRADO VERTICAL Y HORIZONTALMENTE CON BOTÓN "+ AÑADIR MULTIMEDIA" */
            <div className="w-[88%] h-[88%] bg-white border-2 border-[#888888]/40 rounded-[20px] p-5 flex flex-col items-center justify-between shadow-sm">
              <textarea
                value={activeBlock.caption}
                onChange={(e) => handleCaptionChange(e.target.value)}
                placeholder={`Escribe la descripción de la Variación ${activeBlock.number}...`}
                className="w-full flex-1 bg-transparent text-xs font-normal text-black outline-none border-none placeholder:text-[#999999] placeholder:italic resize-none leading-relaxed"
              />

              {/* Botón "+ Añadir multimedia" dentro del cuadro de texto centrado */}
              <button
                onClick={handleAddImage}
                className="mt-2 px-6 py-2.5 rounded-full text-xs font-bold bg-neutral-100 hover:bg-neutral-200 text-black border border-black/15 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                <span>Añadir multimedia (Imágenes o Videos)</span>
              </button>
            </div>
          )}
        </div>

        {/* BARRA DERECHA DE REDES SOCIALES + MENÚ DESPLEGABLE HORIZONTAL DE BLOQUES DE VARIACIÓN */}
        <div
          className="absolute left-[calc(50%+28.41145vw+1.2vw)] flex flex-col items-center justify-start"
          style={{
            top: '6.2963vh',
            gap: '1.1111vh',
          }}
        >
          {/* CONTENEDOR RELATIVO DEL BOTÓN CÍRCULO DESPLEGABLE */}
          <div className="relative">
            {/* Círculo superior chevron down - Mantenido por ENCIMA de la píldora (z-30) */}
            <button
              onClick={() => setIsSocialDropdownOpen(!isSocialDropdownOpen)}
              style={{
                width: '4.4792vw',
                height: '4.4792vw',
              }}
              className="relative z-30 bg-[#888888] hover:bg-[#777777] text-white rounded-full flex items-center justify-center transition-transform active:scale-95 border border-black/10 flex-shrink-0 cursor-pointer shadow-sm"
              title="Seleccionar Variación de Contenido"
            >
              <svg
                className={`w-7 h-7 transition-transform ${isSocialDropdownOpen ? 'rotate-180' : ''}`}
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

            {/* PÍLDORA HORIZONTAL DESPLEGABLE DE BLOQUES NUMERADOS (1, 2, 3...) + BOTÓN + AÑADIR NUEVA VARIACIÓN */}
            <AnimatePresence>
              {isSocialDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, x: -10 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.9, x: -10 }}
                  className="absolute left-0 top-0 z-10 flex items-center pointer-events-auto"
                  style={{
                    gap: '0.5208vw', // 10px entre la píldora de 277px y el círculo + a su derecha
                  }}
                >
                  {/* Píldora horizontal de 277px x 86px fijada a la izquierda (Alto 4.4792vw igual al círculo activador) */}
                  <div
                    style={{
                      width: '14.4271vw',
                      height: '4.4792vw',
                    }}
                    className="bg-[#D9D9D9]/95 backdrop-blur-md border border-black/10 rounded-full flex items-center relative overflow-hidden shadow-xl"
                  >
                    {/* Contenedor scrolleable con padding inicial de 94px (33.9350% de 277px) y CÍRCULOS NUMERADOS (1, 2, 3...) */}
                    <div
                      ref={dropdownScrollRef}
                      className="w-full h-full flex items-center overflow-x-auto scrollbar-none scroll-smooth"
                      style={{
                        paddingLeft: '33.9350%',
                        paddingRight: '4%',
                        gap: '2.8881%',
                      }}
                    >
                      {variationBlocks.map((block) => {
                        const isCurrentActive = block.id === activeBlock.id;
                        return (
                          <div
                            key={block.id}
                            onClick={() => setActiveBlockId(block.id)}
                            style={{
                              width: '35%',
                              aspectRatio: '1 / 1',
                            }}
                            className={`relative group rounded-full flex items-center justify-center font-black text-base transition-all flex-shrink-0 cursor-pointer ${
                              isCurrentActive
                                ? 'bg-black text-white scale-105 shadow-md border-2 border-black'
                                : 'bg-white text-black border border-black/20 hover:border-black'
                            }`}
                            title={`Variación de Contenido #${block.number}`}
                          >
                            <span>{block.number}</span>
                            {variationBlocks.length > 1 && (
                              <button
                                onClick={(e) => handleDeleteVariationBlock(block.id, e)}
                                className="absolute -top-1 -right-1 bg-red-600 hover:bg-red-700 text-white rounded-full w-4 h-4 flex items-center justify-center text-[9px] opacity-0 group-hover:opacity-100 transition-opacity shadow"
                                title="Eliminar variación"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Flechas de navegación DEBAJO de la píldora si hay más de 2 variaciones */}
                  {variationBlocks.length > 2 && (
                    <div className="absolute top-[calc(100%+6px)] left-0 w-[14.4271vw] flex items-center justify-center gap-5 text-[#666666] z-20 pointer-events-auto">
                      <button
                        onClick={() => {
                          if (dropdownScrollRef.current) {
                            dropdownScrollRef.current.scrollBy({ left: -76, behavior: 'smooth' });
                          }
                        }}
                        className="hover:text-black font-extrabold text-xs transition-transform active:scale-95 cursor-pointer"
                      >
                        ◄
                      </button>
                      <button
                        onClick={() => {
                          if (dropdownScrollRef.current) {
                            dropdownScrollRef.current.scrollBy({ left: 76, behavior: 'smooth' });
                          }
                        }}
                        className="hover:text-black font-extrabold text-xs transition-transform active:scale-95 cursor-pointer"
                      >
                        ►
                      </button>
                    </div>
                  )}

                  {/* Círculo + Añadir nueva Variación de Contenido */}
                  <button
                    onClick={handleAddVariationBlock}
                    style={{
                      width: '6.2963vh',
                      height: '6.2963vh',
                      aspectRatio: '1 / 1',
                    }}
                    className="bg-[#888888] hover:bg-[#777777] text-white rounded-full flex items-center justify-center transition-transform active:scale-95 border border-black/10 flex-shrink-0 shadow-md cursor-pointer"
                    title="Añadir nueva Variación de Contenido"
                  >
                    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Barra vertical de redes sociales asignadas al bloque activo */}
          <div
            style={{
              width: '4.4792vw',
              height: '30.9259vh',
            }}
            className="bg-[#D9D9D9] rounded-full border border-black/10 relative overflow-hidden"
          >
            {/* FONDO NEGRO UNIFICADO PARA RANGOS DE SELECCIÓN DE LA VARIACIÓN ACTIVA */}
            {selectionRanges.map((range) => {
              const isSingle = range.start === range.end;
              const yStartCenterPx = 42.5 + range.start * 62.25;
              const yEndCenterPx = 42.5 + range.end * 62.25;
              
              const yTopPx = yStartCenterPx - 32.5;
              const yBottomPx = yEndCenterPx + 32.5;
              const heightPx = yBottomPx - yTopPx;

              const topPercent = (yTopPx / 334) * 100;
              const heightPercent = (heightPx / 334) * 100;

              if (isSingle) {
                return (
                  <div
                    key={`range-${range.start}-${range.end}`}
                    className="absolute left-0 right-0 flex items-center justify-center pointer-events-none z-0 transition-all duration-200"
                    style={{
                      top: `${topPercent}%`,
                      height: `${heightPercent}%`,
                    }}
                  >
                    <div
                      className="bg-black rounded-full"
                      style={{
                        width: '75.5814%',
                        aspectRatio: '1 / 1',
                      }}
                    />
                  </div>
                );
              } else {
                return (
                  <div
                    key={`range-${range.start}-${range.end}`}
                    className="absolute left-0 right-0 flex justify-center pointer-events-none z-0 transition-all duration-200"
                    style={{
                      top: `${topPercent}%`,
                      height: `${heightPercent}%`,
                    }}
                  >
                    <div
                      className="bg-black rounded-full"
                      style={{
                        width: '75.5814%',
                        height: '100%',
                      }}
                    />
                  </div>
                );
              }
            })}

            {/* ÍCONOS DE REDES SOCIALES PARA LA VARIACIÓN ACTIVA */}
            {SOCIAL_PLATFORMS.map((plat, idx) => {
              const isSel = activeBlock.selectedPlatforms.includes(plat.id);
              const yCenterPx = 42.5 + idx * 62.25;
              const topPercent = (yCenterPx / 334) * 100;

              return (
                <div
                  key={plat.id}
                  onClick={() => togglePlatform(plat.id)}
                  style={{
                    top: `${topPercent}%`,
                    transform: 'translateY(-50%)',
                  }}
                  className="absolute inset-x-0 flex items-center justify-center cursor-pointer z-10"
                  title={plat.name}
                >
                  <div
                    className={`flex items-center justify-center transition-colors ${
                      isSel ? 'text-white font-bold' : 'text-[#666666] hover:text-[#333333] font-semibold'
                    }`}
                  >
                    {plat.id === 'facebook' && (
                      <span className="text-xl font-black font-sans leading-none">f</span>
                    )}
                    {plat.id === 'instagram' && (
                      <svg className="w-[21px] h-[21px]" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                      </svg>
                    )}
                    {plat.id === 'x' && (
                      <span className="text-xl font-extrabold leading-none">𝕏</span>
                    )}
                    {plat.id === 'linkedin' && (
                      <span className="text-xl font-bold font-sans leading-none">in</span>
                    )}
                    {plat.id === 'tiktok' && (
                      <svg className="w-[21px] h-[21px]" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
                      </svg>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* BARRA INTERMEDIA DE CONTROL Y MINIATURAS DEL BLOQUE ACTIVO */}
      <div
        className="flex flex-col items-center gap-1 w-[56.8229vw]"
        style={{ marginTop: '.2vh' }}
      >
        <div className="w-full flex items-stretch justify-between">
          {/* Contenedor general de miniaturas (838px x 129px) */}
          <div className="w-[43.6458vw] h-[11.9444vh] bg-[#E5E5E5]/60 backdrop-blur-sm border-2 border-[#888888]/40 rounded-[22px] overflow-hidden flex items-center">
            <div
              ref={thumbnailScrollRef}
              className="w-full h-full flex items-center overflow-x-auto scrollbar-none scroll-smooth"
              style={{
                paddingLeft: '1.1933%',
                paddingRight: '1.1933%',
                paddingTop: '7.7519%',
                paddingBottom: '7.7519%',
                gap: '1.0740%',
              }}
            >
              {Array.from({ length: Math.max(7, activeBlock.thumbnails.length) }).map((_, idx) => {
                const thumbUrl = activeBlock.thumbnails[idx];
                const isActive = idx === activeBlock.activeMediaIndex;

                return (
                  <div
                    key={idx}
                    onClick={() => thumbUrl && handleSelectThumbnail(idx)}
                    style={{
                      width: '13.0072%',
                      aspectRatio: '1 / 1',
                    }}
                    className={`relative group rounded-2xl overflow-hidden cursor-pointer transition-all flex-shrink-0 flex items-center justify-center ${
                      thumbUrl
                        ? isActive
                          ? 'border-2 border-black scale-105'
                          : 'border border-black/20 hover:border-black'
                        : 'border-2 border-[#888888]/40 bg-white'
                    }`}
                  >
                    {thumbUrl ? (
                      <>
                        {thumbUrl.endsWith('.mp4') || thumbUrl.includes('video') ? (
                          <video src={thumbUrl} className="w-full h-full object-cover" />
                        ) : (
                          <img
                            src={thumbUrl}
                            alt={`thumb-${idx}`}
                            className="w-full h-full object-cover"
                          />
                        )}
                        {activeBlock.thumbnails.length > 1 && (
                          <button
                            onClick={(e) => handleRemoveMediaFromActiveBlock(idx, e)}
                            className="absolute top-1 right-1 bg-black/70 hover:bg-red-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[9px] opacity-0 group-hover:opacity-100 transition-opacity shadow"
                            title="Eliminar esta imagen del bloque"
                          >
                            ✕
                          </button>
                        )}
                      </>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pila vertical de 2 botones de 217px x 61px con gap de 6px */}
          <div
            className="flex flex-col justify-between"
            style={{
              width: '11.3021vw',
              height: '11.9444vh',
              marginLeft: '1.875vw',
            }}
          >
            <button
              onClick={handleAddImage}
              style={{
                width: '11.3021vw',
                height: '5.6481vh',
              }}
              className="border-2 border-[#666666]/60 bg-white hover:bg-neutral-100 text-black text-xs font-bold rounded-full transition-all active:scale-95 flex items-center justify-center cursor-pointer"
            >
              + Añadir
            </button>

            <button
              style={{
                width: '11.3021vw',
                height: '5.6481vh',
              }}
              className="border-2 border-[#666666]/60 bg-white hover:bg-neutral-100 text-black text-xs font-bold rounded-full transition-all active:scale-95 flex items-center justify-center cursor-pointer"
            >
              Imagen/Carrusel
            </button>
          </div>
        </div>

        {/* Flechas de navegación centradas debajo del contenedor de miniaturas */}
        <div className="w-[43.6458vw] flex items-center justify-center gap-6 text-[#666666] self-start mt-1">
          <button
            onClick={handlePrevThumb}
            className="hover:text-black font-extrabold text-sm transition-transform active:scale-95 cursor-pointer"
          >
            ◄
          </button>
          <button
            onClick={handleNextThumb}
            className="hover:text-black font-extrabold text-sm transition-transform active:scale-95 cursor-pointer"
          >
            ►
          </button>
        </div>
      </div>

      {/* CAJA DE TEXTO INFERIOR DE LA VARIACIÓN ACTIVA CON BOTONES DE ACCIÓN */}
      <div className="flex items-center gap-3 w-[56.8229vw] mt-2">
        <div className="flex-1 bg-white border-2 border-[#888888]/50 rounded-[32px] p-3 px-5 flex items-center justify-between gap-3 min-h-[10vh]">
          <textarea
            value={activeBlock.caption}
            onChange={(e) => handleCaptionChange(e.target.value)}
            placeholder={`Escribe la descripción de la Variación ${activeBlock.number}...`}
            rows={2}
            className="w-full bg-transparent text-xs font-normal text-black outline-none border-none placeholder:text-[#999999] placeholder:italic resize-none leading-relaxed"
          />
        </div>

        {/* Pila vertical de botones redondos */}
        <div className="flex flex-col gap-2">
          <button
            className="w-11 h-11 bg-[#38BDF8] hover:bg-[#0284C7] text-white rounded-full flex items-center justify-center transition-transform active:scale-95 cursor-pointer"
            title="Programar publicación de esta variación"
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
            className="w-11 h-11 bg-[#4A4A4A] hover:bg-[#333333] text-white rounded-full flex items-center justify-center transition-transform active:scale-95 cursor-pointer"
            title="Confirmar y publicar esta variación"
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
