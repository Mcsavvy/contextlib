import { ContextManager } from './types';
/**
 * This acts as a stand-in when a context manager is required.
 * It does not additional processing. */
export declare class nullcontext implements ContextManager<void> {
    enter(): void;
    exit(error?: any): void;
}
export declare function timelogger(time: number): void;
/**
 * This is a context manager that keeps track of the time it takes to execute
 * the body of the context.
 *
 * #### Typical Usage
 * ```
 * With(timed(), () => {
 *   // context body
 * })
 * // logs the time it took to execute the body
 * ```
 * @param logger any function that accepts a number.
 * This function would be called with the elasped time
 * (in milliseconds). defaults to a timelogger that logs
 * the time in this format `HH:MM:SS:mmm`
 */
export declare const timed: (args_0: (arg_0: number) => any) => import("./contextlib").GeneratorContextManager<undefined>;
/**
 * Context manager that automatically closes something at the end of the body.
 *
 * Usable with async closers.
 *
 * ```
 * With(closing(<closeable>), closeable => {
 *  // do something with <closeable>
 * })
 * ```
 *
 * @param thing any object that has a `close` method.
 */
export declare function closing<T>(thing: T & {
    close: () => unknown;
}): ContextManager<T>;
declare type ErrorType = ErrorConstructor | string | RegExp;
/**
 * This context manager is used to suppress errors raised in contexts that are nested under it...
 *
 * It accepts an arbitrary number of arguments, with could be
 * + A string: If the error thrown is an instanceof `Error`, the error would be suppressed if
 *   `error.message === string`. If the error thrown is a string, then an equality check is done.
 *  + A regexp: If the error thrown is an instanceof `Error`, the error would be suppressed if
 *   `regexp.test(error.message)`. If the error thrown is a string, then a regexp test is done.
 *  + An ErrorConstructor: Then the error would be suppressed if `error instanceof <ErrorConstructor>`
 */
export declare function suppress(...errors: ErrorType[]): ContextManager<void>;
export {};
