"use strict";
/* eslint-disable import/no-unresolved */
/**
 * This module contains a bunch of useful context managers.
 *
 * - timed: a context manager that calculated time it takes to run a function.
 * - suppress: a context manager that is used to suppress errors in a brilliant way.
 * - closing: a context manager that closes a thing on exit.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.timedAsync = exports.timed = exports.suppressAsync = exports.suppress = exports.closingAsync = exports.closing = exports.nullcontext = void 0;
/**
 * This acts as a stand-in when a context manager is required.
 * It does no additional processing.
 */
class nullcontext {
    enter() {
        return this;
    }
    exit() {
        return false;
    }
}
exports.nullcontext = nullcontext;
/**
 * logs elapsed time in this format `HH:mm:ss:SSS`
 * @param time the time to log
 */
function timelogger(time) {
    const date = new Date(time);
    const hours = date.getUTCHours().toString().padStart(2, '0');
    const minutes = date.getUTCMinutes().toString().padStart(2, '0');
    const seconds = date.getUTCSeconds().toString().padStart(2, '0');
    const milliseconds = date.getUTCMilliseconds().toString().padStart(3, '0');
    console.log(`Elapsed Time: ${hours}:${minutes}:${seconds}:${milliseconds}`);
}
/**
 * This function returns a context manager that keeps track of the time it takes
 * to execute the body of the context.
 * @param logger a function that logs elapsed time.
 * logger would be called with the elasped time in milliseconds.
 * Defaults to {@link timelogger}
 */
function timed(logger = timelogger) {
    let start;
    return {
        enter() {
            start = Date.now();
        },
        exit() {
            logger(Date.now() - start);
        }
    };
}
exports.timed = timed;
/**
 * This function returns a context manager that keeps track of the time it takes
 * to execute the body of the context.
 * @param {(...args: [number]) => unknown} logger a function that logs elapsed time.
 * logger would be called with the elasped time in milliseconds.
 * Defaults to {@link timelogger}
 */
function timedAsync(logger = timelogger) {
    let start;
    return {
        async enter() {
            start = Date.now();
        },
        async exit() {
            logger(Date.now() - start);
        }
    };
}
exports.timedAsync = timedAsync;
/**
 * Context manager that automatically closes something at the end of the body.
 * Usable with async closers.
 * @param thing any object that has a `close` method.
 * @returns a contextmanager
 */
function closing(thing) {
    return {
        enter: () => thing,
        exit: () => {
            return thing.close();
        }
    };
}
exports.closing = closing;
/**
 * Context manager that automatically closes something at the end of the body.
 * Usable with async closers.
 * @param thing any object that has a `close` method.
 * @returns {AsyncContextManager} a contextmanager
 */
function closingAsync(thing) {
    return {
        async enter() {
            return thing;
        },
        async exit() {
            return thing.close();
        }
    };
}
exports.closingAsync = closingAsync;
/**
 * This context manager is used to suppress errors raised in contexts that are nested under it...
 *
 * It accepts an arbitrary number of arguments, with could be
 * + A string: If the error thrown is an instanceof `Error`, the error would be suppressed if
 *   `error.message === string`. If the error thrown is a string, then an equality check is done.
 * + A regexp: If the error thrown is an instanceof `Error`, the error would be suppressed if
 *   `regexp.test(error.message)`. If the error thrown is a string, then a regexp test is done.
 * + An ErrorConstructor: Then the error would be suppressed if `error instanceof <ErrorConstructor>`
 */
function suppress(...errors) {
    function exit(error) {
        function predicate(suppressed) {
            if (typeof error === 'string') {
                if (typeof suppressed.valueOf() === 'string') {
                    return suppressed == error;
                }
                else if (suppressed.constructor === RegExp) {
                    return suppressed.test(error);
                }
            }
            else if (error instanceof Error) {
                if (typeof suppressed.valueOf() === 'string') {
                    return suppressed == error.message;
                }
                else if (suppressed.constructor === RegExp) {
                    return suppressed.test(error.message);
                }
                else if (suppressed instanceof Error.constructor) {
                    return error instanceof suppressed;
                }
            }
            return false;
        }
        return errors.find(predicate) !== undefined;
    }
    return { enter: () => errors, exit };
}
exports.suppress = suppress;
/**
 * This context manager is used to suppress errors raised in contexts that are nested under it...
 *
 * It accepts an arbitrary number of arguments, with could be
 * + A string: If the error thrown is an instanceof `Error`, the error would be suppressed if
 *   `error.message === string`. If the error thrown is a string, then an equality check is done.
 * + A regexp: If the error thrown is an instanceof `Error`, the error would be suppressed if
 *   `regexp.test(error.message)`. If the error thrown is a string, then a regexp test is done.
 * + An ErrorConstructor: Then the error would be suppressed if `error instanceof <ErrorConstructor>`
 */
function suppressAsync(...errors) {
    async function exit(error) {
        function predicate(suppressed) {
            if (typeof error === 'string') {
                if (typeof suppressed.valueOf() === 'string') {
                    return suppressed == error;
                }
                else if (suppressed.constructor === RegExp) {
                    return suppressed.test(error);
                }
            }
            else if (error instanceof Error) {
                if (typeof suppressed.valueOf() === 'string') {
                    return suppressed == error.message;
                }
                else if (suppressed.constructor === RegExp) {
                    return suppressed.test(error.message);
                }
                else if (suppressed instanceof Error.constructor) {
                    return error instanceof suppressed;
                }
            }
            return false;
        }
        return errors.find(predicate) !== undefined;
    }
    return { async enter() { return this; }, exit };
}
exports.suppressAsync = suppressAsync;
//# sourceMappingURL=helpers.js.map