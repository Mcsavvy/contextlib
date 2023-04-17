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
declare type ContextBody<ArgT, ReturnT> = (...args: [ArgT]) => ReturnT;
declare type AsyncContextBody<ArgT, ReturnT> = (...args: [ArgT]) => PromiseLike<ReturnT> | ReturnT;
/**
 * With - handles entering and exiting a context
 *
 * @param manager the context manager for this context
 * @param body a function that'll be used as contextmanager's
 * body
 * @returns {WithResult} an object that shows the status of the context
 * at exit
 * */
declare function With<T, R = unknown>(manager: ContextManager<T> | Generator<T>, body: ContextBody<T, R>): WithResult<R>;
/**
 * Use constructs a generator that may be used to fulfil the same role as With,
 * though without the suppression or error handling capabilities.
 *
 * @param {ContextManager<T>} manager
 * @returns {Generator<T>} a generator function that yields the value
 * returned from the context manager's enter()
 */
declare function Use<T>(manager: ContextManager<T>): Generator<T>;
/**
 * An async implementation of Use.
 * It differs in that, due to the limitations of JS generators, exit will not
 * be awaited.
 *
 * Use constructs a generator that may be used to fulfil the same role as With,
 * though without the suppression or error handling capabilities.
 *
 * @param {ContextManager<T>} manager
 * @returns {Generator<T>} a generator function that yields the value
 * returned from the context manager's enter()
 */
declare function useAsync<T>(manager: AsyncContextManager<T>): AsyncGenerator<T>;
/**
 * An async implementation of With.
 * Handles entering and exiting a context
 *
 * @param manager the context manager for this context
 * @param body a function that'll be used as contextmanager's
 * body
 * @returns {WithResult} an object that shows the status of the context
 * at exit
 * */
declare function withAsync<T, R = unknown>(manager: AsyncContextManager<T> | AsyncGenerator<T>, body: AsyncContextBody<T, R> | ContextBody<T, R>): Promise<WithResult<R>>;
export { With, withAsync, Use, useAsync };
