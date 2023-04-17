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
    AsyncContextManager,
    ContextError
} from './types'

type GeneratorFunction<Yield, Args extends unknown[]> = (...args: Args) => Generator<Yield>
type GeneratorFunctionWrapper<Yield, Args extends unknown[]> = (...args: Args) => GeneratorContextManager<Yield>
type AsyncGeneratorFunction<Yield, Args extends unknown[]> = (...args: Args) => AsyncGenerator<Yield>
type AsyncGeneratorFunctionWrapper<Yield, Args extends unknown[]> = (...args: Args) => Promise<AsyncGeneratorContextManager<Yield>>

/**
 * GeneratorContextManager is a context manager that wraps a generator.
 * The generator should yield only once. The value yielded is passed to the
 * body function.
 *
 * After the body function returns, the generator is entered again.
 * This time, the generator should clean up.
 *
 * If an error is raised in the body function, the error is thrown at the
 * point the generator yielded.
 */
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

    /**
     * Enter a generator contextmanager
     * @returns the first value yielded from the generator function
     */
    enter (): T {
        // prevent a generator cm from being re-entered
        if (this._yielded) { throw 'cannot re-enter a generator contextmanager' }

        const { value, done } = this.gen.next()
        this._yielded = true
        if (done ?? false) { throw Error('Generator did not yield!') }
        return value
    }

    /**
     * Exit a generator context manager
     * @param error 
     * @returns anything
     */
    exit (error?: ContextError): unknown {
        const hasError = error !== undefined
        let done, value
        if (!hasError) {
            ({ done, value } = this.gen.next())
            if (done ?? false) { return value } else { throw 'Generator did not stop!' }
        } else {
            // reraise the error inside the generator
            try {
                ({ done, value } = this.gen.throw(error))
            } catch (err) {
                /**
                 * only re-throw an error if it's not the same error that
                 * was passed to throw(), because exit() must not raise
                 * an error unless exit() itself failed.
                 */
                if (err === error) { return false }
                throw err
            }
            if (!(done ?? false)) { throw 'Generator did not stop!' }
            // suppress the error if it was suppressed in the generator
            return value
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

/**
 * GeneratorContextManager is a context manager that wraps an async generator.
 * The generator should yield only once. The value yielded is passed to the
 * body function.
 *
 * After the body function returns, the generator is entered again.
 * This time, the generator should clean up.
 *
 * If an error is raised in the body function, the error is thrown at the
 * point the generator yielded.
 */
class AsyncGeneratorContextManager<T>
implements AsyncContextManager<T> {
    /** A generator */
    gen: AsyncGenerator<T>
    #yielded: boolean

    /** @param gen A generator */
    constructor (gen: AsyncGenerator<T>) {
        this.gen = gen
        this.#yielded = false
    }

    /**
     * Enter an async generator contextmanager
     * @returns the first value yielded from the generator function
     */
    async enter (): Promise<T> {
        if (this.#yielded) throw 'cannot re-enter a generator contextmanager'
        const { value, done } = await this.gen.next()
        if (done == true) {
            throw Error('Generator did not yield!')
        }
        this.#yielded = true
        return value
    }

    /**
     * Exit an async generator context manager
     * @param error 
     * @returns anything
     */
    async exit (error?: ContextError): Promise<boolean> {
        let result: IteratorResult<T, true | undefined>
        const hasError = error != undefined
        if (hasError) {
            // reraise the error inside the generator
            result = await this.gen.throw(error)
            // suppress the error if it was suppressed in the generator
            if (!(result.done ?? false)) throw "Generator didn't stop after throw"
            return result.value === true
        }
        // clean up
        result = await this.gen.next()
        // the generator should be done since it yields only once
        if (!(result.done ?? false)) { throw new Error('Generator did not stop!') }
        return true
    }
}

/**
 * transform an async generator function into an async contextmanager
 * @param func a generator function or any function that returns a generator
 * @returns a function that returns a GeneratorContextManager when called with the argument
 * for func */
function contextmanagerAsync<T, Args extends unknown[]> (
    func: AsyncGeneratorFunction<T, Args>
): AsyncGeneratorFunctionWrapper<T, Args> {
    async function wrapper (...args: Args): Promise<AsyncGeneratorContextManager<T>> {
        const gen = func(...args)
        return new AsyncGeneratorContextManager<T>(gen)
    }
    // Object.defineProperty(helper, 'name', { value: func.name || 'generatorcontext' })
    return wrapper
}


export {
    GeneratorContextManager,
    AsyncGeneratorContextManager,
    contextmanager,
    contextmanagerAsync
}