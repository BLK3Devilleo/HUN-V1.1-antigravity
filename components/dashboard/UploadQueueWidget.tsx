'use client';

export default function UploadQueueWidget() {
  return (
    <div
      className="w-full h-full flex flex-col"
      style={{
        background: '#D9D9D9',
        borderRadius: '16px',
        overflow: 'hidden',
      }}
    >
      {/* Header: Red dot + Title */}
      <div className="px-5 pt-4 pb-2 flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-full bg-[#FF4D4D]" />
        <span className="text-sm font-bold text-[#000000]">
          Subidas en fila
        </span>
      </div>

      {/* Content preview area */}
      <div className="flex-1 px-4 flex flex-col">
        {/* Image preview */}
        <div className="w-full flex-1 rounded-xl overflow-hidden relative bg-[#B0C4A8]">
          {/* Nature image placeholder - gradient simulating trees/sky */}
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(180deg, #87CEEB 0%, #87CEEB 30%, #228B22 30%, #2E7D32 60%, #1B5E20 100%)',
            }}
          />
          {/* 3 dots top-right */}
          <div className="absolute top-3 right-3 flex gap-1.5">
            <div className="w-2 h-2 rounded-full bg-white/70" />
            <div className="w-2 h-2 rounded-full bg-white/70" />
            <div className="w-2 h-2 rounded-full bg-white/70" />
          </div>
        </div>

        {/* Caption below image */}
        <p className="text-sm font-bold text-[#000000] mt-3">
          Contenido sob...
        </p>
        <p className="text-xs text-[#666666] mt-1 mb-3">
          Cargando 12 más...
        </p>
      </div>

      {/* Red error banner */}
      <button
        className="w-full text-center text-sm font-bold text-white flex items-center justify-center"
        style={{
          height: '44px',
          background: '#FF4D4D',
        }}
      >
        Falló 1 archivo
      </button>

      {/* "Ver todo" dark button */}
      <button
        className="w-full text-center text-sm font-semibold text-white flex items-center justify-center rounded-b-[16px]"
        style={{
          height: '44px',
          background: '#333333',
        }}
      >
        Ver todo
      </button>
    </div>
  );
}
