import { Result as WithResult, ContextManager, BodyFunction, GeneratorFunction, ExitCallback, ExitFunction } from './types';
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
export default function With<T, R = unknown>(manager: ContextManager<T>, body: BodyFunction<T, R>): WithResult<R>;
/**
 * Use constructs a generator that may be used to fulfil the same role as With,
 * though without the suppression or error handling capabilities.
 */
export declare function Use<T>(manager: ContextManager<T>): Generator<T>;
/** context manager class to inherit from.
 * It returns itself in it's enter method like the default python implementation. */
export declare class ContextManagerBase implements ContextManager<ContextManagerBase> {
    enter(): this;
    exit(): void;
}
/** A base class for ExitStack & AsyncExitStack */
export declare class ExitStackBase {
    /** An array of all callbacks plus contexts exit methods */
    protected exit_callbacks: Array<[boolean, boolean, ExitFunction | ExitCallback]>;
    protected push_cm_exit(exit: ExitFunction, isSync: boolean): void;
    protected push_exit_callback(callback: ExitCallback, isSync: boolean): void;
    get exitCallbacks(): [boolean, boolean, ExitFunction | ExitCallback][];
    constructor();
    /** Preserve the context stack by transferring it to a new ExitStack */
    popAll(): this;
    /** Registers a callback with the standard `ContextManager.exit` method signature.
     *
     * Can suppress exceptions the same way exit methods can.
     * Also accepts any object with an `exit` method(registering a call to the method instead of the object)
    */
    push(exit: ExitFunction | {
        exit: ExitFunction;
    }): ExitFunction | {
        exit: ExitFunction;
    };
    /** Enters the supplied context manager
     *
     * If successful, also pushes the exit method as a callback and returns the results
     * of the enter method
     */
    enterContext<T>(cm: ContextManager<T>): T;
    /** Registers an arbitrary callback.
     *
     * Cannot suppress exceptions {@link https://github.com/Mcsavvy/contextlib/issues/2}
     */
    callback(callback: ExitCallback): ExitCallback;
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
export declare class ExitStack extends ExitStackBase implements ContextManager<ExitStack> {
    enter(): this;
    exit(error?: unknown): boolean;
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
export declare class GeneratorContextManager<T> implements ContextManager<T> {
    #private;
    /** A generator */
    gen: Generator<T>;
    /** @param gen A generator */
    constructor(gen: Generator<T>);
    enter(): T;
    exit(error?: any): boolean;
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
export declare function contextmanager<T, Y extends any[]>(func: GeneratorFunction<T, Y>): (...args: Y) => GeneratorContextManager<T>;
