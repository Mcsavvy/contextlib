
type ContextError = Error | string | unknown
type ExitFunction = ((error?: ContextError) => void) | ((error?: ContextError) => boolean)

interface ContextManager<T=unknown> {
    /**
     * this method is called when the context is being entered, the return value is
     * passes to the context body as argument
     */
    enter: () => T

    /**
     * this method is called when the context is being left;
     * if an error is thrown in the context body, the error
     * is passed as argument to this method. return `true` to suppress
     * the error
     * */
    exit: ExitFunction
}

type WithResult<BodyReturn> =
{

    completed: true
    value: BodyReturn
} | {
    completed: false
    value: ContextError
}

export {
    ContextManager,
    ExitFunction,
    ContextError,
    WithResult
}
