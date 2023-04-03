/**
 * The with function manages context by entering a given contextmanager
 * on invocation and exiting it on return.
 *
 * It accepts two arguments
 * - a contextmanager
 * - a context body
 *
 * The context body is a callback function that would be invoked in
 * the context of the contextmanager.
 *
 * The contextbody is invoked with whatever value was returned from calling
 * the contextmanager's "enter" method.
 *
 * Any error raise in the context body is passed to the contextmanager's
 * "exit" method for handling. Such error would be suppressed if the "exit"
 * method returns true.
 */
import { ContextManager, AsyncContextManager, WithResult } from './types';
type ContextBody<ArgT, ReturnT> = (...args: [ArgT]) => ReturnT;
type AsyncContextBody<ArgT, ReturnT> = (...args: [ArgT]) => PromiseLike<ReturnT> | ReturnT;
/**
 * With - handles entering and exiting a context
 *
 * @param manager the context manager for this context
 * @param body a function that'll be used as contextmanager's
 * body
 * */
declare function With<T, R = unknown>(manager: ContextManager<T> | Generator<T>, body: ContextBody<T, R>): WithResult<R>;
/**
 * Use constructs a generator that may be used to fulfil the same role as With,
 * though without the suppression or error handling capabilities.
 */
declare function Use<T>(manager: ContextManager<T>): Generator<T>;
/**
 * An async implementation of Use.
 * It differs in that, due to the limitations of JS generators, exit will not
 * be awaited.
 */
declare function useAsync<T>(manager: AsyncContextManager<T>): AsyncGenerator<T>;
/**
 * An async implementation of With.
 */
declare function AWith<T, R = unknown>(manager: AsyncContextManager<T> | AsyncGenerator<T>, body: AsyncContextBody<T, R> | ContextBody<T, R>): Promise<WithResult<R>>;
export { Use, With, AWith as withAsync, useAsync };
export default With;
