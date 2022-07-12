import {
    Result as WithResult,
    Success as WithSuccess,
    AsyncContextManager as ContextManager,
    AsyncBodyFunction as BodyFunction,
    ExitCallback,
    ExitFunction,
    AsyncExitFunction,
    AsyncExitCallback,
    AsyncGeneratorFunction
} from './types'

import { ExitStackBase } from './contextlib'
import { getattr } from 'utils'


/**context manager class to inherit from.
 * It returns itself in it's enter method like the default python implementation.*/
export class ContextManagerBase implements ContextManager<ContextManagerBase> {
    async enter() { return this; }
    async exit() {  }
}

/**
 * GeneratorCM is a context manager that wraps an async generator.
 * The generator should yield only once. The value yielded is passed to the
 * body function.
 *
 * After the body function returns, the generator is entered again.
 * This time, the generator should clean up.
 *
 * If an error is raised in the body function, the error is thrown at the
 * point the generator yielded.
 *
 * The preferred way of handling errors is to use a try-finally block.
 *
 * ```
 * async function* genFn(<args>){
 *   // setup
 *   try { 
 *      yield <value>
 *      // any error from the body function is thrown here
 *   }
 *   finally {
 *     // cleanup
 *   }
 * }
 * ```
 *
 * NOTE:
 * If the generator does not handle any error raised,
 * the error would be re-raised when the context is exited.
 */
export class GeneratorCM<T> implements ContextManager<T> {
    /**A generator */
    gen: AsyncGenerator<T>
    #yielded: boolean
    

    /**@param gen A generator */
    constructor(gen: AsyncGenerator<T>) {
        this.gen = gen;
        this.#yielded = false;
    }

    async enter(): Promise<T> {
        if (this.#yielded) throw "cannot re-enter a generator contextmanager"
        const {value, done} = await this.gen.next()
        this.#yielded = true;
        if (done) {
            throw Error("Generator did not yield!")
        }; return value;
    }
    async exit(error?: any) {
        var result: IteratorResult<T, true|void>;
        const hasError = error != undefined;
        if (hasError) {
            // reraise the error inside the generator
            result = await this.gen.throw(error)
            // suppress the error if it was suppressed in the generator
            if (! result.done) throw "Generator didn't stop after throw"
           return result.value === true
        };
        // clean up
        result = await this.gen.next();
        // the generator should be done since it yields only once
        if (result.done === false) { throw new Error("Generator did not stop!") }
    }
}

/**
 * asynccontextmanager decorator to wrap a generator function and turn
 * it into a context manager.
 *
 * Typical Usage:
 * ```
 * var generatorcm = asynccontextmanager(async function* genfunc(<args>){
 *     // setup with <args>
 *     try {
 *         yield <value>
 *     }
 *     finally {
 *         // cleanup
 *     }
 * })
 * // generatorcm still needs to be invoked with <args> to get the context manager.
 * var cm = await generatorcm(<args>)
 * ```
 * @param func a generator function or any function that returns a generator
 * @returns a function that returns a GeneratorCM when called with the argument
 * for func*/
export async function contextmanager<T, Y extends any[]>(
    func: AsyncGeneratorFunction<T, Y>
): Promise<(...args: Y) => Promise<GeneratorCM<T>>> {
    async function helper(...args: Y){
        const gen = await func(...args)
        return new GeneratorCM<T>(gen)
    }
    Object.defineProperty(helper, 'name', {value: func.name||'generatorcontext'})
    return helper
}

/**
 * An async implementation of With.
 */
export async function With<T, R = unknown>(manager: ContextManager<T>, body: BodyFunction<T, R>): Promise<WithResult<R>> {
    const val = await manager.enter()
    let result: WithSuccess<R> | undefined
    try {
        result = {result: await body(val)}
    } catch (error) {
        if (await manager.exit(error) !== true) {
            throw error
        }
        return {
            error,
            suppressed: true
        }
    }
    await manager.exit()
    return result
}

/**
 * An async implementation of Use.
 * It differs in that, due to the limitations of JS generators, exit will not
 * be awaited.
 */
export async function* Use<T>(manager: ContextManager<T>): AsyncGenerator<T> {
    const val = await manager.enter()
    try {
        yield val
    } finally {
        // unfortunately there does not appear to be any way to get this to block on promises
        manager.exit()
    }
}

/**
 * An async implementation of ExitStack.
 */
export class ExitStack extends ExitStackBase implements ContextManager<ExitStack> {
    protected exit_callbacks: [boolean, boolean, ExitFunction|AsyncExitFunction
        | ExitCallback|AsyncExitCallback][]

    /**Registers an async callback with the standard `ContextManager.exit` method signature.
     * 
     * Can suppress exceptions the same way exit methods can.
     * Also accepts any object with an `exit` method(registering a call to the method instead of the object)
    */
     pushAsync(exit: AsyncExitFunction|{exit: AsyncExitFunction}){
        try{
            const exit_method: AsyncExitFunction = getattr(exit, 'exit');
            this.push_cm_exit(exit_method.bind(exit), false);
        } catch(error){
            this.push_cm_exit(exit as ExitFunction, false)
        }
        return exit // allow use as a decorator
    }

    /**Enters the supplied context manager
     * 
     * If successful, also pushes the exit method as a callback and returns the results
     * of the enter method
     */
     async enterAsyncContext<T>(cm: ContextManager<T>): Promise<T> {
        const _exit: AsyncExitFunction = getattr(cm, 'exit'),
              result = await cm.enter();
        this.push_cm_exit(_exit.bind(cm), false);
        return result;

    }

    /**Registers an arbitrary async callback.
     * 
     * Cannot suppress exceptions {@link https://github.com/Mcsavvy/contextlib/issues/2}
     */
    async callbackAsync(callback: AsyncExitCallback){
        this.push_exit_callback(callback, false);
        return callback //allow use as a decorator
    }


    async enter(): Promise<typeof this> {
        return this
    }

    async exit(error?: unknown): Promise<boolean> {
        const hasError = arguments.length !== 0
        let suppressed = false
        let pendingRaise = false
        // callbacks are invoked in LIFO order to match the behaviour of
        // nested context managers
        while (this.exit_callbacks.length !== 0) {
            const [isSync, isCallback, Fn] = this.exit_callbacks.pop()
            if (Fn === undefined) continue
            try {
                if (isCallback) isSync ? Fn() : await Fn();
                else {
                    const result = !pendingRaise && (suppressed || !hasError) 
                        ? isSync ? Fn() : await Fn()
                        : isSync ? Fn(error) : await Fn(error);
                    if (result === true){
                        suppressed = hasError
                        pendingRaise = false
                        error = undefined
                    } else suppressed = !hasError
                }
            } catch (e) {
                suppressed = false
                pendingRaise = true
                error = e
            }
        } if (pendingRaise) throw error;
        if (hasError) return suppressed
    }
}