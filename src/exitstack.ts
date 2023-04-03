/* eslint-disable import/no-unresolved */
/**
 * An Exitstack is a contextmanager that manages a stack of contextmanagers
 * Context managers are entered in the order they are pushed,
 * and their exit methods are called in the reverse order (LIFO).
 *
 * When an error is thrown  in the body of one of it's contextmanagers,
 * the error propagates to the previous context managers to be suppressed.
 * If the error isn't suppressed, it is thrown when the contextmanager exits.
 */

import {
    ContextManager,
    AsyncContextManager,
    ExitFunction,
    AsyncExitFunction,
    ContextError
} from './types'

import {
    getattr
} from './utils'

type exit = [boolean, ExitFunction | AsyncExitFunction]
interface ObjectWithExitMethod {
    exit: ExitFunction | AsyncExitFunction
}

/**
 * A base class for ExitStack
 * &
 * AsyncExitStack
 * */
class ExitStackBase {
    /* stack of exit functions */
    _exitFns: exit[]

    constructor () {
        this._exitFns = []
    }

    _pushExitCallback (fn: ExitFunction | AsyncExitFunction, isSync: boolean): void {
        this._exitFns.push([isSync, fn])
    }

    /**
     * add a contextmanager's exit method
     * to the stack of exitcallbacks
     */
    _pushCmExit (fn: ExitFunction | AsyncExitFunction, isSync: boolean): void {
        this._pushExitCallback(fn, isSync)
    }

    /**
     * Preserve the context stack by
     * transferring it to a new ExitStack
     */
    popAll (): ExitStackBase {
        const stack: typeof this = Object.create(this)
        stack._exitFns.push(...this._exitFns)
        this._exitFns = []
        return stack
    }

    /**
     * Register an exit callback.
     * Accepts a function with the standard "exit" callback signature:
     * `function(error): any {...}`
     *
     * Also accepts any object with an "exit" method and registers a call to the
     * method instead of the object.
     *
     * > This callback can suppress errors by returning `true`
    */
    push (_obj: ExitFunction | ObjectWithExitMethod): ExitFunction {
        try {
            const exitMethod: ExitFunction = getattr(_obj, 'exit')
            return this.push(exitMethod.bind(_obj))
        } catch (error) {
            this._pushCmExit(_obj as ExitFunction, true)
        }
        return _obj as ExitFunction // allow chaining
    }

    /**
     * Enters the supplied context manager.
     * If successful, also pushes the exit method as a callback and returns the results
     * of the enter method.
     */
    enterContext<T>(cm: ContextManager<T>): T {
        getattr(cm, 'enter')
        getattr(cm, 'exit')
        const result = cm.enter()

        function exitWrapper (error?: ContextError): unknown {
            return cm.exit(error)
        }

        this._pushExitCallback(exitWrapper, true)
        return result
    }
}

class ExitStack extends ExitStackBase implements ContextManager<ExitStack> {
    enter (): ExitStack {
        return this
    }

    exit (error?: ContextError): boolean {
        const hasError = error !== undefined
        let
            suppressedError: boolean,
            pendingError: boolean
        suppressedError = false
        pendingError = false

        // callbacks are invoked in LIFO order to match the behavior of
        // nested context managers
        while (this._exitFns.length > 0) {
            const [, fn] = this._exitFns.pop() as exit
            try {
                if ((fn as ExitFunction)(error) == true) {
                    suppressedError = true
                    pendingError = false
                    error = undefined
                }
            } catch (err) {
                pendingError = true
                error = err
            }
        }
        if (pendingError) { throw error }
        return hasError && suppressedError
    }
}

class AsyncExitStack extends ExitStackBase implements AsyncContextManager<AsyncExitStack> {
    /**
     * Enters the supplied context manager.
     * If successful, also pushes the exit method as a callback and returns the results
     * of the enter method.
     *
     * @param cm - context manager
     * @returns result of the enter method
     */
    async enterAsyncContext<T> (cm: AsyncContextManager<T>): Promise<T> {
        getattr(cm, 'enter')
        getattr(cm, 'exit')
        const result = await cm.enter()

        this._pushExitCallback(
            async (error?: ContextError) => {
                return (await cm.exit(error)) as boolean
            }, false)
        return result
    }

    async enter (): Promise<AsyncExitStack> {
        return this
    }

    async exit (error?: ContextError): Promise<boolean> {
        const hasError = error !== undefined
        let suppressedError = false
        let pendingError = false
        let cbSuppress: boolean

        // callbacks are invoked in LIFO order to match the behavior of
        // nested context managers
        while (this._exitFns.length > 0) {
            const [isSync, fn] = this._exitFns.pop() as exit
            try {
                if (isSync) {
                    cbSuppress = (fn as ExitFunction)(error) == true
                } else {
                    cbSuppress = await (fn as AsyncExitFunction)(error) == true
                }
                if (cbSuppress) {
                    suppressedError = true
                    pendingError = false
                    error = undefined
                }
            } catch (err) {
                pendingError = true
                error = err
            }
        }
        if (pendingError) { throw error }
        return hasError && suppressedError
    }
}

export default ExitStack
export { ExitStack, AsyncExitStack }
