'use client';

export default function UploadQueueWidget() {
  return (
    <div
      className="w-full h-full relative"
      style={{
        background: '#D9D9D9', // Gris Plata medio del contenedor
        borderRadius: '16px', // Asumido
        overflow: 'hidden',
      }}
    >
      {/* Bloque principal (87.1% del alto) */}
      <div 
        className="w-full relative"
        style={{ height: '87.1%' }}
      >
        {/* Texto "Subidas en fila" (padding top 16px, left 48px según PDF) */}
        <div 
          className="absolute flex items-center gap-2"
          style={{ top: '16px', left: '48px' }}
        >
          <div className="w-2 h-2 rounded-full bg-[#FF4D4D]" />
          <span className="text-xs font-bold text-[#000000]">
            Subidas en fila
          </span>
        </div>

        {/* Vista de contenido (300x200 centrado horizontalmente, padding superior 78px) */}
        <div 
          className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center"
          style={{ top: '78px', width: '85.7%', height: '49.4%' }}
        >
          {/* Imagen (Fondo de vista de contenido) */}
          <div className="w-full h-full bg-[#E5E5E5] rounded-xl relative overflow-hidden flex items-end justify-center pb-3">
            {/* Cápsula blanca con texto */}
            <div className="bg-white px-4 py-2 rounded-full w-[90%] flex items-center justify-between shadow-sm">
              <span className="text-xs font-bold text-black truncate">
                Contenido sob...
              </span>
              {/* Dots */}
              <div className="flex gap-1">
                <div className="w-1 h-1 rounded-full bg-black/30" />
                <div className="w-1 h-1 rounded-full bg-black/30" />
                <div className="w-1 h-1 rounded-full bg-black/30" />
              </div>
            </div>
          </div>
          
          <p className="text-[10px] font-semibold text-[var(--nuh-text-secondary)] mt-4">
            Cargando 12 más...
          </p>
        </div>
      </div>

      {/* Botón Ver Todo / Error en parte inferior (12.9% del alto = 100 - 87.1) */}
      <div 
        className="absolute bottom-[7px] w-full flex justify-center"
        style={{ height: '11.4%' }}
      >
        <button
          className="text-center text-xs font-bold text-white transition-all hover:brightness-110 active:scale-95 flex items-center justify-center rounded-lg"
          style={{
            width: '100%',
            height: '100%',
            background: '#FF4D4D',
          }}
        >
          Falló 1 archivo
        </button>
      </div>
    </div>
  );
}
