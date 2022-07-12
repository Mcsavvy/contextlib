/** This is returned when a context manager exits with no error */
export interface Success<T> {
    /** the return value of `exit()` */
    result: T;
    /** this is always false as no error was thrown */
    suppressed?: false;
}
/** This is returned when a context manager
 * exits prematurely due to an error but the error is suppressed in the `exit` method */
export interface Failure {
    /** the error thrown */
    error: unknown;
    /** this is always true as there would
     * be no return value if the error was not suppressed */
    suppressed: true;
}
/** This function would be used as a context manager, it should yield only once */
export declare type GeneratorFunction<T, Args extends any[]> = (...args: Args) => Generator<T, any>;
/** This function would be used as a contextmanager, it should yield only once */
export declare type AsyncGeneratorFunction<T, Args extends any[]> = (...args: Args) => Promise<AsyncGenerator<T, any>>;
/**
 * This annotates the return type of the `With` function.
 * This can be {@link Success} or {@link Failure} */
export declare type Result<T> = Success<T> | Failure;
export declare type ExitFunction = (error?: unknown) => unknown;
export declare type AsyncExitFunction = (error?: unknown) => Promise<unknown>;
export declare type ExitCallback = () => unknown;
export declare type AsyncExitCallback = () => unknown;
export interface ContextManager<T = unknown> {
    /** this method is called when the context is being entered, the return value is
     * passes to the context body as argument */
    enter: () => T;
    /** this method is called when the context is being left;
     * if an error is thrown in the context body, the error
     * is passed as argument to this method. return `true` to suppress
     * the error */
    exit: ExitFunction;
}
export interface AsyncContextManager<T = unknown> {
    /** this method is called when the context is being entered, the return value is
     * passes to the context body as argument */
    enter: () => Promise<T>;
    /** this method is called when the context is being left;
     * if an error is thrown in the context body, the error
     * is passed as argument to this method. return `true` to suppress
     * the error */
    exit: AsyncExitFunction;
}
/** The body function represents the body of a context,
 * the return value of the context manager is passed to this function as argument */
export declare type BodyFunction<T, R> = (...args: [T]) => R;
/** The body function represents the body of a context,
 * the return value of the context manager is passed to this function as argument */
export declare type AsyncBodyFunction<T, R> = (...args: [T]) => Promise<R>;
