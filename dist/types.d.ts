declare type ContextError = Error | any;
declare type ExitFunction = (error?: ContextError) => void | boolean;
interface ContextManager<T = any> {
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
interface WithResult<BodyReturn> {
    Return?: BodyReturn;
    Error?: ContextError;
}
export { ContextManager, ExitFunction, ContextError, WithResult };
