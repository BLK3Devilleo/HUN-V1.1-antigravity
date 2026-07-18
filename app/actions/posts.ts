'use server';

import { z } from 'zod';
import { headers } from 'next/headers';
import { createLocalClient } from '@/lib/supabase';
import { createCentralServerClient } from '@/lib/supabase-server';
import type { Platform, PostStatus } from '@/lib/types';
import { decryptText } from '@/lib/crypto';

// ============================================================
// Schemas Zod
// ============================================================
const CreatePostSchema = z.object({
  title: z.string().min(3, 'El título debe tener al menos 3 caracteres').max(200),
  caption: z.string().max(2200, 'El caption no puede superar los 2200 caracteres').optional(),
  platforms: z
    .array(z.enum(['instagram', 'facebook', 'linkedin', 'x', 'tiktok']))
    .min(1, 'Selecciona al menos una plataforma'),
  scheduled_at: z.string().datetime({ offset: true }).optional().nullable(),
  media_urls: z.array(z.string().url()).optional().default([]),
  media_types: z.array(z.string()).optional().default([]),
  source_cause_id: z.string().uuid().optional().nullable(),
  origin: z.enum(['own', 'cause_shared']).default('own'),
});

export type CreatePostInput = z.infer<typeof CreatePostSchema>;

export interface PostActionResult {
  success: boolean;
  message: string;
  postId?: string;
  error?: string;
}

// ============================================================
// Server Action: Crear un post en la BD local de la org (BYODB)
// ============================================================
export async function createPost(input: CreatePostInput): Promise<PostActionResult> {
  const parsed = CreatePostSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: 'Datos inválidos',
      error: parsed.error.issues[0]?.message ?? 'Error de validación',
    };
  }

  const { title, caption, platforms, scheduled_at, media_urls, media_types, origin, source_cause_id } =
    parsed.data;

  // Obtener contexto de sesión del middleware
  const headerList = await headers();
  const orgId = headerList.get('x-user-org-id');
  const userEmail = headerList.get('x-user-email');

  if (!orgId || !userEmail) {
    return { success: false, message: 'Sesión inválida', error: 'Vuelve a iniciar sesión.' };
  }

  // Obtener credenciales BYODB del Supabase Central
  const central = await createCentralServerClient();
  const { data: org } = await central
    .from('organizations')
    .select('byodb_url_enc, byodb_key_enc')
    .eq('id', orgId)
    .single();

  if (!org?.byodb_url_enc || !org?.byodb_key_enc) {
    return {
      success: false,
      message: 'Base de datos local no conectada',
      error: 'Ve a Configuración y conecta tu Supabase local.',
    };
  }

  // Determinar el estado inicial
  const status: PostStatus = scheduled_at ? 'scheduled' : 'draft';

  // Insertar en la BD local del cliente (con descifrado AES-256-GCM)
  const decryptedUrl = decryptText(org.byodb_url_enc);
  const decryptedKey = decryptText(org.byodb_key_enc);
  if (!decryptedUrl || !decryptedKey) {
    return {
      success: false,
      message: 'Error al conectar base de datos local',
      error: 'No se pudieron descifrar las credenciales de conexión.',
    };
  }
  const local = createLocalClient(decryptedUrl, decryptedKey, orgId);
  const { data: post, error: insertError } = await local
    .from('scheduled_posts')
    .insert({
      org_id: orgId,
      created_by: userEmail,
      title,
      caption: caption ?? null,
      platforms,
      status,
      scheduled_at: scheduled_at ?? null,
      media_urls: media_urls ?? [],
      media_types: media_types ?? [],
      origin,
      source_cause_id: source_cause_id ?? null,
    })
    .select('id')
    .single();

  if (insertError) {
    return {
      success: false,
      message: 'Error al crear el post',
      error: insertError.message,
    };
  }

  return {
    success: true,
    message: status === 'scheduled' ? '¡Post programado correctamente!' : 'Borrador guardado.',
    postId: post.id,
  };
}

// ============================================================
// Server Action: Obtener todos los posts de la org (para el Kanban)
// ============================================================
export async function getPosts(): Promise<{
  posts: Record<PostStatus, Array<{ id: string; title: string; caption: string | null; platforms: Platform[]; scheduled_at: string | null; media_urls: string[]; created_at: string }>>;
  error: string | null;
}> {
  type PostRow = { id: string; title: string; caption: string | null; platforms: Platform[]; scheduled_at: string | null; media_urls: string[]; created_at: string };
  const emptyBoard: Record<PostStatus, PostRow[]> = {
    draft: [],
    scheduled: [],
    processing: [],
    published: [],
    failed: [],
  };

  const headerList = await headers();
  const orgId = headerList.get('x-user-org-id');
  if (!orgId) return { posts: emptyBoard, error: 'Sin sesión' };

  const central = await createCentralServerClient();
  const { data: org } = await central
    .from('organizations')
    .select('byodb_url_enc, byodb_key_enc')
    .eq('id', orgId)
    .single();

  if (!org?.byodb_url_enc || !org?.byodb_key_enc) {
    return { posts: emptyBoard, error: 'byodb_not_connected' };
  }

  const decryptedUrl = decryptText(org.byodb_url_enc);
  const decryptedKey = decryptText(org.byodb_key_enc);
  if (!decryptedUrl || !decryptedKey) {
    return { posts: emptyBoard, error: 'error_decryption_failed' };
  }
  const local = createLocalClient(decryptedUrl, decryptedKey, orgId);
  const { data, error } = await local
    .from('scheduled_posts')
    .select('id, title, caption, platforms, status, scheduled_at, media_urls, created_at')
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) return { posts: emptyBoard, error: error.message };

  // Agrupar por status para el Kanban
  const board = { ...emptyBoard } as typeof emptyBoard;
  for (const post of data ?? []) {
    const col = post.status as PostStatus;
    if (col in board) {
      board[col].push(post);
    }
  }

  return { posts: board, error: null };
}

// ============================================================
// Server Action: Mover una tarjeta de columna (actualizar status)
// ============================================================
export async function movePost(
  postId: string,
  newStatus: PostStatus,
  scheduledAt?: string | null
): Promise<PostActionResult> {
  const headerList = await headers();
  const orgId = headerList.get('x-user-org-id');
  if (!orgId) return { success: false, message: 'Sin sesión' };

  const central = await createCentralServerClient();
  const { data: org } = await central
    .from('organizations')
    .select('byodb_url_enc, byodb_key_enc')
    .eq('id', orgId)
    .single();

  if (!org?.byodb_url_enc || !org?.byodb_key_enc) {
    return { success: false, message: 'BD local no conectada' };
  }

  const decryptedUrl = decryptText(org.byodb_url_enc);
  const decryptedKey = decryptText(org.byodb_key_enc);
  if (!decryptedUrl || !decryptedKey) {
    return { success: false, message: 'Error al descifrar credenciales locales.' };
  }
  const local = createLocalClient(decryptedUrl, decryptedKey, orgId);
  const updatePayload: Record<string, unknown> = { status: newStatus };
  if (newStatus === 'scheduled' && scheduledAt) {
    updatePayload.scheduled_at = scheduledAt;
  }

  const { error } = await local
    .from('scheduled_posts')
    .update(updatePayload)
    .eq('id', postId);

  if (error) {
    return { success: false, message: 'Error al mover el post', error: error.message };
  }

  return { success: true, message: 'Post movido correctamente.' };
}
