/**
 * An Exitstack is a contextmanager that manages a stack of contextmanagers
 * Context managers are entered in the order they are pushed,
 * and their exit methods are called in the reverse order (LIFO).
 *
 * When an error is thrown  in the body of one of it's contextmanagers,
 * the error propagates to the previous context managers to be suppressed.
 * If the error isn't suppressed, it is thrown when the contextmanager exits.
 */
import { ContextManager, AsyncContextManager, ExitFunction, AsyncExitFunction, ContextError } from './types';
declare type exit = [boolean, ExitFunction | AsyncExitFunction];
interface ObjectWithExitMethod {
    exit: ExitFunction | AsyncExitFunction;
}
/**
 * A base class for ExitStack
 * &
 * AsyncExitStack
 * */
declare class ExitStackBase {
    _exitFns: exit[];
    constructor();
    /**
     * Push an exit function to the stack
     * @param {ExitFunction | AsyncExitFunction} fn
     * @param {boolean} isSync
     */
    _pushExitCallback(fn: ExitFunction | AsyncExitFunction, isSync: boolean): void;
    /**
     * add a contextmanager's exit method
     * to the stack of exitcallbacks
     */
    _pushCmExit(fn: ExitFunction | AsyncExitFunction, isSync: boolean): void;
    /**
     * Preserve the context stack by
     * transferring it to a new ExitStack
     */
    popAll(): ExitStackBase;
    push(_obj: ExitFunction): ExitFunction;
    push(_obj: ObjectWithExitMethod): ObjectWithExitMethod;
    /**
     * Enters the supplied context manager then pushes the exit method as a callback.
     * @param {ContextManager} cm a contextmanager
     *
     * @returns the result of the enter() method
     */
    enterContext<T>(cm: ContextManager<T>): T;
}
declare class ExitStack extends ExitStackBase implements ContextManager<ExitStack> {
    /**
     * Enter the exitstack's context.
     * @returns the exitstack.
     */
    enter(): ExitStack;
    /**
     * Enters the supplied context manager.
     * If successful, also pushes the exit method as a callback and returns the results
     * of the enter method.
     *
     * @param cm - context manager
     * @returns result of the enter method
     */
    exit(error?: ContextError): boolean;
}
declare class AsyncExitStack extends ExitStackBase implements AsyncContextManager<AsyncExitStack> {
    /**
     * Enters the supplied context manager.
     * If successful, also pushes the exit method as a callback and returns the results
     * of the enter method.
     *
     * @param cm - context manager
     * @returns result of the enter method
     */
    enterAsyncContext<T>(cm: AsyncContextManager<T>): Promise<T>;
    /**
     * Enter the exitstack's context.
     * @returns the exitstack.
     */
    enter(): Promise<AsyncExitStack>;
    /**
     * Exit the exitstack's context.
     * All contexts and callback functions in the exitstack's stack would
     * be called in reverse order of how they were entered.
     * @param error
     * @returns anything (true suppresses error)
     */
    exit(error?: ContextError): Promise<unknown>;
}
export { ExitStack, AsyncExitStack };
