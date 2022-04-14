export interface DeepProxyHandler<T extends object> {
  set?(
    root: T,
    target: T,
    path: Array<keyof T>,
    value: unknown,
    receiver: unknown
  ): boolean
  deleteProperty?(root: T, target: T, path: Array<keyof T>): boolean
}

/**
 * Utility function for creating a deep proxy of an object.
 * NOTE: Only string type attributes are supported with proxy.
 * Partial ES2015 proxy handler support. Refer to DeepProxyHandler interface.
 * Many typescript hacks in this function due to use of T generic object type.
 * @param {object} target non-null javascript object to proxy
 * @param {DeepProxyHandler} handler
 * @returns {object} deep proxy of target
 */
const deepProxy = <T extends object>(
  target: T,
  handler: DeepProxyHandler<T>
): T => {
  const preProxyMap = new WeakMap<T, T[keyof T]>()

  function unProxy(obj: T, key: keyof T) {
    if (preProxyMap.has(obj[key] as unknown as T)) {
      obj[key] = preProxyMap.get(obj[key] as unknown as T) as T[keyof T]
      preProxyMap.delete(obj[key] as unknown as T)
    }

    for (const k in obj[key]) {
      if (obj[key][k] !== null && typeof obj[key][k] === 'object') {
        unProxy(obj[key] as unknown as T, k as unknown as keyof T)
      }
    }
  }

  function proxy(obj: T, path: Array<keyof T>) {
    function makeHandler(path: Array<keyof T>): ProxyHandler<T> {
      return {
        set(sTarget, key: Extract<keyof T, string>, value, receiver) {
          if (value !== null && typeof value === 'object') {
            value = proxy(value, [...path, key])
          }
          let handlerOk = true
          if (handler.set) {
            handlerOk = handler.set(
              target,
              sTarget,
              [...path, key],
              value,
              receiver
            )
          }
          return handlerOk && Reflect.set(sTarget, key, value, receiver)
        },
        deleteProperty(dpTarget, key: Extract<keyof T, string>) {
          if (Reflect.has(dpTarget, key)) {
            unProxy(dpTarget, key)
            const deleted = Reflect.deleteProperty(dpTarget, key)
            if (deleted && handler.deleteProperty) {
              handler.deleteProperty(target, dpTarget, [...path, key])
            }
            return deleted
          }
          return false
        },
      }
    }

    for (const key in obj) {
      if (obj[key] !== null && typeof obj[key] === 'object') {
        const childProxy = proxy(obj[key] as unknown as T, [...path, key])
        obj[key] = childProxy as unknown as T[Extract<keyof T, string>]
      }
    }
    const objProxy = new Proxy(obj, makeHandler(path))
    preProxyMap.set(objProxy, obj as unknown as T[keyof T])
    return objProxy
  }

  return proxy(target, [])
}

export default deepProxy
