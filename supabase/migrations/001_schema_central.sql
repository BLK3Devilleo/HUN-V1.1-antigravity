-- ============================================================
-- SCHEMA CENTRAL NUH - Supabase Central (Base Pública)
-- Ejecutar COMPLETO en el SQL Editor de tu proyecto Supabase Central
-- Versión: HUN PROD v1.0 | Build 4 Venezuela
-- ============================================================

-- Extensiones requeridas
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. ORGANIZATIONS (Orgs registradas en la plataforma NUH)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.organizations (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL,
  slug          TEXT UNIQUE NOT NULL,           -- ej: build4venezuela
  plan          TEXT NOT NULL DEFAULT 'free'
                  CHECK (plan IN ('free', 'starter', 'pro', 'enterprise')),
  -- Credenciales BYODB cifradas con pgcrypto (aes-256-cbc)
  byodb_url_enc TEXT,                          -- URL del Supabase local (cifrada)
  byodb_key_enc TEXT,                          -- Anon Key del Supabase local (cifrada)
  is_active     BOOLEAN NOT NULL DEFAULT true,
  settings      JSONB NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orgs_slug ON public.organizations (slug);

-- ============================================================
-- 2. PROFILES (Usuarios autorizados - Whitelist de acceso)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  org_id        UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  email         TEXT NOT NULL UNIQUE,
  full_name     TEXT,
  avatar_url    TEXT,
  role          TEXT NOT NULL DEFAULT 'member'
                  CHECK (role IN ('owner', 'admin', 'member', 'moderator')),
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_org   ON public.profiles (org_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles (email);

-- ============================================================
-- 3. CAUSAS GLOBALES (moderadas por NUH, visibles para todas las orgs)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.causes (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id            UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  creator_id        UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  title             TEXT NOT NULL,
  description       TEXT NOT NULL,
  category          TEXT DEFAULT 'otro'
                      CHECK (category IN ('educacion', 'salud', 'ambiente', 'construccion', 'emprendimiento', 'otro')),
  cta_text          TEXT,
  cta_url           TEXT,
  media_url         TEXT,                      -- URL pública del video/imagen en R2/Storage
  status            TEXT NOT NULL DEFAULT 'pending_moderation'
                      CHECK (status IN ('draft', 'pending_moderation', 'approved', 'rejected', 'archived')),
  rejection_reason  TEXT,
  moderation_score  NUMERIC,                   -- Score IA 0.0-1.0
  hashtags          TEXT[] DEFAULT ARRAY['#Build4Venezuela'],
  total_shares      INT NOT NULL DEFAULT 0,
  last_shown_at     TIMESTAMPTZ NOT NULL DEFAULT (NOW() - INTERVAL '30 days'),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_causes_status_shown ON public.causes (status, last_shown_at);
CREATE INDEX IF NOT EXISTS idx_causes_org         ON public.causes (org_id);

-- ============================================================
-- 4. MODERACIÓN DE CAUSAS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.cause_moderation_reviews (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cause_id          UUID NOT NULL REFERENCES public.causes (id) ON DELETE CASCADE,
  moderator_id      UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  decision          TEXT NOT NULL CHECK (decision IN ('approved', 'rejected', 'needs_info')),
  checklist         JSONB NOT NULL DEFAULT '{}',
  notes             TEXT,
  ai_analysis       JSONB DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 5. TRIGGERS - Auto updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_causes_updated_at
  BEFORE UPDATE ON public.causes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- 6. TRIGGER - Auto-crear perfil al registrar usuario en Supabase Auth
-- ============================================================
-- NOTA: Este trigger crea el perfil base, pero la whitelist la gestiona
-- el admin manualmente asignando org_id. No permite acceso libre.
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Solo insertar si ya existe una entrada de whitelist con ese email
  IF EXISTS (SELECT 1 FROM public.profiles WHERE email = NEW.email) THEN
    UPDATE public.profiles
    SET id = NEW.id
    WHERE email = NEW.email AND id IS NULL;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- ============================================================
-- 7. FUNCIÓN - Feed equitativo de causas (sin ranking)
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_causes_feed(p_limit INT DEFAULT 20)
RETURNS SETOF public.causes
LANGUAGE SQL SECURITY DEFINER AS $$
  SELECT * FROM public.causes
  WHERE status = 'approved'
  ORDER BY last_shown_at ASC, random()
  LIMIT p_limit;
$$;

-- Trigger para incrementar shares y rotar last_shown_at
CREATE OR REPLACE FUNCTION public.on_cause_shared()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.causes
  SET total_shares = total_shares + 1,
      last_shown_at = NOW()
  WHERE id = NEW.cause_id;
  RETURN NEW;
END;
$$;

-- ============================================================
-- 8. ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE public.organizations              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.causes                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cause_moderation_reviews   ENABLE ROW LEVEL SECURITY;

-- ORGANIZATIONS: Solo miembros de la org pueden ver su organización
CREATE POLICY "org_member_select"
  ON public.organizations FOR SELECT
  USING (
    id IN (
      SELECT org_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- ORGANIZATIONS: Solo owner/admin puede actualizar su org
CREATE POLICY "org_admin_update"
  ON public.organizations FOR UPDATE
  USING (
    id IN (
      SELECT org_id FROM public.profiles
      WHERE id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- PROFILES: Cada usuario ve solo su propio perfil
CREATE POLICY "profile_self_select"
  ON public.profiles FOR SELECT
  USING (id = auth.uid());

-- PROFILES: Admin/Owner puede ver todos los perfiles de su org
CREATE POLICY "profile_org_admin_select"
  ON public.profiles FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM public.profiles
      WHERE id = auth.uid() AND role IN ('owner', 'admin', 'moderator')
    )
  );

-- PROFILES: Solo el propio usuario puede actualizar su perfil
CREATE POLICY "profile_self_update"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid());

-- CAUSES: Cualquier usuario autenticado puede ver causas aprobadas
CREATE POLICY "causes_approved_select"
  ON public.causes FOR SELECT
  USING (status = 'approved');

-- CAUSES: Miembros de la org creadora pueden ver sus causas propias
CREATE POLICY "causes_own_org_select"
  ON public.causes FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- CAUSES: Solo la org creadora puede insertar causas
CREATE POLICY "causes_org_insert"
  ON public.causes FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- CAUSES: Solo el creador o admin/moderador puede actualizar
CREATE POLICY "causes_update_by_creator_or_mod"
  ON public.causes FOR UPDATE
  USING (
    creator_id = auth.uid()
    OR
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE role IN ('admin', 'moderator', 'owner')
    )
  );

-- CAUSES: Solo el creador o admin/moderador puede eliminar (Fix E6)
CREATE POLICY "causes_delete_by_creator_or_mod"
  ON public.causes FOR DELETE
  USING (
    creator_id = auth.uid()
    OR
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE role IN ('admin', 'moderator', 'owner')
    )
  );

-- MODERACIÓN: Solo moderadores/admins pueden leer/escribir reviews
CREATE POLICY "moderation_reviews_moderator"
  ON public.cause_moderation_reviews FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE role IN ('admin', 'moderator', 'owner')
    )
  );

-- ============================================================
-- 9. VISTA ÚTIL - Cola de moderación para el Panel Admin
-- ============================================================
CREATE OR REPLACE VIEW public.moderation_queue AS
SELECT
  c.id,
  c.title,
  c.description,
  c.status,
  c.media_url,
  c.moderation_score,
  c.created_at,
  p.email  AS creator_email,
  p.full_name AS creator_name,
  o.name   AS org_name,
  o.slug   AS org_slug
FROM public.causes c
JOIN public.profiles p ON p.id = c.creator_id
JOIN public.organizations o ON o.id = c.org_id
WHERE c.status = 'pending_moderation'
ORDER BY c.created_at ASC;

-- ============================================================
-- FIN DEL SCHEMA CENTRAL
-- ============================================================
