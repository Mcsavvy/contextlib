import {
    Result as WithResult,
    Success as WithSuccess,
    AsyncContextManager as ContextManager,
    AsyncBodyFunction as BodyFunction,
    ExitCallback,
    ExitFunction,
    AsyncExitFunction,
    AsyncExitCallback,
} from './types'

import { ExitStackBase } from './contextlib'
import { getattr } from 'utils'

/**
 * An async implementation of With.
 */
export async function With<T, R = unknown>(manager: ContextManager<T>, body: BodyFunction<T, R>): Promise<WithResult<R>> {
    const val = await manager.enter()
    let result: WithSuccess<R> | undefined
    try {
        result = {result: await body(val)}
    } catch (error) {
        if (await manager.exit(error) !== true) {
            throw error
        }
        return {
            error,
            suppressed: true
        }
    }
    await manager.exit()
    return result
}

/**
 * An async implementation of Use.
 * It differs in that, due to the limitations of JS generators, exit will not
 * be awaited.
 */
export async function* Use<T>(manager: ContextManager<T>): AsyncGenerator<T> {
    const val = await manager.enter()
    try {
        yield val
    } finally {
        // unfortunately there does not appear to be any way to get this to block on promises
        manager.exit()
    }
}

/**
 * An async implementation of ExitStack.
 */
export class ExitStack extends ExitStackBase implements ContextManager<ExitStack> {
    protected exit_callbacks: [boolean, boolean, ExitFunction|AsyncExitFunction
        | ExitCallback|AsyncExitCallback][]

    /**Registers an async callback with the standard `ContextManager.exit` method signature.
     * 
     * Can suppress exceptions the same way exit methods can.
     * Also accepts any object with an `exit` method(registering a call to the method instead of the object)
    */
     pushAsync(exit: AsyncExitFunction|{exit: AsyncExitFunction}){
        try{
            const exit_method: AsyncExitFunction = getattr(exit, 'exit');
            this.push_cm_exit(exit_method.bind(exit), false);
        } catch(error){
            this.push_cm_exit(exit as ExitFunction, false)
        }
        return exit // allow use as a decorator
    }

    /**Enters the supplied context manager
     * 
     * If successful, also pushes the exit method as a callback and returns the results
     * of the enter method
     */
     async enterAsyncContext<T>(cm: ContextManager<T>): Promise<T> {
        const _exit: AsyncExitFunction = getattr(cm, 'exit'),
              result = await cm.enter();
        this.push_cm_exit(_exit.bind(cm), false);
        return result;

    }

    /**Registers an arbitrary async callback.
     * 
     * Cannot suppress exceptions {@link https://github.com/Mcsavvy/contextlib/issues/2}
     */
    async callbackAsync(callback: AsyncExitCallback){
        this.push_exit_callback(callback, false);
        return callback //allow use as a decorator
    }


    async enter(): Promise<typeof this> {
        return this
    }

    async exit(error?: unknown): Promise<boolean> {
        const hasError = arguments.length !== 0
        let suppressed = false
        let pendingRaise = false
        // callbacks are invoked in LIFO order to match the behaviour of
        // nested context managers
        while (this.exit_callbacks.length !== 0) {
            const [isSync, isCallback, Fn] = this.exit_callbacks.pop()
            if (Fn === undefined) continue
            try {
                if (isCallback) isSync ? Fn() : await Fn();
                else {
                    const result = !pendingRaise && (suppressed || !hasError) 
                        ? isSync ? Fn() : await Fn()
                        : isSync ? Fn(error) : await Fn(error);
                    if (result === true){
                        suppressed = hasError
                        pendingRaise = false
                        error = undefined
                    } else suppressed = !hasError
                }
            } catch (e) {
                suppressed = false
                pendingRaise = true
                error = e
            }
        } if (pendingRaise) throw error;
        if (hasError) return suppressed
    }
}