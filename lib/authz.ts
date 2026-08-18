import { getAuthContext, type AuthContext } from '@/lib/auth';
import { logger } from '@/lib/logger';

/**
 * Guardas de autorización reutilizables.
 *
 * Motivación: la comprobación de rol estaba copiada literalmente en cada
 * Server Action (`if (role !== 'owner' && role !== 'admin')`), con listas de
 * roles escritas a mano y mensajes distintos en cada sitio. Un rol nuevo
 * obligaba a editar N ficheros y era fácil olvidar uno — justo la clase de
 * fallo que abre un agujero de autorización.
 *
 * Aquí el modelo de roles vive en UN sitio y las acciones solo declaran el
 * permiso que necesitan.
 */

export type Role = 'owner' | 'admin' | 'moderator' | 'member';

/** Jerarquía de roles. Un número mayor incluye los permisos de los menores. */
const ROLE_RANK: Record<Role, number> = {
  member: 10,
  moderator: 20,
  admin: 30,
  owner: 40,
};

/** Roles que pueden administrar la organización (BYODB, webhooks, ajustes). */
export const ADMIN_ROLES: readonly Role[] = ['owner', 'admin'];

/** Roles que pueden moderar contenido. */
export const MODERATOR_ROLES: readonly Role[] = ['owner', 'admin', 'moderator'];

function isRole(value: string | null): value is Role {
  return value === 'owner' || value === 'admin' || value === 'moderator' || value === 'member';
}

/** `true` si `role` alcanza el rango mínimo de `minimum`. */
export function hasAtLeast(role: string | null, minimum: Role): boolean {
  if (!isRole(role)) return false;
  return ROLE_RANK[role] >= ROLE_RANK[minimum];
}

/** Contexto de un usuario ya autenticado y con organización resuelta. */
export interface AuthorizedContext {
  user: NonNullable<AuthContext['user']>;
  orgId: string;
  role: Role | null;
}

export type AuthzFailureReason =
  | 'unauthenticated'
  | 'no_organization'
  | 'insufficient_permissions';

export type AuthzResult =
  | { ok: true; context: AuthorizedContext }
  | { ok: false; reason: AuthzFailureReason; error: string };

const FAILURE_MESSAGES: Record<AuthzFailureReason, string> = {
  unauthenticated: 'Sesión expirada. Por favor vuelve a iniciar sesión.',
  no_organization: 'Tu perfil no tiene ninguna organización asignada.',
  insufficient_permissions: 'No tienes permisos suficientes para realizar esta acción.',
};

/**
 * Resuelve la sesión y comprueba el permiso mínimo requerido, registrando
 * siempre la denegación (fail-closed + trazabilidad).
 *
 * @param event - Nombre del evento para el log, p. ej. `action.byodb_connect`.
 * @param minimumRole - Rol mínimo exigido. Si se omite, basta con estar
 *   autenticado y pertenecer a una organización.
 */
export async function authorize(event: string, minimumRole?: Role): Promise<AuthzResult> {
  const { user, orgId, role } = await getAuthContext();

  if (!user) {
    logger.warn(`${event}.denied`, { reason: 'unauthenticated' });
    return { ok: false, reason: 'unauthenticated', error: FAILURE_MESSAGES.unauthenticated };
  }

  if (!orgId) {
    logger.warn(`${event}.denied`, {
      user: user.email || user.id,
      reason: 'no_organization',
    });
    return { ok: false, reason: 'no_organization', error: FAILURE_MESSAGES.no_organization };
  }

  if (minimumRole && !hasAtLeast(role, minimumRole)) {
    logger.warn(`${event}.denied`, {
      user: user.email || user.id,
      org: orgId,
      role,
      required: minimumRole,
      reason: 'insufficient_permissions',
    });
    return {
      ok: false,
      reason: 'insufficient_permissions',
      error: FAILURE_MESSAGES.insufficient_permissions,
    };
  }

  return {
    ok: true,
    context: { user, orgId, role: isRole(role) ? role : null },
  };
}
