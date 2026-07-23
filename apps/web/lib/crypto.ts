/**
 * Production-grade PIN hashing and verification using Node's native crypto.
 * Uses scrypt (memory-hard KDF) with a unique per-PIN random salt.
 * All comparisons use timingSafeEqual to prevent timing attacks.
 *
 * NOTE: promisify(scrypt) only exposes the 3-arg overload, so we use a
 * manual Promise wrapper to pass the options object correctly.
 */
import { randomBytes, scrypt, timingSafeEqual } from 'crypto'

// Scrypt parameters — OWASP recommended minimum
const KEYLEN = 64   // 512-bit output
const N      = 16384  // CPU/memory cost (2^14)
const r      = 8    // Block size
const p      = 1    // Parallelisation factor

/**
 * Wraps crypto.scrypt in a Promise that forwards the options parameter.
 */
function scryptAsync(
  password: string,
  salt: string,
  keylen: number,
  options: { N: number; r: number; p: number }
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, keylen, options, (err, derivedKey) => {
      if (err) reject(err)
      else resolve(derivedKey)
    })
  })
}

/**
 * Hashes a plaintext PIN using scrypt with a cryptographically random salt.
 * Returns a storable string in the format `salt:hash` (both hex-encoded).
 */
export async function hashPin(pin: string): Promise<string> {
  const salt = randomBytes(16).toString('hex')
  const derivedKey = await scryptAsync(pin, salt, KEYLEN, { N, r, p })
  return `${salt}:${derivedKey.toString('hex')}`
}

/**
 * Verifies a plaintext PIN against a stored hash string.
 * Uses constant-time comparison to prevent timing attacks.
 */
export async function verifyPin(pin: string, storedHash: string): Promise<boolean> {
  try {
    const [salt, hashHex] = storedHash.split(':')
    if (!salt || !hashHex) return false

    const storedHashBuffer = Buffer.from(hashHex, 'hex')
    const derivedKey = await scryptAsync(pin, salt, KEYLEN, { N, r, p })

    // Buffers must be equal length for timingSafeEqual
    if (storedHashBuffer.length !== derivedKey.length) return false

    return timingSafeEqual(storedHashBuffer, derivedKey)
  } catch {
    return false
  }
}
