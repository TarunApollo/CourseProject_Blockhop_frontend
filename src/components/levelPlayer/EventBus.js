const listeners = new Map();

export const EventBus = {
  on(type, callback) {
    if (!listeners.has(type)) listeners.set(type, new Set());
    listeners.get(type).add(callback);
  },

  off(type, callback) {
    listeners.get(type)?.delete(callback);
  },

  emit(type, payload) {
    listeners.get(type)?.forEach((callback) => callback(payload));
  },

  removeAllListeners() {
    listeners.clear();
  },
};
