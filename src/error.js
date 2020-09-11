/**
 * @module error
 */

/**
 * Error type: generic null error.
 */
class NullError extends Error {
  constructor() {
    super();
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    /* istanbul ignore next */
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, NullError);
    }
  }
}

module.exports = {
  NullError: NullError,
};
