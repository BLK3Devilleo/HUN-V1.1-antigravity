'use client';

import { motion, useMotionTemplate, useMotionValue } from 'framer-motion';
import { useEffect } from 'react';

export default function BackgroundEffects() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Sincronizar los motionValues con la posición del ratón
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* 
        1. Fondo base de la app (el gris de NUH), si se necesita reforzar 
        aquí se hace, pero page.tsx ya tiene el div de background base.
      */}

      {/* 2. Formas orgánicas animadas (Aurora) */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute"
        style={{
          top: '10%',
          left: '20%',
          width: '50vw',
          height: '50vw',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255, 97, 166, 0.15) 0%, transparent 70%)',
          filter: 'blur(100px)',
        }}
      />
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        className="absolute"
        style={{
          bottom: '10%',
          right: '15%',
          width: '60vw',
          height: '60vw',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255, 184, 77, 0.15) 0%, transparent 70%)', // Usando el naranja del botón crear
          filter: 'blur(120px)',
        }}
      />

      {/* 
        3. Glow reactivo que sigue al ratón.
        Utilizamos useMotionTemplate para crear un gradiente radial 
        cuyo centro es la posición exacta (X, Y) del ratón.
      */}
      <motion.div
        className="absolute inset-0 z-10"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              800px circle at ${mouseX}px ${mouseY}px,
              rgba(255, 255, 255, 0.4),
              transparent 80%
            )
          `,
        }}
      />

      {/* 
        4. Capa de Ruido (Grain) para darle una textura hiper-premium al cristal.
        Se usa un SVG embebido muy sutil.
      */}
      <div 
        className="absolute inset-0 z-20 opacity-[0.25] mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
        }}
      />
    </div>
  );
}
