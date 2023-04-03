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
type exit = [boolean, ExitFunction | AsyncExitFunction];
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
    /**
     * Register an exit callback.
     * Accepts a function with the standard "exit" callback signature:
     * `function(error): any {...}`
     *
     * Also accepts any object with an "exit" method and registers a call to the
     * method instead of the object.
     *
     * > This callback can suppress errors by returning `true`
    */
    push(_obj: ExitFunction | ObjectWithExitMethod): ExitFunction;
    /**
     * Enters the supplied context manager.
     * If successful, also pushes the exit method as a callback and returns the results
     * of the enter method.
     */
    enterContext<T>(cm: ContextManager<T>): T;
}
declare class ExitStack extends ExitStackBase implements ContextManager<ExitStack> {
    enter(): ExitStack;
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
    enter(): Promise<AsyncExitStack>;
    exit(error?: ContextError): Promise<boolean>;
}
export default ExitStack;
export { ExitStack, AsyncExitStack };
