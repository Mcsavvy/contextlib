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
import { ContextManager, WithResult } from './types.js';
declare type ContextBody<ArgT, ReturnT> = (...args: [ArgT]) => ReturnT;
/**
 * buildGenerator - create a contextmanager form a generator
 */
/**
 * With - handles entering and exiting a context
 *
 * @param manager the context manager for this context
 * @param body a function that'll be used as contextmanager's
 * body
 * */
declare function With<T, R = unknown>(manager: ContextManager<T> | Generator<T>, body: ContextBody<T, R>): WithResult<R>;
export default With;
