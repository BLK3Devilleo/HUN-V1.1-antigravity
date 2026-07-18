import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generatePresignedUploadUrl } from '@/lib/r2';

const PresignSchema = z.object({
  fileName: z.string().min(1).max(260),
  mimeType: z.string().min(1),
  fileSize: z.number().positive().max(524288000), // 500MB
});

export async function POST(request: NextRequest) {
  // Verificar que el org_id venga del middleware (usuario autenticado)
  const orgId = request.headers.get('x-user-org-id');
  if (!orgId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Cuerpo de petición inválido' }, { status: 400 });
  }

  const parsed = PresignSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' },
      { status: 400 }
    );
  }

  const { fileName, mimeType, fileSize } = parsed.data;

  try {
    const result = await generatePresignedUploadUrl(orgId, fileName, mimeType, fileSize);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error generando URL de carga';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
