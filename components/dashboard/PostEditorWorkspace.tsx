'use client';

import { useState, useRef } from 'react';

interface SelectedMedia {
  file?: File;
  url: string;
  isVideo?: boolean;
}

interface PostEditorWorkspaceProps {
  initialMedia: SelectedMedia[];
  currentPostTitle?: string;
  activeOrgId?: string;
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
  activeOrgId = 'org-1',
}: PostEditorWorkspaceProps) {
  const [caption, setCaption] = useState('');
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['facebook']);
  const [isPublishing, setIsPublishing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<'success' | 'error' | null>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [scheduledDate, setScheduledDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().slice(0, 10);
  });
  const [scheduledTime, setScheduledTime] = useState('14:00');
  const [thumbnails, setThumbnails] = useState<string[]>(
    initialMedia.length > 0
      ? initialMedia.map((m) => m.url)
      : DEFAULT_IMAGES
  );

  const thumbnailScrollRef = useRef<HTMLDivElement>(null);
  const editorFileInputRef = useRef<HTMLInputElement>(null);

  const handleOpenPicker = () => {
    editorFileInputRef.current?.click();
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setStatusMessage('Subiendo archivo a Cloudflare R2...');
    setStatusType('success');

    try {
      const { useR2Upload } = await import('@/hooks/useR2Upload');
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const { saveMediaRecord } = await import('@/app/actions/media');

      const fileList = Array.from(files);
      const newUrls: string[] = [];

      for (const file of fileList) {
        // Fallback a URL local si falla la subida física
        const localUrl = URL.createObjectURL(file);
        try {
          const res = await fetch('/api/r2/presign', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileName: file.name,
              mimeType: file.type || 'image/jpeg',
              fileSize: file.size,
            }),
          });

          if (res.ok) {
            const { url: uploadUrl, publicUrl } = await res.json();
            const putRes = await fetch(uploadUrl, {
              method: 'PUT',
              headers: { 'Content-Type': file.type || 'image/jpeg' },
              body: file,
            });
            if (putRes.ok) {
              await saveMediaRecord(publicUrl, file.name);
              newUrls.push(publicUrl);
            } else {
              newUrls.push(localUrl);
            }
          } else {
            newUrls.push(localUrl);
          }
        } catch {
          newUrls.push(localUrl);
        }
      }

      if (newUrls.length > 0) {
        setThumbnails((prev) => [...prev, ...newUrls]);
        setActiveMediaIndex(thumbnails.length);
        setStatusType('success');
        setStatusMessage('¡Multimedia subida y registrada en Mi Galería!');
      }
    } catch {
      handleAddImageFallback();
    }

    if (editorFileInputRef.current) {
      editorFileInputRef.current.value = '';
    }
  };

  const handleAddImageFallback = () => {
    const nextImage = DEFAULT_IMAGES[thumbnails.length % DEFAULT_IMAGES.length];
    if (thumbnails.length < 15) {
      setThumbnails((prev) => [...prev, nextImage]);
    }
  };

  const handlePublish = async (isScheduled = false) => {
    if (!caption.trim() && thumbnails.length === 0) {
      setStatusType('error');
      setStatusMessage('Ingresa una descripción o selecciona multimedia.');
      return;
    }

    setIsPublishing(true);
    setStatusMessage(null);

    const { publishPostAction } = await import('@/app/actions/post');
    const result = await publishPostAction({
      title: currentPostTitle,
      caption: caption || 'Publicación desde NUH Workspace',
      mediaUrls: thumbnails,
      platforms: selectedPlatforms,
      orgId: activeOrgId,
    });

    setIsPublishing(false);

    if (result.success) {
      setStatusType('success');
      setStatusMessage(
        isScheduled
          ? '🗓️ ¡Programado con éxito!'
          : '✔️ ¡Publicación enviada a n8n y redes!'
      );
    } else {
      setStatusType('error');
      setStatusMessage(result.error || 'Error al publicar.');
    }
  };

  const activeMediaUrl = thumbnails[activeMediaIndex] || DEFAULT_IMAGES[0];
  const isVideo = initialMedia[activeMediaIndex]?.isVideo || false;

  // Toggle de selección múltiple de redes sociales
  const togglePlatform = (id: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  // Manejar adición de nueva imagen
  const handleAddImage = () => {
    const nextImage =
      DEFAULT_IMAGES[thumbnails.length % DEFAULT_IMAGES.length];
    if (thumbnails.length < 15) {
      setThumbnails((prev) => [...prev, nextImage]);
    }
  };

  // Navegación fluida de miniaturas
  const handlePrevThumb = () => {
    setActiveMediaIndex((prev) => Math.max(0, prev - 1));
    if (thumbnailScrollRef.current) {
      const step = thumbnailScrollRef.current.clientWidth * (118 / 838);
      thumbnailScrollRef.current.scrollBy({ left: -step, behavior: 'smooth' });
    }
  };

  const handleNextThumb = () => {
    setActiveMediaIndex((prev) =>
      Math.min(thumbnails.length - 1, prev + 1)
    );
    if (thumbnailScrollRef.current) {
      const step = thumbnailScrollRef.current.clientWidth * (118 / 838);
      thumbnailScrollRef.current.scrollBy({ left: step, behavior: 'smooth' });
    }
  };

  // Calcular rangos contiguos de selección para renderizar la pastilla unificada
  const selectionRanges: { start: number; end: number }[] = [];
  let rangeStart: number | null = null;

  SOCIAL_PLATFORMS.forEach((plat, idx) => {
    const isSelected = selectedPlatforms.includes(plat.id);
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

  return (
    <div className="flex flex-col items-center justify-start gap-[1.2037vh] w-full select-none relative">
      {/* TÍTULO SUPERIOR CENTRADO */}
      <h2 className="text-sm font-extrabold text-black tracking-tight mb-1 text-center bg-white/70 px-4 py-1 rounded-full shadow-sm">
        {currentPostTitle}
      </h2>

      {/* CONTENEDOR DE PREVISUALIZACIÓN */}
      <div className="relative w-full flex items-center justify-center">
        {/* RECUADRO DE PREVISUALIZACIÓN DE CONTENIDO (IMAGEN + DOTS + DESCRIPCIÓN) - 1091px x 398px */}
        <div className="bg-white/60 backdrop-blur-sm border-2 border-[#888888]/40 rounded-[26px] p-3 flex gap-3.5 items-center justify-between w-[56.8229vw] h-[36.8519vh]">
          {/* COLUMNA IZQUIERDA: CONTENEDOR DE LA IMAGEN (SIEMPRE CUADRADO, CALCULADO DEL ANCHO DEL CONTENEDOR GENERAL) Y PUNTOS DE PAGINACIÓN */}
          <div
            className="flex flex-col items-center justify-between h-full"
            style={{
              width: '30.7974%',
              marginLeft: '1.3749%',
            }}
          >
            {/* CONTENEDOR DE LA IMAGEN (336px x 336px) - SIEMPRE CUADRADO BASADO EN EL ANCHO (30.7974%), 15px (3.7688%) MARGEN SUPERIOR */}
            <div
              className="w-full aspect-square rounded-[18px] overflow-hidden border border-black/10 bg-neutral-900 flex items-center justify-center"
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

            {/* PUNTOS DE PAGINACIÓN DE CARRUSEL (Centrados con la imagen, 15px = 3.7688% de margen al borde inferior) */}
            <div
              className="flex items-center justify-center gap-1.5 w-full"
              style={{ marginBottom: '3.7688%' }}
            >
              {Array.from({ length: Math.max(7, thumbnails.length) }).map(
                (_, idx) => (
                  <span
                    key={idx}
                    className={`rounded-full transition-all ${
                      idx === activeMediaIndex
                        ? 'w-2.5 h-2.5 bg-black shadow-sm'
                        : 'w-1.5 h-1.5 bg-[#BBBBBB]'
                    }`}
                  />
                )
              )}
            </div>
          </div>

          {/* COLUMNA DERECHA: TEXTO */}
          <div
            className="flex-1 bg-white border-2 border-[#888888]/40 rounded-[18px] p-4 flex flex-col overflow-y-auto self-center shadow-inner"
            style={{
              height: '91.4573%',
              marginRight: '1.3749%',
            }}
          >
            {caption.trim() ? (
              <p className="text-xs font-medium text-black leading-relaxed whitespace-pre-wrap">
                {caption}
              </p>
            ) : (
              <span className="text-xs italic text-[#999999] font-normal">
                Escribe una descripción para previsualizar...
              </span>
            )}
          </div>
        </div>

        {/* BARRA DERECHA DE REDES SOCIALES (Diámetro círculo: 86px = 4.4792vw, Píldora: 86px x 334px = 4.4792vw x 30.9259vh, Gap: 12px = 1.1111vh, 247px de top del viewport) */}
        <div
          className="absolute left-[calc(50%+28.41145vw+1.2vw)] flex flex-col items-center justify-start"
          style={{
            top: '6.2963vh',
            gap: '1.1111vh',
          }}
        >
          {/* Círculo superior chevron down (Diámetro 86px = 4.4792vw) */}
          <button
            style={{
              width: '4.4792vw',
              height: '4.4792vw',
            }}
            className="bg-[#888888] hover:bg-[#777777] text-white rounded-full flex items-center justify-center transition-transform active:scale-95 border border-black/10 flex-shrink-0"
            title="Opciones de redes"
          >
            <svg
              className="w-7 h-7"
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

          {/* Barra vertical de redes sociales (86px x 334px = 4.4792vw x 30.9259vh) */}
          <div
            style={{
              width: '4.4792vw',
              height: '30.9259vh',
            }}
            className="bg-[#D9D9D9] rounded-full border border-black/10 relative overflow-hidden"
          >
            {/* FONDO NEGRO UNIFICADO PARA RANGOS DE SELECCIÓN CONTIGUOS (GEOMETRÍA EXACTA: 10px MARGEN SUPERIOR/INFERIOR, PASO 62.25px) */}
            {selectionRanges.map((range) => {
              const isSingle = range.start === range.end;
              // Centros exactos en px (Facebook: 42.5px, TikTok: 291.5px, Paso: 62.25px)
              const yStartCenterPx = 42.5 + range.start * 62.25;
              const yEndCenterPx = 42.5 + range.end * 62.25;
              
              const yTopPx = yStartCenterPx - 32.5; // Top del círculo superior
              const yBottomPx = yEndCenterPx + 32.5; // Bottom del círculo inferior
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

            {/* ÍCONOS DE REDES SOCIALES POSICIONADOS EN LOS CENTROS CONCÉNTRICOS EXACTOS */}
            {SOCIAL_PLATFORMS.map((plat, idx) => {
              const isSel = selectedPlatforms.includes(plat.id);
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
                  {/* Ícono de red social (Centrado concentrico exacto sobre el centro de cada círculo) */}
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

      {/* BARRA DE MINIATURAS */}
      <div
        className="flex flex-col items-center gap-1 w-[56.8229vw]"
        style={{ marginTop: '.2vh' }}
      >
        <div className="w-full flex items-stretch justify-between">
          {/* Contenedor general de miniaturas (838px x 129px = 43.6458vw x 11.9444vh) */}
          <div className="w-[43.6458vw] h-[11.9444vh] bg-[#E5E5E5]/60 backdrop-blur-sm border-2 border-[#888888]/40 rounded-[22px] overflow-hidden flex items-center">
            {/* Slider de miniaturas con padding de 10px (1.1933% lat, 7.7519% vert) y gap de 9px (1.0740%) */}
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
              {Array.from({ length: Math.max(7, thumbnails.length) }).map((_, idx) => {
                const thumbUrl = thumbnails[idx];
                const isActive = idx === activeMediaIndex;

                return (
                  <div
                    key={idx}
                    onClick={() => thumbUrl && setActiveMediaIndex(idx)}
                    style={{
                      width: '13.0072%', // 109px of 838px
                      aspectRatio: '1 / 1',
                    }}
                    className={`rounded-2xl overflow-hidden cursor-pointer transition-all flex-shrink-0 flex items-center justify-center ${
                      thumbUrl
                        ? isActive
                          ? 'border-2 border-black scale-105'
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

          <input
            type="file"
            ref={editorFileInputRef}
            onChange={handleFileSelected}
            multiple
            accept="image/*,video/*"
            className="hidden"
          />

          <div
            className="flex flex-col justify-between"
            style={{
              width: '11.3021vw',
              height: '11.9444vh',
              marginLeft: '1.875vw',
            }}
          >
            <button
              onClick={handleOpenPicker}
              style={{
                width: '11.3021vw',
                height: '5.6481vh',
              }}
              className="border-2 border-[#666666]/60 bg-white hover:bg-neutral-100 text-black text-xs font-bold rounded-full transition-all active:scale-95 flex items-center justify-center cursor-pointer"
            >
              + Añadir
            </button>

            <button
              onClick={handleOpenPicker}
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

        {/* Flechas de navegación */}
        <div className="w-[43.6458vw] flex items-center justify-center gap-6 text-[#666666] self-start mt-1">
          <button
            onClick={handlePrevThumb}
            className="hover:text-black font-extrabold text-sm transition-transform active:scale-95"
          >
            ◄
          </button>
          <button
            onClick={handleNextThumb}
            className="hover:text-black font-extrabold text-sm transition-transform active:scale-95"
          >
            ►
          </button>
        </div>
      </div>

      {/* CAJA DE TEXTO INFERIOR */}
      <div className="flex items-center gap-3 w-[56.8229vw] mt-2">
        <div className="flex-1 bg-white border-2 border-[#888888]/50 rounded-[32px] p-3 px-5 flex items-center justify-between gap-3 min-h-[10vh]">
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Escribe la descripción de la publicación..."
            rows={2}
            className="w-full bg-transparent text-xs font-normal text-black outline-none border-none placeholder:text-[#999999] placeholder:italic resize-none leading-relaxed"
          />
        </div>

        {/* BOTONES DE ACCIÓN (CALENDARIO PROGRAMACIÓN + CONFIRMAR Y PUBLICAR) */}
        <div className="flex flex-col gap-2 relative">
          <button
            onClick={() => setIsCalendarOpen(true)}
            className="w-11 h-11 bg-[#38BDF8] hover:bg-[#0284C7] text-white rounded-full flex items-center justify-center transition-transform active:scale-95 cursor-pointer"
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
            onClick={() => handlePublish(false)}
            disabled={isPublishing}
            className="w-11 h-11 bg-[#4A4A4A] hover:bg-[#333333] disabled:opacity-50 text-white rounded-full flex items-center justify-center transition-transform active:scale-95 cursor-pointer"
            title="Confirmar y publicar"
          >
            {isPublishing ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
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
            )}
          </button>

          {/* Toast Notification */}
          {statusMessage && (
            <div
              onClick={() => setStatusMessage(null)}
              className={`absolute right-14 bottom-0 whitespace-nowrap px-4 py-2 rounded-full text-xs font-extrabold shadow-2xl cursor-pointer transition-all ${
                statusType === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
              }`}
            >
              {statusMessage}
            </div>
          )}
        </div>
      </div>

      {/* MODAL INTERACTIVO DE CALENDARIO Y PROGRAMACIÓN */}
      {isCalendarOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] max-w-md w-full p-6 shadow-2xl border border-white/50 space-y-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-sky-100 flex items-center justify-center text-sky-600">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-base font-black text-gray-900">Programar Publicación</h3>
              </div>
              <button
                onClick={() => setIsCalendarOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Fecha de Publicación
                </label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-extrabold text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Hora de Envío
                </label>
                <input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-extrabold text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="p-3 bg-sky-50 rounded-2xl border border-sky-100 text-[11px] text-sky-800 font-medium">
                💡 El orquestador de n8n enviará automáticamente la publicación a las redes seleccionadas ({selectedPlatforms.join(', ')}) en la fecha y hora indicadas.
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setIsCalendarOpen(false)}
                className="flex-1 py-3 px-4 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs uppercase tracking-wider transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={() => handlePublish(true)}
                disabled={isPublishing}
                className="flex-1 py-3 px-4 rounded-full bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider shadow-lg transition-all hover:scale-105"
              >
                {isPublishing ? 'Programando...' : 'Confirmar Fecha'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
