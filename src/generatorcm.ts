/* eslint-disable import/no-unresolved */
/**
 * Create a contextmanager using a generator function.
 * The function must yield only once, and the value yielded
 * would be passed as argument to the context body.
 *
 * After the context body returns,
 * the generator function is entered once again;
 * this time, the generator function should clean up
 * just like an "exit" method would.
 *
 * Any error thrown in the context body would be through
 * inside the generator function, at the point where it yielded.
 * This error can be handled using a `try-finally` block.
 */

import {
    ContextManager,
    ContextError
} from './types.js'

type GeneratorFunction<Yield, Args extends unknown[]> = (...args: Args) => Generator<Yield>
type GeneratorFunctionWrapper<Yield, Args extends unknown[]> = (...args: Args) => GeneratorContextManager<Yield>

class GeneratorContextManager<T>
implements ContextManager<T> {
    // the generator function
    gen: Generator<T>
    // has generator fn yielded?
    _yielded: boolean

    constructor (gen: Generator<T>) {
        this.gen = gen
        this._yielded = false
    }

    enter (): T {
        // prevent a generator cm from being re-entered
        if (this._yielded) { throw 'cannot re-enter a generator contextmanager' }

        const { value, done } = this.gen.next()
        this._yielded = true
        if (done ?? false) { throw Error('Generator did not yield!') }
        return value
    }

    exit (error?: ContextError): boolean {
        const hasError = arguments.length > 0
        let done
        if (!hasError) {
            ({ done } = this.gen.next())
            if (done ?? false) { return false } else { throw 'Generator did not stop!' }
        } else {
            // reraise the error inside the generator
            try {
                ({ done } = this.gen.throw(error))
            } catch (err) {
                /**
                 * only re-throw an error if it's not the same error that
                 * was passed to throw(), because exit() must not raise
                 * an error unless exit() itself failed.
                 */
                if (err === error) { return false }
                throw err
            }
            // suppress the error if it was suppressed in the generator
            if (!(done ?? false)) { throw 'Generator did not stop!' }
            return true
        }
    }
}

/**
 * transform a generator function into a contextmanager
 * @param func a generator function
 * @returns a wrapper around func which returns a contextmanager when called
 */
function contextmanager<T, Args extends unknown[]> (
    func: GeneratorFunction<T, Args>
): GeneratorFunctionWrapper<T, Args> {
    function wrapper (...args: Args): GeneratorContextManager<T> {
        const gen = func(...args)
        return new GeneratorContextManager<T>(gen)
    }
    return wrapper
}

export default contextmanager

export { GeneratorContextManager }
