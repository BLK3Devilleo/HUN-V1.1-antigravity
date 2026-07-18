import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const R2_ENDPOINT = `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;

/**
 * Cliente S3-compatible para Cloudflare R2.
 * Se crea como función para evitar problemas de singleton en entornos serverless.
 */
function getR2Client() {
  return new S3Client({
    region: 'auto',
    endpoint: R2_ENDPOINT,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });
}

// Tipos MIME permitidos. No admitimos scripts ni ejecutables.
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'video/mp4',
  'video/quicktime',
  'video/x-msvideo',
  'video/webm',
]);

const MAX_FILE_SIZE_BYTES = 500 * 1024 * 1024; // 500 MB

export interface PresignedUrlResult {
  uploadUrl: string;
  publicUrl: string;
  r2Path: string;
}

/**
 * Genera una URL pre-firmada para que el navegador del cliente suba
 * directamente a Cloudflare R2 sin pasar por nuestro servidor.
 * @param orgId - ID de la organización (para aislar archivos por tenant)
 * @param fileName - Nombre original del archivo
 * @param mimeType - Tipo MIME validado del archivo
 * @param fileSize - Tamaño del archivo en bytes
 */
export async function generatePresignedUploadUrl(
  orgId: string,
  fileName: string,
  mimeType: string,
  fileSize: number
): Promise<PresignedUrlResult> {
  // 1. Validar MIME type (anti-exploit)
  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    throw new Error(`Tipo de archivo no permitido: ${mimeType}`);
  }

  // 2. Validar tamaño máximo
  if (fileSize > MAX_FILE_SIZE_BYTES) {
    throw new Error(`El archivo excede el límite de 500 MB`);
  }

  // 3. Generar un path único aislado por org para garantizar multi-tenancy
  const timestamp = Date.now();
  const sanitizedName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const r2Path = `orgs/${orgId}/${timestamp}_${sanitizedName}`;

  // 4. Crear el comando de carga y firmar la URL (expira en 15 minutos)
  const client = getR2Client();
  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: r2Path,
    ContentType: mimeType,
    ContentLength: fileSize,
  });

  const uploadUrl = await getSignedUrl(client, command, { expiresIn: 900 });
  const publicUrl = `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${r2Path}`;

  return { uploadUrl, publicUrl, r2Path };
}
