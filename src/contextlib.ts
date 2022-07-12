import {
    Result as WithResult,
    ContextManager,
    BodyFunction,
    GeneratorFunction,
    ExitCallback,
    ExitFunction
} from './types'

import { getattr } from './utils'

/**
 * The With function manages context, it enters the given context on invocation
 * and exits the context on return.
 * It accepts two arguments, a context manager and a callback.
 * The callback is called with the context manager's return value as argument.
 * If an error is raised in the callback, the context manager's `exit()` method
 * is called with the error as argument.
 * If the context manager's `exit()` method returns true, the error is suppressed.
 * If the context manager's enter does not raise an error, and no error is raised
 * within the callback, exit will be called w/o args.
 * @param manager the context manager for this context
 * @param body the body function for this context */
export default function With<T, R = unknown> (manager: ContextManager<T>, body: BodyFunction<T, R>): WithResult<R> {
    const val = manager.enter()
    let result: WithResult<R>
    try {
        result = { result: body(val), suppressed: false }
        manager.exit()
        return result
    } catch (error) {
        if (manager.exit(error) !== true) {
            throw error
        }
        return { error: error, suppressed: true }
    }
}

/**
 * Use constructs a generator that may be used to fulfil the same role as With,
 * though without the suppression or error handling capabilities.
 */
export function * Use<T> (manager: ContextManager<T>): Generator<T> {
    const val = manager.enter()
    try {
        yield val
    } finally {
        manager.exit()
    }
}

/** context manager class to inherit from.
 * It returns itself in it's enter method like the default python implementation. */
export class ContextManagerBase implements ContextManager<ContextManagerBase> {
    enter () { return this }
    exit () { }
}

/** A base class for ExitStack & AsyncExitStack */
export class ExitStackBase {
    /** An array of all callbacks plus contexts exit methods */
    protected exit_callbacks: Array<[boolean, boolean, ExitFunction|ExitCallback]>

    protected push_cm_exit (exit: ExitFunction, isSync: boolean) {
        this.exit_callbacks.push([isSync, false, exit])
    }

    protected push_exit_callback (callback: ExitCallback, isSync: boolean) {
        this.exit_callbacks.push([isSync, true, callback])
    }

    public get exitCallbacks () {
        return this.exit_callbacks.map(fn => fn)
    }

    constructor () {
        this.exit_callbacks = []
    }

    /** Preserve the context stack by transferring it to a new ExitStack */
    popAll () {
        const stack: typeof this = Object.create(this)
        stack.exit_callbacks.push(...this.exit_callbacks)
        this.exit_callbacks = []
        return stack
    }

    /** Registers a callback with the standard `ContextManager.exit` method signature.
     *
     * Can suppress exceptions the same way exit methods can.
     * Also accepts any object with an `exit` method(registering a call to the method instead of the object)
    */
    push (exit: ExitFunction|{exit: ExitFunction}) {
        try {
            const exit_method: ExitFunction = getattr(exit, 'exit')
            this.push_cm_exit(exit_method.bind(exit), true)
        } catch (error) {
            this.push_cm_exit(exit as ExitFunction, true)
        }
        return exit // allow use as a decorator
    }

    /** Enters the supplied context manager
     *
     * If successful, also pushes the exit method as a callback and returns the results
     * of the enter method
     */
    enterContext<T>(cm: ContextManager<T>): T {
        const _exit: ExitFunction = getattr(cm, 'exit')
        const result = cm.enter()
        this.push_cm_exit(_exit.bind(cm), true)
        return result
    }

    /** Registers an arbitrary callback.
     *
     * Cannot suppress exceptions {@link https://github.com/Mcsavvy/contextlib/issues/2}
     */
    callback (callback: ExitCallback) {
        this.push_exit_callback(callback, true)
        return callback // allow use as a decorator
    }
}

/**
 * ExitStack is a context manager that manages a stack of context managers.
 * It can be used to manage multiple nested context managers.
 *
 * All context managers are entered in the order they are pushed.
 * Their exit methods are called in the reverse order (LIFO).
 *
 * When an error is raise in the body of an exit stack or one of its context managers,
 * the error propagates to the next context manager's `exit` method until it is handled.
 * If the error is not handled, it is raised when the ExitStack exits.
 *
 * Also, the ExitStack accepts callbacks that are called when the ExitStack exits.
 * These callbacks are invoked with any error raised in the ExitStack's `exit` method,
 * so they can be used to handle errors or clean up resources.
 *
 * ```js
 * With(new ExitStack(), exitstack => {
 *   exitstack.enterContext(<contextmanager>)
 *   exitstack.push(<exitmethod>)
 *   exitstack.callback(<callback>)
 *   // on exit, the exitstack will invoke these in reverse order
 * })
 * ```
 */
export class ExitStack extends ExitStackBase implements ContextManager<ExitStack> {
    enter () {
        return this
    }

    exit (error?: unknown): boolean {
        const hasError = arguments.length !== 0
        let suppressed = false
        let pendingRaise = false
        // callbacks are invoked in LIFO order to match the behavior of
        // nested context managers
        while (this.exit_callbacks.length !== 0) {
            const [isSync, isCallback, Fn] = this.exit_callbacks.pop()
            if (Fn === undefined) continue
            try {
                if (isCallback) Fn()
                else {
                    const result = !pendingRaise && (suppressed || !hasError) ? Fn() : Fn(error)
                    if (result === true) {
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
        } if (pendingRaise) throw error
        if (hasError) return suppressed
    }
}

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
 *
 * The preferred way of handling errors is to use a try-finally block.
 *
 * ```
 * function* genFn(<args>){
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
export class GeneratorContextManager<T> implements ContextManager<T> {
    /** A generator */
    gen: Generator<T>
    #yielded: boolean

    /** @param gen A generator */
    constructor (gen: Generator<T>) {
        this.gen = gen
        this.#yielded = false
    }

    enter (): T {
        if (this.#yielded) throw 'cannot re-enter a generator contextmanager'
        const { value, done } = this.gen.next()
        this.#yielded = true
        if (done) {
            throw Error('Generator did not yield!')
        }; return value
    }

    exit (error?: any) {
        let result: IteratorResult<T, true|void>
        const hasError = error != undefined
        if (hasError) {
            // reraise the error inside the generator
            result = this.gen.throw(error)
            // suppress the error if it was suppressed in the generator
            if (!result.done) throw "Generator didn't stop after throw"
            return result.value === true
        };
        // clean up
        result = this.gen.next()
        // the generator should be done since it yields only once
        if (!result.done) { throw new Error('Generator did not stop!') }
    }
}

/**
 * contextmanager decorator to wrap a generator function and turn
 * it into a context manager.
 *
 * Typical Usage:
 * ```
 * var GeneratorContextManager = contextmanager(function* genfunc(<args>){
 *     // setup with <args>
 *     try {
 *         yield <value>
 *     }
 *     finally {
 *         // cleanup
 *     }
 * })
 * // GeneratorContextManager still needs to be invoked with <args> to get the context manager.
 * var cm = GeneratorContextManager(<args>)
 * ```
 * @param func a generator function or any function that returns a generator
 * @returns a function that returns a GeneratorContextManager when called with the argument
 * for func */
export function contextmanager<T, Y extends any[]> (func: GeneratorFunction<T, Y>): (...args: Y) => GeneratorContextManager<T> {
    function helper (...args: Y) {
        const gen = func(...args)
        return new GeneratorContextManager<T>(gen)
    }
    Object.defineProperty(helper, 'name', { value: func.name || 'generatorcontext' })
    return helper
}
