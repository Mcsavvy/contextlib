/**
 * This module contains a bunch of useful context managers.
 *
 * - timed: a context manager that calculated time it takes to run a function.
 * - suppress: a context manager that is used to suppress errors in a brilliant way.
 * - closing: a context manager that closes a thing on exit.
 */
import { ContextManager, AsyncContextManager } from './types';
/**
 * This acts as a stand-in when a context manager is required.
 * It does no additional processing.
 */
declare class nullcontext implements ContextManager<nullcontext> {
    enter(): this;
    exit(): false;
}
/**
 * This function returns a context manager that keeps track of the time it takes
 * to execute the body of the context.
 * @param logger a function that logs elapsed time.
 * logger would be called with the elasped time in milliseconds.
 * Defaults to {@link timelogger}
 */
declare function timed(logger?: (...args: [number]) => void): ContextManager<void>;
/**
 * This function returns a context manager that keeps track of the time it takes
 * to execute the body of the context.
 * @param {(...args: [number]) => unknown} logger a function that logs elapsed time.
 * logger would be called with the elasped time in milliseconds.
 * Defaults to {@link timelogger}
 */
declare function timedAsync(logger?: (...args: [number]) => void): AsyncContextManager<void>;
/**
 * Context manager that automatically closes something at the end of the body.
 * Usable with async closers.
 * @param thing any object that has a `close` method.
 * @returns a contextmanager
 */
declare function closing<T>(thing: T & {
    close: () => unknown;
}): ContextManager<T>;
/**
 * Context manager that automatically closes something at the end of the body.
 * Usable with async closers.
 * @param thing any object that has a `close` method.
 * @returns {AsyncContextManager} a contextmanager
 */
declare function closingAsync<T>(thing: T & {
    close: () => unknown;
}): AsyncContextManager<T>;
declare type ErrorType = (new () => Error) | string | RegExp;
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
declare function suppress(...errors: ErrorType[]): ContextManager<ErrorType[]>;
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
declare function suppressAsync(...errors: ErrorType[]): AsyncContextManager<AsyncContextManager>;
export { nullcontext, closing, closingAsync, suppress, suppressAsync, timed, timedAsync };
