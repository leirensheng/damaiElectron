import mitt from 'mitt';

export function createEmitter() {
  const emitter = mitt();

  emitter.once = (type, handler) => {
    const fn = (...args) => {
      emitter.off(type, fn);
      handler(...args);
    };
    emitter.on(type, fn);
  };

  for (const key in emitter) {
    if (Object.hasOwnProperty.call(emitter, key)) {
      emitter['$' + key] = emitter[key];
    }
  }

  return emitter;
}

const emitter = createEmitter();
export default emitter;
