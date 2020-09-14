/**
 * @module common
 */
const error = require("./error");

/**
 * Gets the ID of the object.
 *
 * Uses the `getId` method of the object if available. Otherwise uses the `toString` method.
 *
 * @param {Object} val - The object to add to the registry.
 * @return {string}
 * @throws {NullError} Throws NullError if the supplied parameter is falsy.
 */
function getValue(val) {
  if (!val) {
    throw new error.NullError();
  }
  if (typeof val.getId === "function" && typeof val.getId() === "string") {
    return val.getId();
  }
  return val.toString();
}

module.exports = {
  getValue: getValue,
};
