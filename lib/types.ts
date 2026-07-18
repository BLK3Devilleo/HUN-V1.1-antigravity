// ============================================================
// Types - Modelos de datos para la plataforma HUN PROD v1.0
// Generados manualmente alineados con los schemas SQL
// ============================================================

// ============================================================
// CENTRAL (Supabase Central NUH)
// ============================================================

export type OrgPlan = 'free' | 'starter' | 'pro' | 'enterprise';
export type UserRole = 'owner' | 'admin' | 'member' | 'moderator';
export type CauseStatus = 'draft' | 'pending_moderation' | 'approved' | 'rejected' | 'archived';
export type CauseCategory = 'educacion' | 'salud' | 'ambiente' | 'construccion' | 'emprendimiento' | 'otro';
export type ModerationDecision = 'approved' | 'rejected' | 'needs_info';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: OrgPlan;
  is_active: boolean;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  org_id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Cause {
  id: string;
  org_id: string;
  creator_id: string;
  title: string;
  description: string;
  category: CauseCategory;
  cta_text: string | null;
  cta_url: string | null;
  media_url: string | null;
  status: CauseStatus;
  rejection_reason: string | null;
  moderation_score: number | null;
  hashtags: string[];
  total_shares: number;
  last_shown_at: string;
  created_at: string;
  updated_at: string;
}

export interface CauseModerationReview {
  id: string;
  cause_id: string;
  moderator_id: string | null;
  decision: ModerationDecision;
  checklist: Record<string, boolean>;
  notes: string | null;
  ai_analysis: Record<string, unknown>;
  created_at: string;
}

// ============================================================
// LOCAL BYODB (Base de datos privada de cada organización)
// ============================================================

export type PostStatus = 'draft' | 'scheduled' | 'processing' | 'published' | 'failed';
export type PostOrigin = 'own' | 'cause_shared';
export type Platform = 'instagram' | 'facebook' | 'linkedin' | 'x' | 'tiktok';
export type TokenStatus = 'connected' | 'expired' | 'revoked' | 'error';
export type MediaStatus = 'pending' | 'uploading' | 'ready' | 'published' | 'cleaned';
export type QueueStatus = 'pending' | 'ready' | 'publishing' | 'published' | 'failed' | 'cancelled';

export interface ScheduledPost {
  id: string;
  org_id: string;
  created_by: string;
  title: string;
  caption: string | null;
  media_urls: string[];
  media_types: string[];
  platforms: Platform[];
  status: PostStatus;
  scheduled_at: string | null;
  published_at: string | null;
  source_cause_id: string | null;
  origin: PostOrigin;
  n8n_webhook_triggered: boolean;
  error_log: string | null;
  created_at: string;
  updated_at: string;
}

export interface SocialToken {
  id: string;
  org_id: string;
  platform: Platform;
  platform_account_id: string;
  platform_username: string | null;
  token_expires_at: string | null;
  status: TokenStatus;
  meta: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  // access_token_enc y refresh_token_enc nunca se exponen al frontend
}

export interface MediaFile {
  id: string;
  org_id: string;
  post_id: string | null;
  file_name: string;
  mime_type: string;
  file_size_bytes: number | null;
  r2_path: string | null;
  public_url: string | null;
  status: MediaStatus;
  upload_progress: number;
  created_at: string;
  updated_at: string;
}

export interface PublishQueueItem {
  id: string;
  org_id: string;
  post_id: string;
  platform: Platform;
  social_token_id: string | null;
  caption: string | null;
  media_urls: string[];
  scheduled_at: string;
  status: QueueStatus;
  retry_count: number;
  max_retries: number;
  idempotency_key: string;
  n8n_execution_id: string | null;
  published_url: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================
// FORMULARIOS (Zod-validated en los Server Actions)
// ============================================================

export interface ConnectByodbFormData {
  supabase_url: string;
  supabase_anon_key: string;
}

export interface CreatePostFormData {
  title: string;
  caption: string;
  platforms: Platform[];
  scheduled_at: string | null;
  media_files: File[];
}
