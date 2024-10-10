/**
 * Check if value is an array.
 */
export function isArraySafe(val) {
  return val && Array.isArray(val);
}

/**
 * Convert value to array if not already.
 * @param {*} val
 * @returns {Array<*>}
 */
export function toArray(val) {
  return isArraySafe(val) ? val : [val];
}

export function extract(arr, predicate) {
  const extractedValues = arr.filter(predicate);
  // Modify `arr` in place.
  arr.splice(0, arr.length, ...arr.filter((v, i, a) => !predicate(v, i, a)));
  return extractedValues;
}

export function filterOutDuplicates(predicate) {
  const isStrictlyEqual = (valueA, valueB) => valueA === valueB;
  const findIndexPredicate = predicate || isStrictlyEqual;
  return (value, index, array) => array.findIndex((v) => findIndexPredicate(v, value)) === index;
}
