/**
 * @module common
 */
const error = require('./error');

/**
 * Gets the ID of the object.
 *
 * If the parameter is a stirng, it is returned immediately.
 *
 * Uses the `getId` method of the object if available. Otherwise the `id` property of the object is returned if it is a string. If both conditions are not met, then the `toString` method is finally used.
 *
 * @param {Object|string} val - The item to add to the registry.
 * @return {string}
 * @throws {NullError} Throws NullError if the supplied parameter is falsy.
 */
function getValue(val) {
  if (!val) {
    throw new error.NullError();
  }
  if (typeof val === 'string') {
    return val;
  }
  if (typeof val.getId === 'function' && typeof val.getId() === 'string') {
    return val.getId();
  }
  if (typeof val.id === 'string' && val.id) {
    return val.id;
  }
  return val.toString();
}

module.exports = {
  ASTERISK: '*',
  getValue: getValue,
};
