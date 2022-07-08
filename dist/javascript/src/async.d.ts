import { Result as WithResult } from './with';
/**
 * An async variant (and superset) of ContextManager<T>.
 */
export interface ContextManager<T = unknown> {
    enter: () => PromiseLike<T> | T;
    exit: (err?: unknown) => unknown;
}
/**
 * An async implementation of With.
 */
export declare function With<T, R = unknown>(manager: ContextManager<T>, body: (val: T) => PromiseLike<R> | R): Promise<WithResult<R>>;
/**
 * An async implementation of Use.
 * It differs in that, due to the limitations of JS generators, exit will not
 * be awaited.
 */
export declare function Use<T>(manager: ContextManager<T>): AsyncGenerator<T>;
/**
 * An async implementation of ExitStack.
 */
export declare class ExitStack implements ContextManager<ExitStack> {
    _exitCallbacks: Array<(error?: unknown) => unknown>;
    constructor();
    enter(): ExitStack;
    exit(error?: unknown): Promise<boolean>;
    callback(cb: (error?: unknown) => unknown): void;
    push(cm: ContextManager): void;
    enterContext<T>(cm: ContextManager<T>): Promise<T>;
    popAll(): ExitStack;
}
