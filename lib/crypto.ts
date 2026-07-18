import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.BYODB_ENCRYPTION_KEY || '00000000000000000000000000000000';
const IV_LENGTH = 16;

/**
 * Cifra un texto utilizando AES-256-GCM para asegurar credenciales multi-tenant en reposo.
 */
export function encryptText(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const keyBuffer = Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32));
  const cipher = crypto.createCipheriv('aes-256-gcm', keyBuffer, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Descifra un texto previamente cifrado utilizando AES-256-GCM.
 * Retorna null en caso de fallo de autenticación o llave incorrecta.
 */
export function decryptText(text: string): string | null {
  try {
    const [ivHex, authTagHex, encrypted] = text.split(':');
    if (!ivHex || !authTagHex || !encrypted) return null;
    
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const keyBuffer = Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32));
    
    const decipher = crypto.createDecipheriv('aes-256-gcm', keyBuffer, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch {
    return null;
  }
}
