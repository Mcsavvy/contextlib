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
import { ContextManager, ContextError } from './types.js';
declare type GeneratorFunction<Yield, Args extends unknown[]> = (...args: Args) => Generator<Yield>;
declare type GeneratorFunctionWrapper<Yield, Args extends unknown[]> = (...args: Args) => GeneratorContextManager<Yield>;
declare class GeneratorContextManager<T> implements ContextManager<T> {
    gen: Generator<T>;
    _yielded: boolean;
    constructor(gen: Generator<T>);
    enter(): T;
    exit(error?: ContextError): boolean;
}
/**
 * transform a generator function into a contextmanager
 * @param func a generator function
 * @returns a wrapper around func which returns a contextmanager when called
 */
declare function contextmanager<T, Args extends unknown[]>(func: GeneratorFunction<T, Args>): GeneratorFunctionWrapper<T, Args>;
export default contextmanager;
export { GeneratorContextManager };
