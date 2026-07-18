-- ============================================================
-- SCHEMA LOCAL BYODB - Base de Datos Privada por Organización
-- Cada organización ejecuta este script en SU PROPIO Supabase
-- Versión: HUN PROD v1.0 | Build 4 Venezuela
-- ============================================================

-- Extensiones requeridas
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. SCHEDULED_POSTS (Kanban de contenido de la organización)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.scheduled_posts (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id          TEXT NOT NULL,               -- org_id del Supabase Central (referencia externa)
  created_by      TEXT NOT NULL,               -- email del usuario que creó el post
  title           TEXT NOT NULL,
  caption         TEXT,                        -- caption/copy del post
  media_urls      TEXT[] DEFAULT ARRAY[]::TEXT[],  -- URLs en R2/Storage
  media_types     TEXT[] DEFAULT ARRAY[]::TEXT[],  -- 'image' | 'video' por cada URL
  platforms       TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
                                               -- ['instagram','facebook','linkedin','x']
  status          TEXT NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft', 'scheduled', 'processing', 'published', 'failed')),
  scheduled_at    TIMESTAMPTZ,                 -- NULL = sin programar
  published_at    TIMESTAMPTZ,
  -- Referencia a causa global si es contenido clonado
  source_cause_id UUID,                        -- ID de la causa en Supabase Central
  origin          TEXT NOT NULL DEFAULT 'own'
                    CHECK (origin IN ('own', 'cause_shared')),
  -- Metadatos de publicación
  n8n_webhook_triggered BOOLEAN DEFAULT false,
  error_log       TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_posts_status       ON public.scheduled_posts (status);
CREATE INDEX IF NOT EXISTS idx_posts_scheduled_at ON public.scheduled_posts (scheduled_at);
CREATE INDEX IF NOT EXISTS idx_posts_org_id       ON public.scheduled_posts (org_id);

-- ============================================================
-- 2. SOCIAL_TOKENS (Tokens de redes sociales cifrados con pgcrypto)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.social_tokens (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id                TEXT NOT NULL,
  platform              TEXT NOT NULL
                          CHECK (platform IN ('instagram', 'facebook', 'linkedin', 'x', 'tiktok')),
  platform_account_id   TEXT NOT NULL,
  platform_username     TEXT,
  -- Tokens cifrados con AES-256. Descifrar con: pgp_sym_decrypt(access_token_enc::bytea, KEY)
  access_token_enc      TEXT,
  refresh_token_enc     TEXT,
  token_expires_at      TIMESTAMPTZ,
  status                TEXT NOT NULL DEFAULT 'connected'
                          CHECK (status IN ('connected', 'expired', 'revoked', 'error')),
  meta                  JSONB DEFAULT '{}',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (org_id, platform, platform_account_id)
);

CREATE INDEX IF NOT EXISTS idx_tokens_org_platform ON public.social_tokens (org_id, platform);

-- ============================================================
-- 3. MEDIA_FILES (Máquina de estados para archivos multimedia)
-- Estados: PENDIENTE → SUBIENDO → LISTO → PUBLICADO → LIMPIADO
-- ============================================================
CREATE TABLE IF NOT EXISTS public.media_files (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id          TEXT NOT NULL,
  post_id         UUID REFERENCES public.scheduled_posts (id) ON DELETE CASCADE,
  file_name       TEXT NOT NULL,
  mime_type       TEXT NOT NULL,               -- Validado en frontend con Zod
  file_size_bytes BIGINT,
  r2_path         TEXT,                        -- Path en Cloudflare R2
  public_url      TEXT,                        -- URL pública una vez subido
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'uploading', 'ready', 'published', 'cleaned')),
  upload_progress INT DEFAULT 0               -- 0-100
                    CHECK (upload_progress BETWEEN 0 AND 100),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_media_post_id ON public.media_files (post_id);
CREATE INDEX IF NOT EXISTS idx_media_status  ON public.media_files (status);

