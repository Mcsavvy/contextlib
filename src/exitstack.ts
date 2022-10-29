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
    ExitFunction,
    ContextError
} from './types.js'

import {
    getattr
} from './utils.js'

type exit = [boolean, ExitFunction]
interface ObjectWithExitMethod {
    exit: ExitFunction
}

/**
 * A base class for ExitStack
 * &
 * AsyncExitStack
 * */
class ExitStackBase {
    /* stack of exit functions */
    _exitfns: exit[]

    constructor () {
        this._exitfns = []
    }

    push_exit_callback (fn: ExitFunction, isSync: boolean): void {
        this._exitfns.push([isSync, fn])
    }

    /**
     * add a contextmanager's exit method
     * to the stack of exitcallbacks
     */
    push_cm_exit (fn: ExitFunction, isSync: boolean): void {
        this.push_exit_callback(fn, isSync)
    }

    /**
     * Preserve the context stack by
     * transferring it to a new ExitStack
     */
    popAll (): ExitStackBase {
        const stack: typeof this = Object.create(this)
        stack._exitfns.push(...this._exitfns)
        this._exitfns = []
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
            this.push_cm_exit(_obj as ExitFunction, true)
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

        this.push_exit_callback((error?: ContextError) => cm.exit(error), true)
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
        while (this._exitfns.length > 0) {
            const [, fn] = this._exitfns.pop() as exit
            try {
                if (fn(error) ?? false) {
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
export { ExitStackBase }
