import {
  decodeBase64Url,
  encodeBase64Url,
  compareBuffers,
  decryptData,
  encryptData,
  getRandomString,
  signData,
  hashData,
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

  describe('hashData', () => {
    const alphanum =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    test('SHA-1', async () => {
      // should all match `echo -n '{INPUT}' | shasum -a 1`
      await expect(hashData(undefined, 'SHA-1')).resolves.toEqual(
        'da39a3ee5e6b4b0d3255bfef95601890afd80709'
      )
      await expect(hashData('', 'SHA-1')).resolves.toEqual(
        'da39a3ee5e6b4b0d3255bfef95601890afd80709'
      )
      await expect(hashData(alphanum, 'SHA-1')).resolves.toEqual(
        '761c457bf73b14d27e9e9265c46f4b4dda11f940'
      )
      await expect(
        hashData(encoder.encode(alphanum), 'SHA-1')
      ).resolves.toEqual('761c457bf73b14d27e9e9265c46f4b4dda11f940')
    })

    test('SHA-256', async () => {
      // should all match `echo -n '{INPUT}' | shasum -a 256`
      await expect(hashData(undefined)).resolves.toEqual(
        'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
      )
      await expect(hashData('')).resolves.toEqual(
        'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
      )
      await expect(hashData(alphanum)).resolves.toEqual(
        'db4bfcbd4da0cd85a60c3c37d3fbd8805c77f15fc6b1fdfe614ee0a7c8fdb4c0'
      )
      await expect(hashData(encoder.encode(alphanum))).resolves.toEqual(
        'db4bfcbd4da0cd85a60c3c37d3fbd8805c77f15fc6b1fdfe614ee0a7c8fdb4c0'
      )
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
