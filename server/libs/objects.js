import deepmerge from 'deepmerge';

export class ObjectBuilder {
  constructor() {
    this._obj = {};
  }

  get() {
    return this._obj;
  }

  extend(obj) {
    if (isObjectSafe(obj)) {
      this._obj = { ...this._obj, ...obj };
    }
  }
}

/**
 * Check if value is an object.
 */
export const isObjectSafe = (val) => {
  return val && !Array.isArray(val) && typeof val === 'object';
};

export const isObjectEmpty = (obj) => {
  for (let i in obj) {
    return false;
  }
  return true;
};

export const mergeObjects = (x, y) => {
  return deepmerge(x, y, {
    arrayMerge: (target, source) => {
      source.forEach((item) => {
        if (target.indexOf(item) === -1) {
          target.push(item);
        }
      });
      return target;
    },
  });
};