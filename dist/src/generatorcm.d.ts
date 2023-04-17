/**
 * Create a contextmanager using a generator function.
 * The function must yield only once, and the value yielded
 * would be passed as argument to the context body.
 *
 * After the context body returns,
 * the generator function is entered once again;
 * this time, the generator function should clean up
 * just like an "exit" method would.
 *
 * Any error thrown in the context body would be through
 * inside the generator function, at the point where it yielded.
 * This error can be handled using a `try-finally` block.
 */
import { ContextManager, AsyncContextManager, ContextError } from './types';
declare type GeneratorFunction<Yield, Args extends unknown[]> = (...args: Args) => Generator<Yield>;
declare type GeneratorFunctionWrapper<Yield, Args extends unknown[]> = (...args: Args) => GeneratorContextManager<Yield>;
declare type AsyncGeneratorFunction<Yield, Args extends unknown[]> = (...args: Args) => AsyncGenerator<Yield>;
declare type AsyncGeneratorFunctionWrapper<Yield, Args extends unknown[]> = (...args: Args) => Promise<AsyncGeneratorContextManager<Yield>>;
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
 */
declare class GeneratorContextManager<T> implements ContextManager<T> {
    gen: Generator<T>;
    _yielded: boolean;
    constructor(gen: Generator<T>);
    /**
     * Enter a generator contextmanager
     * @returns the first value yielded from the generator function
     */
    enter(): T;
    /**
     * Exit a generator context manager
     * @param error
     * @returns anything
     */
    exit(error?: ContextError): unknown;
}
/**
 * transform a generator function into a contextmanager
 * @param func a generator function
 * @returns a wrapper around func which returns a contextmanager when called
 */
declare function contextmanager<T, Args extends unknown[]>(func: GeneratorFunction<T, Args>): GeneratorFunctionWrapper<T, Args>;
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
 */
declare class AsyncGeneratorContextManager<T> implements AsyncContextManager<T> {
    #private;
    /** A generator */
    gen: AsyncGenerator<T>;
    /** @param gen A generator */
    constructor(gen: AsyncGenerator<T>);
    /**
     * Enter an async generator contextmanager
     * @returns the first value yielded from the generator function
     */
    enter(): Promise<T>;
    /**
     * Exit an async generator context manager
     * @param error
     * @returns anything
     */
    exit(error?: ContextError): Promise<boolean>;
}
/**
 * transform an async generator function into an async contextmanager
 * @param func a generator function or any function that returns a generator
 * @returns a function that returns a GeneratorContextManager when called with the argument
 * for func */
declare function contextmanagerAsync<T, Args extends unknown[]>(func: AsyncGeneratorFunction<T, Args>): AsyncGeneratorFunctionWrapper<T, Args>;
export { GeneratorContextManager, AsyncGeneratorContextManager, contextmanager, contextmanagerAsync };
