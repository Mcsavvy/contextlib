import { contextmanager } from './contextlib';
/**
 * This acts as a stand-in when a context manager is required.
 * It does not additional processing. */
export class nullcontext {
    enter() { }
    exit(error) { }
}
export function timelogger(time) {
    const date = new Date(time);
    const hours = date.getUTCHours().toString().padStart(2, '0');
    const minutes = date.getUTCMinutes().toString().padStart(2, '0');
    const seconds = date.getUTCSeconds().toString().padStart(2, '0');
    const milliseconds = date.getUTCMilliseconds().toString().padStart(3, '0');
    console.log(`Elapsed Time: ${hours}:${minutes}:${seconds}:${milliseconds}`);
}
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
export const timed = contextmanager(function* (logger = timelogger) {
    let start = Date.now();
    try {
        start = Date.now();
        yield;
    }
    finally {
        logger(Date.now() - start);
    }
});
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
export function closing(thing) {
    return {
        enter: () => thing,
        // eslint-disable-next-line @typescript-eslint/promise-function-async
        exit: () => Promise.resolve(thing.close())
    };
}
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
export function suppress(...errors) {
    function exit(error) {
        let capturer = errors.find(err => {
            if (typeof error.valueOf() === 'string') {
                if (typeof err.valueOf() === 'string')
                    return err == error;
                else if (err.constructor === RegExp)
                    return err.test(error);
            }
            else if (error instanceof Error) {
                if (typeof err.valueOf() === 'string')
                    return err == error.message;
                else if (err.constructor === RegExp)
                    return err.test(error.message);
                else if (typeof err === 'function')
                    return error instanceof err;
            }
            return false;
        });
        return !!capturer;
    }
    return { enter: nullcontext.prototype.enter, exit };
}
//# sourceMappingURL=helpers.js.map