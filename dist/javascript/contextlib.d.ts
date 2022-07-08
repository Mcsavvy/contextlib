import { Result as WithResult } from './with';
/**
 * @alias Error
 * @deprecated
 */
declare type ErrorType = Error;
/**this function is called whe the context is being left
 * if an error is throw in the context body, the error
 * is passed to this method. return a true value to suppress
 * the error
 * @deprecated
 */
declare type exit = (...error: [ErrorType?]) => any;
/**this function is called when the context is entered, the return value is
 * passes to the context body as argument
 * @deprecated
 */
declare type enter<T> = (...args: []) => T;
/**
 * Context managers are resource managers that allow you
 * to allocate and release resources precisely when you want to.
 *
 * A context manager can be any class or object, as long
 * as it correctly implemets the 'enter' and 'exit' method
 */
interface ContextManager<T = unknown> {
    /**this method is called when the context is being entered, the return value is
     * passes to the context body as argument
     */
    enter: () => T;
    /**this method is called whe the context is being left
     * if an error is throw in the context body, the error
     * is passed to this method. return a true value to suppress
     * the error
     */
    exit: (err?: unknown) => unknown;
}
/**
 * A generator
 * @deprecated
 */
declare type gen<T> = Generator<T, any>;
/**
 * This function yield a generator when called with <args>?
 * @deprecated
 */
declare type genFunc<T, Y extends any[]> = (...args: Y) => gen<T>;
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
 * @param body the body function for this context*/
declare function With<T, R = unknown>(manager: ContextManager<T>, body: (val: T) => R): WithResult<R>;
/**
 * Use constructs a generator that may be used to fulfil the same role as With,
 * though without the suppression or error handling capabilities.
 */
declare function Use<T>(manager: ContextManager<T>): Generator<T>;
/**context manager class to inherit from.
 * It returns itself in it's enter method like the default python implementation.*/
declare class ContextManagerBase implements ContextManager<ContextManagerBase> {
    enter(): this;
    exit(): void;
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
declare class ExitStack implements ContextManager<ExitStack> {
    /**An array of all callbacks plus contexts exit methds */
    _exitCallbacks: Function[];
    constructor();
    enter(): ExitStack;
    exit(error?: unknown): boolean;
    /**
     * Add a regular callback to the ExitStack.
     * @param cb a regular callback*/
    callback(cb: (err?: unknown) => unknown): void;
    /**
     * Add a context manager to the ExitStack. The context manager's
     * `exit()` method will be called with the arguments given to the
     * ExitStack's exit() method.
     * @param cm a context manager*/
    push(cm: ContextManager): void;
    /**
     * Enter another context manager and return the result of it's 'enter' method.
     * The context manager's `exit()` method will be called with the
     * arguments given to the ExitStack's exit() method.
     * @param cm a context manager*/
    enterContext<T>(cm: ContextManager<T>): T;
    /**
     * Remove all context managers from the ExitStack and return a new ExitStack containing
     * the removed context managers.
     * @returns A new exit stack containing all exit callbacks from this one*/
    popAll(): ExitStack;
}
/**
 * GeneratorCM is a context manager that wraps a generator.
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
declare class GeneratorCM<T> implements ContextManager<T> {
    /**A generator */
    gen: Generator<T>;
    /**@param gen A generator */
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
 * var generatorcm = contextmanager(function* genfunc(<args>){
 *     // setup with <args>
 *     try {
 *         yield <value>
 *     }
 *     finally {
 *         // cleanup
 *     }
 * })
 * // generatorcm still needs to be invoked with <args> to get the context manager.
 * var cm = generatorcm(<args>)
 * ```
 * @param func a generator function or any function that returns a generator
 * @returns a function that returns a GeneratorCM when called with the argument
 * for func*/
declare function contextmanager<T, Y extends any[]>(func: (...args: Y) => Generator<T>): (...args: Y) => GeneratorCM<T>;
/**
 * This acts as a stand-in when a context manager is required.
 * It does not additional processing.*/
declare class nullcontext implements ContextManager<void> {
    enter(): void;
    exit(error?: any): void;
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
declare const timed: (args_0: (arg_0: number) => any) => GeneratorCM<void>;
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
declare function closing<T>(thing: T & {
    close: () => unknown;
}): ContextManager<T>;
/**
 * Context manager used to suppress specific errors.
 *
 * After the error is suppressed, execution proceeds with the next statement
 * following the context handler.
 *
 * ```
 * With(suppress(TypeError), ()=>{
 *  throw new TypeError
 * })
 * // execution stills resumes here
 * ```
 * @param errors Error classes e.g: (`TypeError`, `SyntaxError`, `CustomError`)
 */
declare const suppress: (...args: ErrorConstructor[]) => GeneratorCM<undefined>;
export { With, Use, ContextManagerBase, ExitStack, GeneratorCM, contextmanager, nullcontext, timed, suppress, closing };
export default With;
export { enter, exit, genFunc, gen, ContextManager };
