// eslint-disable-next-line max-classes-per-file
import { ErrorCode, ErrorMessage } from './constants.error.js';

/**
 * BaseError class represents a custom Error class for the application.
 * @class BaseError
 * @augments {Error}
 */
class BaseError extends Error {
  /**
   * Constructs the BaseError instance.
   * @param {number} errorCode - The specific error code.
   * @param  {...any} params - The parameters for the error message.
   */
  constructor(errorCode, ...params) {
    const message = ErrorMessage[errorCode].replace('{0}', params[0]);
    super(message);
    this.errorCode = errorCode;
  }

  /**
   * Returns the specific error code of the error.
   * @returns {number} The specific error code.
   */
  getErrorCode() {
    return this.errorCode;
  }

  /**
   * Returns the name of the constructor (used for identification purposes).
   * @returns {string} The name of the constructor.
   */
  get [Symbol.toStringTag]() {
    return this.constructor.name;
  }
}

/**
 * UnknownError class represents an error that occurred due to an unknown issue.
 * @class UnknownError
 * @augments {BaseError}
 */
class UnknownError extends BaseError {
  /**
   * Constructs the UnknownError instance.
   * @param {string} path - The path that is unknown.
   */
  constructor(path) {
    super(ErrorCode.Unknown, path);
  }
}

/**
 * NotADirectory class represents an error that occurred due to a file
 * that was expected to be a directory but wasn't.
 * @class NotADirectory
 * @augments {BaseError}
 */
class NotADirectory extends BaseError {
  /**
   * Constructs the NotADirectory instance.
   * @param {string} path - The path that was expected to be a directory but wasn't.
   */
  constructor(path) {
    super(ErrorCode.NotADirectory, path);
  }
}

export { UnknownError, NotADirectory };
