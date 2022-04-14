import { _decoder, encodeBase64Url, _encoder } from './base64Util'

const getSecretPBKDF2Key = (password: string): PromiseLike<CryptoKey> =>
  crypto.subtle.importKey('raw', _encoder.encode(password), 'PBKDF2', false, [
    'deriveKey',
  ])

const getSymEncryptionKey = (
  pbkdf2Key: CryptoKey,
  salt: Uint8Array,
  keyUsage: CryptoKey['usages'],
  iterations: number
): PromiseLike<CryptoKey> =>
  crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: iterations,
      hash: 'SHA-256',
    },
    pbkdf2Key,
    { name: 'AES-GCM', length: 256 },
    false,
    keyUsage
  )

const getSymSigningKey = (
  pbkdf2Key: CryptoKey,
  salt: Uint8Array,
  keyUsage: CryptoKey['usages'],
  iterations: number
): PromiseLike<CryptoKey> =>
  crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: iterations,
      hash: 'SHA-256',
    },
    pbkdf2Key,
    { name: 'HMAC', hash: 'SHA-256', length: 256 },
    false,
    keyUsage
  )

/**
 * Encrypt a payload ArrayBuffer using a secret string
 * @param {ArrayBuffer} secretData data to be encrypted
 * @param {string} secret secret string used to encrypt data
 * @returns {Promise<ArrayBuffer>} encrypted data
 */
export const encryptData = async (
  secretData: ArrayBuffer,
  secret: string
): Promise<ArrayBuffer> => {
  const iterations = 100000
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const secretKey = await getSecretPBKDF2Key(secret)
  const aesKey = await getSymEncryptionKey(
    secretKey,
    salt,
    ['encrypt'],
    iterations
  )
  const encryptedContent = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    aesKey,
    secretData
  )

  const encryptedContentArr = new Uint8Array(encryptedContent)
  const iterationsArr = new Uint8Array(_encoder.encode(iterations.toString()))

  const buff = new Uint8Array(
    iterationsArr.byteLength +
      salt.byteLength +
      iv.byteLength +
      encryptedContentArr.byteLength
  )
  let bytes = 0
  buff.set(iterationsArr, bytes)
  buff.set(salt, (bytes += iterationsArr.byteLength))
  buff.set(iv, (bytes += salt.byteLength))
  buff.set(encryptedContentArr, (bytes += iv.byteLength))

  return buff.buffer
}

/**
 * Decrypt data using a secret string
 * @param {ArrayBuffer} encryptedData encrypted data
 * @param {string} secret secret string used to decrypt data
 * @returns {Promise<ArrayBuffer>} decrypted data
 */
export const decryptData = async (
  encryptedData: ArrayBuffer,
  secret: string
): Promise<ArrayBuffer> => {
  const encData = new Uint8Array(encryptedData)

  let bytes = 0
  const iterations = Number(_decoder.decode(encData.slice(bytes, (bytes += 6))))
  const salt = new Uint8Array(encData.slice(bytes, (bytes += 16)))
  const iv = new Uint8Array(encData.slice(bytes, (bytes += 12)))
  const data = new Uint8Array(encData.slice(bytes))

  const secretKey = await getSecretPBKDF2Key(secret)
  const aesKey = await getSymEncryptionKey(
    secretKey,
    salt,
    ['decrypt'],
    iterations
  )
  return crypto.subtle.decrypt({ name: 'AES-GCM', iv }, aesKey, data)
}

/**
 * Cryptographically sign data using a secret string
 * @param {ArrayBuffer} payload data to sign
 * @param {string} secret secret string used to sign data
 * @returns {Promise<ArrayBuffer>} signature of payload
 */
export const signData = async (
  payload: ArrayBuffer,
  secret: string
): Promise<ArrayBuffer> => {
  const iterations = 10000
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const secretKey = await getSecretPBKDF2Key(secret)
  const hmacKey = await getSymSigningKey(secretKey, salt, ['sign'], iterations)
  const sig = await crypto.subtle.sign('HMAC', hmacKey, payload)

  const sigContentArr = new Uint8Array(sig)
  const iterationsArr = new Uint8Array(_encoder.encode(iterations.toString()))

  const buff = new Uint8Array(
    iterationsArr.byteLength + salt.byteLength + sigContentArr.byteLength
  )
  let bytes = 0
  buff.set(iterationsArr, bytes)
  buff.set(salt, (bytes += iterationsArr.byteLength))
  buff.set(sigContentArr, (bytes += salt.byteLength))
  return buff.buffer
}

/**
 * Cryptographically verify signature of a payload using a secret string
 * @param {ArrayBuffer} payload data to verify signature for
 * @param {ArrayBuffer} signature candidate signature of payload
 * @param {string} secret secret string used to sign data
 * @returns {Promise<boolean>} true if signature is valid, false otherwise
 */
export const verifyData = async (
  payload: ArrayBuffer,
  signature: ArrayBuffer,
  secret: string
): Promise<boolean> => {
  try {
    const sigContentArr = new Uint8Array(signature)
    let bytes = 0
    const iterations = Number(
      _decoder.decode(sigContentArr.slice(bytes, (bytes += 5)))
    )
    const salt = new Uint8Array(sigContentArr.slice(bytes, (bytes += 16)))
    const sig = new Uint8Array(sigContentArr.slice(bytes))
    const secretKey = await getSecretPBKDF2Key(secret)
    const hmacKey = await getSymSigningKey(
      secretKey,
      salt,
      ['verify'],
      iterations
    )
    return crypto.subtle.verify('HMAC', hmacKey, sig, payload)
  } catch {
    return false
  }
}

/**
 * Equality comparison between two array buffers
 * @param {ArrayBuffer} a
 * @param {ArrayBuffer} b
 * @returns {boolean} true if equal, false otherwise
 */
export const compareBuffers = (a: ArrayBuffer, b: ArrayBuffer): boolean => {
  const av = new DataView(a)
  const bv = new DataView(b)

  if (av.byteLength !== bv.byteLength) {
    return false
  }

  let i = av.byteLength
  while (i--) {
    if (av.getUint8(i) !== bv.getUint8(i)) {
      return false
    }
  }
  return true
}

/**
 * Timing attack secure equality comparison between two array buffers
 * @param {ArrayBuffer} a
 * @param {ArrayBuffer} b
 * @returns {Promise<boolean>} true if equal, false otherwise
 */
export const timeSafeCompare = async (
  a: ArrayBuffer,
  b: ArrayBuffer
): Promise<boolean> => {
  const key = await crypto.subtle.generateKey(
    { name: 'HMAC', hash: { name: 'SHA-256' } },
    false,
    ['sign', 'verify']
  )
  const [as, bs] = await Promise.all([
    crypto.subtle.sign('HMAC', key, a),
    crypto.subtle.sign('HMAC', key, b),
  ])
  return compareBuffers(as, bs)
}

/**
 * Timing attack secure equality comparison between two strings
 * @param {string} a
 * @param {string} b
 * @returns {Promise<boolean>} true if equal, false otherwise
 */
export const timeSafeCompareStrings = (
  a: string,
  b: string
): Promise<boolean> =>
  timeSafeCompare(_encoder.encode(a).buffer, _encoder.encode(b).buffer)

/**
 * Derive a base64url encoded string
 * @param {number} [byteLen=16] default 16 bytes (128 bits)
 * @returns {string} base64url encoded string
 */
export const getRandomString = (byteLen = 16): string =>
  encodeBase64Url(crypto.getRandomValues(new Uint8Array(byteLen)))
