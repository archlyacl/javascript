const DUPLICATE_ENTRIES = "Entry '_entry_' is already in the registry.";
const ENTRY_NOT_FOUND = "Entry '_entry_' is not in registry.";

/**
 * @module error
 */

/**
 * Error type: duplicate.
 */
class DuplicateError extends Error {
  constructor(value) {
    super();
    this.message = DUPLICATE_ENTRIES.replace(/_entry_/g, value);
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    /* istanbul ignore next */
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, NullError);
    }
  }
}

/**
 * Error type: not found.
 */
class NotFoundError extends Error {
  constructor(value) {
    super();
    this.message = ENTRY_NOT_FOUND.replace(/_entry_/g, value);
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    /* istanbul ignore next */
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, NullError);
    }
  }
}

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
  DuplicateError: DuplicateError,
  NotFoundError: NotFoundError,
  NullError: NullError,
};
