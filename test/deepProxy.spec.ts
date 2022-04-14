import { deepProxy, invariant } from '../src'

describe('deepProxy', () => {
  const setStub = jest.fn()
  const delPropStub = jest.fn()

  function createStubProxy<T extends object>(stub: T) {
    return deepProxy(stub, {
      set(root, target, path, value, receiver) {
        setStub(root, target, path, value, receiver)
        return true
      },
      deleteProperty(root, target, path) {
        delPropStub(root, target, path)
        return true
      },
    })
  }

  beforeEach(() => {
    jest.resetAllMocks()
  })

  describe('set', () => {
    it('should capture shallow set', () => {
      const stub = { attr: 'hello' }
      const stubProxy = createStubProxy(stub)
      stubProxy.attr = 'hello world!'
      expect(stubProxy).toMatchObject({ attr: 'hello world!' })
      expect(setStub).toBeCalledWith(
        stub,
        stubProxy,
        ['attr'],
        'hello world!',
        stubProxy
      )
    })

    it('should capture deep set', () => {
      const stub = { attr: { foo: 'bar' } }
      const stubProxy = createStubProxy(stub)
      stubProxy.attr.foo = 'barrio'
      expect(stubProxy).toMatchObject({ attr: { foo: 'barrio' } })
      expect(setStub).toBeCalledWith(
        stub,
        stubProxy.attr,
        ['attr', 'foo'],
        'barrio',
        stubProxy.attr
      )
    })

    it('should capture deep set with object value', () => {
      const stub = { attr: { foo: 'bar' } } as {
        attr: { foo: string | unknown }
      }
      const stubProxy = createStubProxy(stub)
      stubProxy.attr.foo = { bar: 'barrio' }
      expect(stubProxy).toMatchObject({ attr: { foo: { bar: 'barrio' } } })
      expect(setStub).toBeCalledWith(
        stub,
        stubProxy.attr,
        ['attr', 'foo'],
        { bar: 'barrio' },
        stubProxy.attr
      )
    })

    it('should capture set within array', () => {
      const stub = {
        attr: ['a', 'b', 'c'],
      }
      const stubProxy = createStubProxy(stub)
      stub.attr[1] = 'to'
      expect(stubProxy).toMatchObject({ attr: ['a', 'to', 'c'] })
      expect(setStub).toBeCalledWith(
        stub,
        stubProxy.attr,
        ['attr', '1'],
        'to',
        stubProxy.attr
      )
    })

    it('should capture set within object within array', () => {
      const stub = {
        attr: {
          baz: [{ nested: true }],
        },
      }
      const stubProxy = createStubProxy(stub)
      stubProxy.attr.baz[0].nested = false
      expect(stubProxy).toMatchObject({ attr: { baz: [{ nested: false }] } })
      expect(setStub).toBeCalledWith(
        stub,
        stubProxy.attr.baz[0],
        ['attr', 'baz', '0', 'nested'],
        false,
        stubProxy.attr.baz[0]
      )
    })

    it('should capture array push modification', () => {
      const stub = {
        attr: ['a', 'b', 'c'],
      }
      const stubProxy = createStubProxy(stub)
      stub.attr.push('d')
      expect(stubProxy).toMatchObject({ attr: ['a', 'b', 'c', 'd'] })
      // captures set
      expect(setStub).toBeCalledWith(
        stub,
        stubProxy.attr,
        ['attr', '3'],
        'd',
        stubProxy.attr
      )
      // captures length attribute modification of array
      expect(setStub).toBeCalledWith(
        stub,
        stubProxy.attr,
        ['attr', 'length'],
        4,
        stubProxy.attr
      )
    })
  })

  describe('deleteProperty', () => {
    it('should capture delete shallow property', () => {
      const stub: { attr1?: string } = { attr1: 'hello' }
      const stubProxy = createStubProxy(stub)
      delete stubProxy.attr1
      expect(stubProxy).toMatchObject({})
      expect(delPropStub).toBeCalledWith(stub, stubProxy, ['attr1'])
    })

    it('should capture delete child property', () => {
      const stub: { attr2?: { foo?: string } } = { attr2: { foo: 'bar' } }
      const stubProxy = createStubProxy(stub)
      invariant(stubProxy.attr2)
      delete stubProxy.attr2.foo
      expect(stubProxy).toMatchObject({ attr2: {} })
      expect(delPropStub).toBeCalledWith(stub, stubProxy.attr2, [
        'attr2',
        'foo',
      ])
    })

    it('should capture delete parent of children', () => {
      const stub: { attr2?: { foo?: string } } = { attr2: { foo: 'bar' } }
      const stubProxy = createStubProxy(stub)
      delete stubProxy.attr2
      expect(stubProxy).toMatchObject({})
      expect(delPropStub).toBeCalledWith(stub, stubProxy, ['attr2'])
    })

    it('should capture delete parent of grandchildren', () => {
      const stub: { attr3?: { foo?: { bar?: string } } } = {
        attr3: { foo: { bar: 'baz' } },
      }
      const stubProxy = createStubProxy(stub)
      delete stubProxy.attr3
      expect(stubProxy).toMatchObject({})
      expect(delPropStub).toBeCalledWith(stub, stubProxy, ['attr3'])
    })

    it('should handle delete non-existent property', () => {
      const stub: { attr1?: string; attr2?: string } = { attr1: 'hello' }
      const stubProxy = createStubProxy(stub)
      delete stubProxy.attr2
      expect(stubProxy).toMatchObject({ attr1: 'hello' })
      expect(delPropStub).not.toBeCalled()
    })
  })
})
