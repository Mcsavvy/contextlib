/**
 * An Exitstack is a contextmanager that manages a stack of contextmanagers
 * Context managers are entered in the order they are pushed,
 * and their exit methods are called in the reverse order (LIFO).
 *
 * When an error is thrown  in the body of one of it's contextmanagers,
 * the error propagates to the previous context managers to be suppressed.
 * If the error isn't suppressed, it is thrown when the contextmanager exits.
 */
import { ContextManager, ExitFunction, ContextError } from "./types.js";
declare type exit = [boolean, ExitFunction];
declare type ObjectWithExitMethod = {
    [index: string]: any;
    exit: ExitFunction;
};
/**
 * A base class for ExitStack
 * &
 * AsyncExitStack
 * */
declare class ExitStackBase {
    _exitfns: Array<exit>;
    constructor();
    push_exit_callback(fn: ExitFunction, isSync: boolean): void;
    /**
     * add a contextmanager's exit method
     * to the stack of exitcallbacks
     */
    push_cm_exit(fn: ExitFunction, isSync: boolean): void;
    /**
     * Preserve the context stack by
     * transferring it to a new ExitStack
     */
    popAll(): this;
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
    push(__obj: ExitFunction | ObjectWithExitMethod): ExitFunction;
    /** Enters the supplied context manager
     *
     * If successful, also pushes the exit method as a callback and returns the results
     * of the enter method
     */
    enterContext<T>(cm: ContextManager<T>): T;
}
declare class ExitStack extends ExitStackBase implements ContextManager<ExitStack> {
    enter(): this;
    exit(error?: ContextError): boolean;
}
export default ExitStack;
export { ExitStackBase };
