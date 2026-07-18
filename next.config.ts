import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  // Omitir comprobaciones de tipo e ESLint durante la compilación de Docker si es necesario, 
  // pero ya comprobamos que compila sin errores de tipado.
};

export default nextConfig;
