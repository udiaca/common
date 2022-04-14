import { decodeBase64, decodeBase64Url, encodeBase64, encodeBase64Url } from "../src"

describe('base64Util', () => {
  describe('encodeBase64', () => {
    test('should encode a string appropriately', () => {
      expect(encodeBase64('')).toEqual('')
      expect(encodeBase64('f')).toEqual('Zg==')
      expect(encodeBase64('fo')).toEqual('Zm8=')
      expect(encodeBase64('foo')).toEqual('Zm9v')
      expect(encodeBase64('foob')).toEqual('Zm9vYg==')
      expect(encodeBase64('fooba')).toEqual('Zm9vYmE=')
      expect(encodeBase64('foobar')).toEqual('Zm9vYmFy')
      expect(encodeBase64('abcdefghijklmnopqrstuvwxyz')).toEqual('YWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXo=');
    })

    test('should encode a byte array appropriately', () => {
      expect(encodeBase64(new Uint8Array())).toEqual('')
      expect(encodeBase64(new Uint8Array([102, 111, 111, 98, 97, 114]))).toEqual('Zm9vYmFy')
    })

    test('should encode an array buffer appropriately', () => {
      expect(encodeBase64(new ArrayBuffer(0))).toEqual('')
      expect(encodeBase64(new Uint8Array([102, 111, 111, 98, 97, 114]).buffer)).toEqual('Zm9vYmFy')
    })

  })

  describe('decodeBase64', () => {
    test('should decode a string appropriately', () => {
      expect(decodeBase64('')).toEqual(new Uint8Array())
      expect(decodeBase64('Zg==')).toEqual(new Uint8Array([102]))
      expect(decodeBase64('Zm8=')).toEqual(new Uint8Array([102, 111]))
      expect(decodeBase64('Zm9v')).toEqual(new Uint8Array([102, 111, 111]))
      expect(decodeBase64('Zm9vYg==')).toEqual(new Uint8Array([102, 111, 111, 98]))
      expect(decodeBase64('Zm9vYmE=')).toEqual(new Uint8Array([102, 111, 111, 98, 97]))
      expect(decodeBase64('Zm9vYmFy')).toEqual(new Uint8Array([102, 111, 111, 98, 97, 114]))
      expect(decodeBase64('YWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXo=')).toEqual(new Uint8Array([97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122])
      )
    })
  })

  describe('encodeBase64Url', () => {
    test('should encode a string appropriately', () => {
      expect(encodeBase64Url('')).toEqual('')
      expect(encodeBase64Url('f')).toEqual('Zg')
      expect(encodeBase64Url('fo')).toEqual('Zm8')
      expect(encodeBase64Url('foo')).toEqual('Zm9v')
      expect(encodeBase64Url('foob')).toEqual('Zm9vYg')
      expect(encodeBase64Url('fooba')).toEqual('Zm9vYmE')
      expect(encodeBase64Url('foobar')).toEqual('Zm9vYmFy')
      expect(encodeBase64Url('abcdefghijklmnopqrstuvwxyz')).toEqual('YWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXo');
    })
  })

  describe('decodeBase64Url', () => {
    test('should decode a string appropriately', () => {
      expect(decodeBase64Url('')).toEqual(new Uint8Array())
      expect(decodeBase64Url('Zg')).toEqual(new Uint8Array([102]))
      expect(decodeBase64Url('Zm8')).toEqual(new Uint8Array([102, 111]))
      expect(decodeBase64Url('Zm9v')).toEqual(new Uint8Array([102, 111, 111]))
      expect(decodeBase64Url('Zm9vYg')).toEqual(new Uint8Array([102, 111, 111, 98]))
      expect(decodeBase64Url('Zm9vYmE')).toEqual(new Uint8Array([102, 111, 111, 98, 97]))
      expect(decodeBase64Url('Zm9vYmFy')).toEqual(new Uint8Array([102, 111, 111, 98, 97, 114]))
      expect(decodeBase64Url('YWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXo')).toEqual(new Uint8Array([97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122])
      )
    })
  })
})
