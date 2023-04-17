"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AsyncExitStack = exports.ExitStack = void 0;
/**
 * A base class for ExitStack
 * &
 * AsyncExitStack
 * */
class ExitStackBase {
    constructor() {
        this._exitFns = [];
    }
    /**
     * Push an exit function to the stack
     * @param {ExitFunction | AsyncExitFunction} fn
     * @param {boolean} isSync
     */
    _pushExitCallback(fn, isSync) {
        this._exitFns.push([isSync, fn]);
    }
    /**
     * add a contextmanager's exit method
     * to the stack of exitcallbacks
     */
    _pushCmExit(fn, isSync) {
        this._pushExitCallback(fn, isSync);
    }
    /**
     * Preserve the context stack by
     * transferring it to a new ExitStack
     */
    popAll() {
        const stack = Object.create(this);
        stack._exitFns.push(...this._exitFns);
        this._exitFns = [];
        return stack;
    }
    /**
     * Register an exit callback.
     * @param {ExitFunction | ObjectWithExitMethod} _obj a function with the standard "exit" callback signature:
     * `function(error): any {...}`
     *
     * Or any object with an "exit" method and registers a call to the
     * method instead of the object.
     *
     * @returns {ExitFunction | ObjectWithExitMethod} what ever was passed as _obj
    */
    push(_obj) {
        if (_obj.hasOwnProperty("exit")) {
            this._pushCmExit(_obj.exit.bind(_obj), true);
        }
        else {
            this._pushCmExit(_obj, true);
        }
        return _obj;
    }
    /**
     * Enters the supplied context manager then pushes the exit method as a callback.
     * @param {ContextManager} cm a contextmanager
     *
     * @returns the result of the enter() method
     */
    enterContext(cm) {
        if (cm['enter'] == undefined)
            throw Error(`contextmanager has no enter() method`);
        if (cm['exit'] == undefined)
            throw Error(`contextmanager has no exit() method`);
        const result = cm.enter();
        function exitWrapper(error) {
            return cm.exit(error);
        }
        this._pushExitCallback(exitWrapper, true);
        return result;
    }
}
class ExitStack extends ExitStackBase {
    /**
     * Enter the exitstack's context.
     * @returns the exitstack.
     */
    enter() {
        return this;
    }
    /**
     * Enters the supplied context manager.
     * If successful, also pushes the exit method as a callback and returns the results
     * of the enter method.
     *
     * @param cm - context manager
     * @returns result of the enter method
     */
    exit(error) {
        const hasError = error !== undefined;
        let suppressedError, pendingError;
        suppressedError = false;
        pendingError = false;
        // callbacks are invoked in LIFO order to match the behavior of
        // nested context managers
        while (this._exitFns.length > 0) {
            const [, fn] = this._exitFns.pop();
            try {
                if (fn(error) == true) {
                    suppressedError = true;
                    pendingError = false;
                    error = undefined;
                }
            }
            catch (err) {
                pendingError = true;
                error = err;
            }
        }
        if (pendingError) {
            throw error;
        }
        return hasError && suppressedError;
    }
}
exports.ExitStack = ExitStack;
class AsyncExitStack extends ExitStackBase {
    /**
     * Enters the supplied context manager.
     * If successful, also pushes the exit method as a callback and returns the results
     * of the enter method.
     *
     * @param cm - context manager
     * @returns result of the enter method
     */
    async enterAsyncContext(cm) {
        if (cm['enter'] == undefined)
            throw Error(`contextmanager has no enter() method`);
        if (cm['exit'] == undefined)
            throw Error(`contextmanager has no exit() method`);
        const result = await cm.enter();
        this._pushExitCallback(async (error) => {
            return (await cm.exit(error));
        }, false);
        return result;
    }
    /**
     * Enter the exitstack's context.
     * @returns the exitstack.
     */
    async enter() {
        return this;
    }
    /**
     * Exit the exitstack's context.
     * All contexts and callback functions in the exitstack's stack would
     * be called in reverse order of how they were entered.
     * @param error
     * @returns anything (true suppresses error)
     */
    async exit(error) {
        const hasError = error !== undefined;
        let suppressedError = false;
        let pendingError = false;
        let cbSuppress;
        // callbacks are invoked in LIFO order to match the behavior of
        // nested context managers
        while (this._exitFns.length > 0) {
            const [isSync, fn] = this._exitFns.pop();
            try {
                if (isSync) {
                    cbSuppress = fn(error) == true;
                }
                else {
                    cbSuppress = await fn(error) == true;
                }
                if (cbSuppress) {
                    suppressedError = true;
                    pendingError = false;
                    error = undefined;
                }
            }
            catch (err) {
                pendingError = true;
                error = err;
            }
        }
        if (pendingError) {
            throw error;
        }
        return hasError && suppressedError;
    }
}
exports.AsyncExitStack = AsyncExitStack;
//# sourceMappingURL=exitstack.js.map