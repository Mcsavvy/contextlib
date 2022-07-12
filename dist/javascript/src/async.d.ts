import { Result as WithResult, AsyncContextManager as ContextManager, AsyncBodyFunction as BodyFunction, ExitCallback, ExitFunction, AsyncExitFunction, AsyncExitCallback, AsyncGeneratorFunction } from './types';
import { ExitStackBase } from './contextlib';
/** context manager class to inherit from.
 * It returns itself in it's enter method like the default python implementation. */
export declare class ContextManagerBase implements ContextManager<ContextManagerBase> {
    enter(): Promise<this>;
    exit(): Promise<void>;
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
export declare class GeneratorContextManager<T> implements ContextManager<T> {
    #private;
    /** A generator */
    gen: AsyncGenerator<T>;
    /** @param gen A generator */
    constructor(gen: AsyncGenerator<T>);
    enter(): Promise<T>;
    exit(error?: any): Promise<boolean>;
}
/**
 * asynccontextmanager decorator to wrap a generator function and turn
 * it into a context manager.
 *
 * Typical Usage:
 * ```
 * var GeneratorContextManager = contextmanager(async function* genfunc(<args>){
 *     // setup with <args>
 *     try {
 *         yield <value>
 *     }
 *     finally {
 *         // cleanup
 *     }
 * })
 * // GeneratorContextManager still needs to be invoked with <args> to get the context manager.
 * var cm = await GeneratorContextManager(<args>)
 * ```
 * @param func a generator function or any function that returns a generator
 * @returns a function that returns a GeneratorContextManager when called with the argument
 * for func */
export declare function contextmanager<T, Y extends any[]>(func: AsyncGeneratorFunction<T, Y>): Promise<(...args: Y) => Promise<GeneratorContextManager<T>>>;
/**
 * An async implementation of With.
 */
export declare function With<T, R = unknown>(manager: ContextManager<T>, body: BodyFunction<T, R>): Promise<WithResult<R>>;
/**
 * An async implementation of Use.
 * It differs in that, due to the limitations of JS generators, exit will not
 * be awaited.
 */
export declare function Use<T>(manager: ContextManager<T>): AsyncGenerator<T>;
/**
 * An async implementation of ExitStack.
 */
export declare class ExitStack extends ExitStackBase implements ContextManager<ExitStack> {
    protected exit_callbacks: Array<[
        boolean,
        boolean,
        ExitFunction | AsyncExitFunction | ExitCallback | AsyncExitCallback
    ]>;
    /** Registers an async callback with the standard `ContextManager.exit` method signature.
     *
     * Can suppress exceptions the same way exit methods can.
     * Also accepts any object with an `exit` method(registering a call to the method instead of the object)
    */
    pushAsync(exit: AsyncExitFunction | {
        exit: AsyncExitFunction;
    }): AsyncExitFunction | {
        exit: AsyncExitFunction;
    };
    /** Enters the supplied context manager
     *
     * If successful, also pushes the exit method as a callback and returns the results
     * of the enter method
     */
    enterAsyncContext<T>(cm: ContextManager<T>): Promise<T>;
    /** Registers an arbitrary async callback.
     *
     * Cannot suppress exceptions {@link https://github.com/Mcsavvy/contextlib/issues/2}
     */
    callbackAsync(callback: AsyncExitCallback): Promise<AsyncExitCallback>;
    enter(): Promise<this>;
    exit(error?: unknown): Promise<boolean>;
}
