import type { SafeEmitter } from '../types'

/**
 * mpx-es-check 事件监听处理
 */
export default function createEmitter (): SafeEmitter {
  const listeners: Record<string, Array<(...args: unknown[]) => void>> = Object.create(null)

  return Object.freeze({
    on (eventName: string, listener: (...args: unknown[]) => void) {
      if (eventName in listeners) {
        listeners[eventName].push(listener)
      } else {
        listeners[eventName] = [listener]
      }
    },
    emit (eventName: string, ...args: unknown[]) {
      if (eventName in listeners) {
        listeners[eventName].forEach(listener => listener(...args))
      }
    },
    eventNames () {
      return Object.keys(listeners)
    }
  })
}
