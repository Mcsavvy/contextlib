/**
 * This module contains a bunch of useful context managers.
 *
 * - timed: a context manager that calculated time it takes to run a function.
 * - suppress: a context manager that is used to suppress errors in a brilliant way.
 * - closing: a context manager that closes a thing on exit.
 */
import { ContextManager } from './types.js';
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
 * Context manager that automatically closes something at the end of the body.
 * Usable with async closers.
 * @param thing any object that has a `close` method.
 */
declare function closing<T>(thing: T & {
    close: () => unknown;
}): ContextManager<T>;
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
declare function suppress(...errors: ErrorType[]): ContextManager<void>;
export { nullcontext, closing, suppress, timed };
