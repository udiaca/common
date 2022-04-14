import {
  decodeBase64Url,
  encodeBase64Url,
  compareBuffers,
  decryptData,
  encryptData,
  getRandomString,
  signData,
  timeSafeCompare,
  timeSafeCompareStrings,
  verifyData,
} from '../src'

const encoder = new TextEncoder()
const decoder = new TextDecoder()

describe('crypt', () => {
  const secret = 'Hunter2!'
  const payload = 'foobar'
  const payloadBuff = encoder.encode(payload)
  // passing in (2**31) - 1 will segfault node on my laptop
  const xlPayloadBuff = new ArrayBuffer(2 ** 31)

  describe('symmetric encryption and decryption', () => {
    test('encryptData to decryptData', async () => {
      const encryptedData = await encryptData(payloadBuff, secret)

      // serialize to base64url encoded string
      const encStoredData = encodeBase64Url(new Uint8Array(encryptedData))
      expect(encStoredData).not.toEqual(payload)
      const decryptedData = await decryptData(
        decodeBase64Url(encStoredData),
        secret
      )
      expect(decoder.decode(decryptedData)).toEqual(payload)
    })

    test('encryptData failure', async () => {
      await expect(encryptData(xlPayloadBuff, secret)).rejects.toThrow(
        'data must be less than 2147483648 bits'
      )
    })

    test('decryptData failure', async () => {
      // trying to decrypt something that's not encrypted
      await expect(decryptData(payloadBuff, secret)).rejects.toThrow(
        'The value of "algorithm.iterations" is out of range. It must be an integer. Received NaN'
      )
      // trying to decrypt something with incorrect password
      const encryptedData = await encryptData(payloadBuff, secret)
      await expect(decryptData(encryptedData, secret + 'fail')).rejects.toThrow(
        'Cipher job failed'
      )
      // trying to decrypt something with corrupted data
      const corruptedData = new Uint8Array(encryptedData)
      const byteOffset = 5 + 16 + 12 // iterations + salt + iv
      corruptedData.set(
        crypto.getRandomValues(
          new Uint8Array(corruptedData.byteLength - byteOffset)
        ),
        byteOffset
      )
      await expect(decryptData(corruptedData, secret)).rejects.toThrow(
        'Cipher job failed'
      )
    })
  })

  describe('symmetric signing and verification', () => {
    test('signData to verifyData', async () => {
      const signature = await signData(payloadBuff, secret)
      const signatureBase64 = encodeBase64Url(signature)
      expect(typeof signatureBase64 === 'string').toBeTruthy()
      await expect(
        verifyData(payloadBuff, decodeBase64Url(signatureBase64), secret)
      ).resolves.toBeTruthy()
    })

    test('signData failure', async () => {
      await expect(signData(xlPayloadBuff, secret)).rejects.toThrow(
        'data is too big'
      )
    })

    test('verifyData failure', async () => {
      const signature = await signData(
        encoder.encode('modifiedPayload'),
        secret
      )
      const signatureBase64 = encodeBase64Url(signature)
      expect(typeof signatureBase64 === 'string').toBeTruthy()
      await expect(
        verifyData(payloadBuff, decodeBase64Url(signatureBase64), secret)
      ).resolves.toBeFalsy()
      await expect(
        verifyData(payloadBuff, decodeBase64Url(''), secret)
      ).resolves.toBeFalsy()
    })
  })

  describe('compare', () => {
    test('compareBuffers', () => {
      const a = encoder.encode('foo').buffer
      const b = encoder.encode('foo').buffer
      const c = encoder.encode('foobar').buffer
      expect(compareBuffers(a, b)).toBeTruthy()
      expect(compareBuffers(a, c)).toBeFalsy()
    })

    test('timeSafeCompare', async () => {
      const a = encoder.encode('foo').buffer
      const b = encoder.encode('foo').buffer
      const c = encoder.encode('foobar').buffer
      await expect(timeSafeCompare(a, b)).resolves.toBeTruthy()
      await expect(timeSafeCompare(a, c)).resolves.toBeFalsy()
    })

    test('timeSafeCompareStrings', async () => {
      await expect(timeSafeCompareStrings('foo', 'foo')).resolves.toBeTruthy()
      await expect(timeSafeCompareStrings('foo', 'bar')).resolves.toBeFalsy()
    })
  })

  test('getRandomString', () => {
    expect(typeof getRandomString()).toBe('string')
  })
})
