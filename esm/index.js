/*! (c) Andrea Giammarchi - ISC */

const _ = new WeakMap;

export class Broadcast {
  constructor() {
    _.set(this, {v: new Map, f: new Map});
  }
  all(type, callback) {
    const {v, f} = _.get(this);
    if (!f.has(type))
      f.set(type, new Set);
    f.get(type).add(callback);
    if (v.has(type))
      Promise.resolve(v.get(type)).then(callback);
  }
  drop(type) {
    const {v, f} = _.get(this);
    if (1 < arguments.length) {
      if (f.has(type))
        f.get(type).delete(arguments[1]);
    }
    else {
      v.delete(type);
      f.delete(type);
    }
  }
  that(type) {
    if (1 < arguments.length) {
      const value = arguments[1];
      const {v, f} = _.get(this);
      v.set(type, value);
      if (f.has(type)) {
        for (const callback of f.get(type))
          callback(value);
      }
      return;
    }
    return value => this.that(type, value);
  }
  when(type) {
    const {v} = _.get(this);
    return v.has(type) ?
      Promise.resolve(v.get(type)) :
      new Promise(resolve => {
        const resolved = value => {
          this.drop(type, resolved);
          resolve(value);
        };
        this.all(type, resolved);
      });
  }
}

export const broadcast = new Broadcast;
