export const _encoder = new TextEncoder()
export const _decoder = new TextDecoder()

/**
 * Convert arbitrary input into a base64 encoded string.
 * @param {string | Uint8Array | ArrayBuffer} input
 * @returns {string} - base64 encoded string
 */
export const encodeBase64 = (input: string | Uint8Array | ArrayBuffer) => {
  const unencoded = typeof input === 'string' ? _encoder.encode(input) : input
  const bytes = new DataView(
    unencoded instanceof Uint8Array ? unencoded.buffer : unencoded
  )
  const arr = []
  for (let i = 0; i < bytes.byteLength; i++) {
    arr.push(String.fromCharCode(bytes.getUint8(i)))
  }
  return btoa(arr.join(''))
}

/**
 * Convert arbitrary input into a base64Url encoded string.
 * @param {string | Uint8Array | ArrayBuffer} input
 * @returns {string} - base64Url encoded string
 */
export const encodeBase64Url = (input: string | Uint8Array | ArrayBuffer) =>
  encodeBase64(input).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')

/**
 * Convert a base64 encoded string into a Uint8Array.
 * @param {string} encoded
 * @returns {Uint8Array}
 */
export const decodeBase64 = (encoded: string) =>
  new Uint8Array(
    atob(encoded)
      .split('')
      .map((c) => c.charCodeAt(0))
  )

/**
 * Convert a base64Url encoded string into a Uint8Array.
 * @param {string} input
 * @returns {Uint8Array}
 */
export const decodeBase64Url = (encoded: string) =>
  decodeBase64(encoded.replace(/-/g, '+').replace(/_/g, '/').replace(/\s/g, ''))
