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
exports.ExitStackBase = void 0;
const utils_js_1 = require("./utils.js");
/**
 * A base class for ExitStack
 * &
 * AsyncExitStack
 * */
class ExitStackBase {
    constructor() {
        this._exitfns = [];
    }
    push_exit_callback(fn, isSync) {
        this._exitfns.push([isSync, fn]);
    }
    /**
     * add a contextmanager's exit method
     * to the stack of exitcallbacks
     */
    push_cm_exit(fn, isSync) {
        this.push_exit_callback(fn, isSync);
    }
    /**
     * Preserve the context stack by
     * transferring it to a new ExitStack
     */
    popAll() {
        const stack = Object.create(this);
        stack._exitfns.push(...this._exitfns);
        this._exitfns = [];
        return stack;
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
    push(_obj) {
        try {
            const exitMethod = (0, utils_js_1.getattr)(_obj, 'exit');
            return this.push(exitMethod.bind(_obj));
        }
        catch (error) {
            this.push_cm_exit(_obj, true);
        }
        return _obj; // allow chaining
    }
    /** Enters the supplied context manager
     *
     * If successful, also pushes the exit method as a callback and returns the results
     * of the enter method
     */
    enterContext(cm) {
        (0, utils_js_1.getattr)(cm, 'enter');
        (0, utils_js_1.getattr)(cm, 'exit');
        const result = cm.enter();
        this.push_exit_callback((error) => cm.exit(error), true);
        return result;
    }
}
exports.ExitStackBase = ExitStackBase;
class ExitStack extends ExitStackBase {
    enter() {
        return this;
    }
    exit(error) {
        const hasError = error !== undefined;
        let suppressedError, pendingError;
        suppressedError = false;
        pendingError = false;
        // callbacks are invoked in LIFO order to match the behavior of
        // nested context managers
        while (this._exitfns.length > 0) {
            const [, fn] = this._exitfns.pop();
            try {
                if (fn(error)) {
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
exports.default = ExitStack;
