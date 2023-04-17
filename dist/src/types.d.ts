declare type ContextError = Error | string | unknown;
declare type ExitFunction = (error?: ContextError) => unknown;
declare type AsyncExitFunction = (error?: ContextError) => Promise<unknown>;
interface ContextManager<T = unknown> {
    /**
     * this method is called when the context is being entered, the return value is
     * passes to the context body as argument
     */
    enter: () => T;
    /**
     * this method is called when the context is being left;
     * if an error is thrown in the context body, the error
     * is passed as argument to this method. return `true` to suppress
     * the error
     * */
    exit: ExitFunction;
}
interface AsyncContextManager<T = unknown> {
    /**
     * this method is called when the context is being entered, the return value is
     * passes to the context body as argument
     */
    enter: () => Promise<T>;
    /**
     * this method is called when the context is being left;
     * if an error is thrown in the context body, the error
     * is passed as argument to this method. return `true` to suppress
     * the error
     */
    exit: AsyncExitFunction;
}
declare type WithResult<BodyReturn> = {
    completed: true;
    value: BodyReturn;
} | {
    completed: false;
    value: ContextError;
};
export { ContextManager, AsyncContextManager, ExitFunction, AsyncExitFunction, ContextError, WithResult };
