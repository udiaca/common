import { invariant } from '../src'

describe('invariant', () => {
  it('should satisfy invariant condition logic', () => {
    const stub = 'stub'

    expect(invariant(stub)).toBeUndefined()

    expect(() => invariant(stub[0] === 'x')).toThrowError('Invariant failed')
    expect(() =>
      invariant(stub[0] === 'x', 'first char is not "x"')
    ).toThrowError('Invariant failed: first char is not "x"')
    expect(() =>
      invariant(stub[0] === 'x', () => 'first char is not "x"')
    ).toThrowError('Invariant failed: first char is not "x"')
  })
})
