'use client';

interface UploadQueueWidgetProps {
  description?: string;
  isUploading?: boolean;
  hasError?: boolean;
  errorMessage?: string | null;
  queueCount?: number;
  thumbnailUrl?: string;
}

export default function UploadQueueWidget({
  description,
  isUploading = false,
  hasError = false,
  errorMessage = null,
  queueCount = 0,
  thumbnailUrl,
}: UploadQueueWidgetProps) {
  // Extraer la primera línea de la descripción del contenido del Post Editor
  const firstLineDescription = description
    ? description.split('\n')[0].trim()
    : 'Contenido sob...';

  // El círculo rojo solo aparece cuando hay subidas activas o en cola
  const showRedDot = isUploading || queueCount > 0;

  return (
    <div
      className="w-full h-full flex flex-col transition-all"
      style={{
        background: '#D9D9D9',
        borderRadius: '16px',
        overflow: 'hidden',
      }}
    >
      {/* Header: Círculo rojo (solo en subida) + Título "Subidas en fila" */}
      <div className="px-5 pt-4 pb-2 flex items-center gap-2">
        {showRedDot && (
          <div className="w-2.5 h-2.5 rounded-full bg-[#FF4D4D] flex-shrink-0 animate-pulse" />
        )}
        <span className="text-sm font-bold text-[#000000]">
          Subidas en fila
        </span>
      </div>

      {/* Área de vista previa del contenido */}
      <div className="flex-1 px-4 flex flex-col pb-3">
        <div className="w-full flex-1 rounded-xl overflow-hidden relative bg-[#B0C4A8]">
          {thumbnailUrl ? (
            <img src={thumbnailUrl} alt="preview" className="w-full h-full object-cover" />
          ) : (
            <div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(180deg, #87CEEB 0%, #87CEEB 30%, #228B22 30%, #2E7D32 60%, #1B5E20 100%)',
              }}
            />
          )}

          {/* Indicador de progreso (overlay) */}
          {isUploading && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className="text-white font-bold text-sm">Subiendo...</span>
            </div>
          )}

          <div className="absolute top-3 right-3 flex gap-1.5">
            <div className="w-2 h-2 rounded-full bg-white/70" />
            <div className="w-2 h-2 rounded-full bg-white/70" />
            <div className="w-2 h-2 rounded-full bg-white/70" />
          </div>
        </div>

        {/* Primera línea de la descripción del contenido */}
        <p className="text-sm font-bold text-[#000000] mt-3 truncate" title={firstLineDescription}>
          {firstLineDescription}
        </p>
        <p className="text-xs text-[#666666] mt-1">
          {isUploading ? 'Procesando archivo...' : queueCount > 0 ? `Cargando ${queueCount} más...` : 'Cargando 12 más...'}
        </p>
      </div>

      {/* Recuadro inferior: SOLO aparece en ROJO si hay un fallo de subida */}
      {(hasError || errorMessage) && (
        <div
          className="w-full text-center text-sm font-bold text-white flex items-center justify-center rounded-b-[16px] bg-[#DC2626] px-3"
          style={{
            height: '44px',
          }}
        >
          <span className="truncate">{errorMessage || 'Error en la subida de contenido'}</span>
        </div>
      )}
    </div>
  );
}
