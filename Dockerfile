# ============================================================
# Dockerfile Multietapa Optimizado para Next.js (Standalone)
# ============================================================

# 1. Base - Instalación de Node.js y configuración
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat

# 2. Dependencies - Instalación de dependencias (cacheable)
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# 3. Builder - Compilación de la aplicación
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Variables de entorno requeridas en tiempo de compilación (build time)
# NOTA: Supabase Central URL y Anon Key deben ser accesibles al compilar Next.js
ARG NEXT_PUBLIC_SUPABASE_CENTRAL_URL
ARG NEXT_PUBLIC_SUPABASE_CENTRAL_ANON_KEY
ARG NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_SUPABASE_CENTRAL_URL=$NEXT_PUBLIC_SUPABASE_CENTRAL_URL
ENV NEXT_PUBLIC_SUPABASE_CENTRAL_ANON_KEY=$NEXT_PUBLIC_SUPABASE_CENTRAL_ANON_KEY
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL

# Desactivar telemetría
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# 4. Runner - Imagen de producción ligera
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Crear usuario sin privilegios para mayor seguridad (Zero Trust)
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copiar assets públicos y configuración de standalone
COPY --from=builder /app/public ./public

# Configurar permisos correctos para la caché de Next.js
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copiar el empaquetado standalone compilado por Next.js
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3357
ENV PORT=3357

CMD ["node", "server.js"]
