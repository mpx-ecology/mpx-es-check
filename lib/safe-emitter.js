/**
 * mpx-es-check 事件监听处理
 * @author Black
 */
module.exports = () => {
  const listeners = Object.create(null)

  return Object.freeze({
    on(eventName, listener) {
      if (eventName in listeners) {
        listeners[eventName].push(listener)
      } else {
        listeners[eventName] = [listener]
      }
    },
    emit(eventName, ...args) {
      if (eventName in listeners) {
        listeners[eventName].forEach(listener => listener(...args))
      }
    },
    eventNames() {
      return Object.keys(listeners)
    }
  })
}