-- ============================================================
-- 4. PUBLISH_QUEUE (Cola que n8n consulta para publicar)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.publish_queue (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id              TEXT NOT NULL,
  post_id             UUID NOT NULL REFERENCES public.scheduled_posts (id) ON DELETE CASCADE,
  platform            TEXT NOT NULL
                        CHECK (platform IN ('instagram', 'facebook', 'linkedin', 'x', 'tiktok')),
  social_token_id     UUID REFERENCES public.social_tokens (id) ON DELETE SET NULL,
  caption             TEXT,
  media_urls          TEXT[] DEFAULT ARRAY[]::TEXT[],
  scheduled_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status              TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'ready', 'publishing', 'published', 'failed', 'cancelled')),
  retry_count         INT NOT NULL DEFAULT 0,
  max_retries         INT NOT NULL DEFAULT 5,
  -- Idempotencia: evita publicar el mismo post dos veces
  idempotency_key     TEXT UNIQUE NOT NULL
                        DEFAULT encode(gen_random_bytes(16), 'hex'),
  n8n_execution_id    TEXT,
  published_url       TEXT,
  error_message       TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_queue_status_sched ON public.publish_queue (status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_queue_org_id       ON public.publish_queue (org_id);

-- ============================================================
-- 5. WEBHOOK_EVENTS (Log de eventos de n8n → callback)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id      TEXT,
  source      TEXT NOT NULL DEFAULT 'n8n'
                CHECK (source IN ('n8n', 'app', 'supabase')),
  event_type  TEXT NOT NULL,
  payload     JSONB NOT NULL DEFAULT '{}',
  status      TEXT NOT NULL DEFAULT 'received',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 6. TRIGGERS - Auto updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_posts_updated_at
  BEFORE UPDATE ON public.scheduled_posts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_tokens_updated_at
  BEFORE UPDATE ON public.social_tokens
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_media_updated_at
  BEFORE UPDATE ON public.media_files
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_queue_updated_at
  BEFORE UPDATE ON public.publish_queue
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- 7. TRIGGER - Crear entradas en publish_queue al programar un post
-- Cuando un post pasa a 'scheduled', auto-crea filas en publish_queue
-- por cada plataforma definida.
-- ============================================================
CREATE OR REPLACE FUNCTION public.on_post_scheduled()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  _platform TEXT;
  _token_id UUID;
BEGIN
  IF NEW.status = 'scheduled' AND OLD.status != 'scheduled' THEN
    FOREACH _platform IN ARRAY NEW.platforms LOOP
      -- Buscar el token activo de esa plataforma para la org
      SELECT id INTO _token_id
      FROM public.social_tokens
      WHERE org_id = NEW.org_id
        AND platform = _platform
        AND status = 'connected'
      LIMIT 1;

      INSERT INTO public.publish_queue (
        org_id, post_id, platform, social_token_id,
        caption, media_urls, scheduled_at, idempotency_key
      ) VALUES (
        NEW.org_id, NEW.id, _platform, _token_id,
        NEW.caption, NEW.media_urls, COALESCE(NEW.scheduled_at, NOW()),
        md5(NEW.id::text || '_' || _platform)
      )
      ON CONFLICT (idempotency_key) DO NOTHING;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_on_post_scheduled
  AFTER UPDATE ON public.scheduled_posts
  FOR EACH ROW EXECUTE FUNCTION public.on_post_scheduled();

-- ============================================================
-- 8. ROW LEVEL SECURITY (RLS) - Aislamiento por org_id
-- Nota: Las políticas filtran por el header x-user-org-id
-- inyectado por el middleware de Next.js como claim JWT
-- ============================================================
ALTER TABLE public.scheduled_posts  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_tokens    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_files      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.publish_queue    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events   ENABLE ROW LEVEL SECURITY;

-- POSTS: Solo miembros autenticados de la org pueden operar
CREATE POLICY "posts_org_isolation"
  ON public.scheduled_posts FOR ALL
  USING (org_id = current_setting('app.current_org_id', true));

-- TOKENS: Solo miembros de la org pueden ver/gestionar sus tokens
CREATE POLICY "tokens_org_isolation"
  ON public.social_tokens FOR ALL
  USING (org_id = current_setting('app.current_org_id', true));

-- MEDIA: Solo miembros de la org acceden a sus archivos
CREATE POLICY "media_org_isolation"
  ON public.media_files FOR ALL
  USING (org_id = current_setting('app.current_org_id', true));

-- QUEUE: n8n usa service_role que bypasea RLS; el cliente web solo ve la cola propia
CREATE POLICY "queue_org_isolation"
  ON public.publish_queue FOR SELECT
  USING (org_id = current_setting('app.current_org_id', true));

-- WEBHOOKS: Solo service_role de n8n puede insertar
CREATE POLICY "webhooks_service_only"
  ON public.webhook_events FOR ALL
  USING (false); -- Solo accesible via service_role (bypass RLS)

-- ============================================================
-- 9. VISTA ÚTIL - Cola pendiente para n8n (usa service_role)
-- ============================================================
CREATE OR REPLACE VIEW public.n8n_pending_queue AS
SELECT
  q.id,
  q.org_id,
  q.post_id,
  q.platform,
  q.caption,
  q.media_urls,
  q.scheduled_at,
  q.status,
  q.retry_count,
  q.max_retries,
  q.idempotency_key,
  t.access_token_enc,
  t.platform_account_id
FROM public.publish_queue q
LEFT JOIN public.social_tokens t ON t.id = q.social_token_id
WHERE q.status IN ('pending', 'ready')
  AND q.scheduled_at <= NOW()
  AND q.retry_count < q.max_retries
ORDER BY q.scheduled_at ASC;

-- ============================================================
-- FIN DEL SCHEMA LOCAL BYODB
-- ============================================================
