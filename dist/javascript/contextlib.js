"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.closing = exports.suppress = exports.timed = exports.nullcontext = exports.contextmanager = exports.GeneratorCM = exports.ExitStack = exports.ContextManagerBase = exports.Use = exports.With = void 0;
/**
 * The With function manages context, it enters the given context on invocation
 * and exits the context on return.
 * It accepts two arguments, a context manager and a callback.
 * The callback is called with the context manager's return value as argument.
 * If an error is raised in the callback, the context manager's `exit()` method
 * is called with the error as argument.
 * If the context manager's `exit()` method returns true, the error is suppressed.
 * If the context manager's enter does not raise an error, and no error is raised
 * within the callback, exit will be called w/o args.
 * @param manager the context manager for this context
 * @param body the body function for this context*/
function With(manager, body) {
    const val = manager.enter();
    let result;
    try {
        result = { result: body(val) };
    }
    catch (error) {
        if (!manager.exit(error)) {
            throw error;
        }
        return {
            error,
            suppressed: true
        };
    }
    manager.exit();
    return result;
}
exports.With = With;
/**
 * Use constructs a generator that may be used to fulfil the same role as With,
 * though without the suppression or error handling capabilities.
 */
function* Use(manager) {
    const val = manager.enter();
    try {
        yield val;
    }
    finally {
        manager.exit();
    }
}
exports.Use = Use;
/**context manager class to inherit from.
 * It returns itself in it's enter method like the default python implementation.*/
class ContextManagerBase {
    enter() { return this; }
    exit() { }
}
exports.ContextManagerBase = ContextManagerBase;
/**
 * ExitStack is a context manager that manages a stack of context managers.
 * It can be used to manage multiple nested context managers.
 *
 * All context managers are entered in the order they are pushed.
 * Their exit methods are called in the reverse order (LIFO).
 *
 * When an error is raise in the body of an exit stack or one of its context managers,
 * the error propagates to the next context manager's `exit` method until it is handled.
 * If the error is not handled, it is raised when the ExitStack exits.
 *
 * Also, the ExitStack accepts callbacks that are called when the ExitStack exits.
 * These callbacks are invoked with any error raised in the ExitStack's `exit` method,
 * so they can be used to handle errors or clean up resources.
 *
 * ```js
 * With(new ExitStack(), exitstack => {
 *   exitstack.enterContext(<contextmanager>)
 *   exitstack.push(<exitmethod>)
 *   exitstack.callback(<callback>)
 *   // on exit, the exitstack will invoke these in reverse order
 * })
 * ```
 */
class ExitStack {
    constructor() {
        this._exitCallbacks = [];
    }
    enter() {
        return this;
    }
    exit(error) {
        const hasError = arguments.length !== 0;
        let suppressed = false;
        let pendingRaise = false;
        // callbacks are invoked in LIFO order to match the behaviour of
        // nested context managers
        while (true) {
            const cb = this._exitCallbacks.pop();
            if (cb === undefined) {
                break;
            }
            try {
                if (!pendingRaise && (suppressed || !hasError) ? cb() : cb(error)) {
                    suppressed = true;
                    pendingRaise = false;
                    error = undefined;
                }
            }
            catch (e) {
                suppressed = false;
                pendingRaise = true;
                error = error || e;
            }
        }
        if (pendingRaise) {
            throw error;
        }
        return hasError && suppressed;
    }
    /**
     * Add a regular callback to the ExitStack.
     * @param cb a regular callback*/
    callback(cb) {
        this._exitCallbacks.push(cb);
    }
    /**
     * Add a context manager to the ExitStack. The context manager's
     * `exit()` method will be called with the arguments given to the
     * ExitStack's exit() method.
     * @param cm a context manager*/
    push(cm) {
        this.callback(cm.exit.bind(cm));
    }
    /**
     * Enter another context manager and return the result of it's 'enter' method.
     * The context manager's `exit()` method will be called with the
     * arguments given to the ExitStack's exit() method.
     * @param cm a context manager*/
    enterContext(cm) {
        const result = cm.enter();
        this.push(cm);
        return result;
    }
    /**
     * Remove all context managers from the ExitStack and return a new ExitStack containing
     * the removed context managers.
     * @returns A new exit stack containing all exit callbacks from this one*/
    popAll() {
        // preserve the context stack by tranferring the callbacks to a new stack
        const stack = new ExitStack();
        stack._exitCallbacks = this._exitCallbacks;
        this._exitCallbacks = [];
        return stack;
    }
}
exports.ExitStack = ExitStack;
/**
 * GeneratorCM is a context manager that wraps a generator.
 * The generator should yield only once. The value yielded is passed to the
 * body function.
 *
 * After the body function returns, the generator is entered again.
 * This time, the generator should clean up.
 *
 * If an error is raised in the body function, the error is thrown at the
 * point the generator yielded.
 *
 * The preferred way of handling errors is to use a try-finally block.
 *
 * ```
 * function* genFn(<args>){
 *   // setup
 *   try {
 *      yield <value>
 *      // any error from the body function is thrown here
 *   }
 *   finally {
 *     // cleanup
 *   }
 * }
 * ```
 *
 * NOTE:
 * If the generator does not handle any error raised,
 * the error would be re-raised when the context is exited.
 */
class GeneratorCM {
    /**@param gen A generator */
    constructor(gen) {
        this.gen = gen;
    }
    enter() {
        const { value, done } = this.gen.next();
        if (done) {
            throw Error("Generator did not yield!");
        }
        ;
        return value;
    }
    exit(error) {
        if (error) {
            this.gen.throw(error);
            // reraise the error inside the generator
        }
        ;
        // clean up
        const r = this.gen.next();
        // the generator should be done since it yields only once
        if (!r.done) {
            throw new Error("Generator did not stop!");
        }
        // alway return true to suppress the error
        return true;
    }
}
exports.GeneratorCM = GeneratorCM;
/**
 * contextmanager decorator to wrap a generator function and turn
 * it into a context manager.
 *
 * Typical Usage:
 * ```
 * var generatorcm = contextmanager(function* genfunc(<args>){
 *     // setup with <args>
 *     try {
 *         yield <value>
 *     }
 *     finally {
 *         // cleanup
 *     }
 * })
 * // generatorcm still needs to be invoked with <args> to get the context manager.
 * var cm = generatorcm(<args>)
 * ```
 * @param func a generator function or any function that returns a generator
 * @returns a function that returns a GeneratorCM when called with the argument
 * for func*/
function contextmanager(func) {
    function helper(...args) {
        const gen = func(...args);
        return new GeneratorCM(gen);
    }
    Object.defineProperty(helper, 'name', { value: func.name || 'generatorcontext' });
    return helper;
}
exports.contextmanager = contextmanager;
/**
 * This acts as a stand-in when a context manager is required.
 * It does not additional processing.*/
class nullcontext {
    enter() { }
    exit(error) { }
}
exports.nullcontext = nullcontext;
function _timelogger(time) {
    const date = new Date(time), hours = date.getUTCHours().toString().padStart(2, '0'), minutes = date.getUTCMinutes().toString().padStart(2, '0'), seconds = date.getUTCSeconds().toString().padStart(2, '0'), milliseconds = date.getUTCMilliseconds().toString().padStart(3, '0');
    console.log(`Elapsed Time: ${hours}:${minutes}:${seconds}:${milliseconds}`);
}
/**
 * This is a context manager that keeps track of the time it takes to execute
 * the body of the context.
 *
 * #### Typical Usage
 * ```
 * With(timed(), () => {
 *   // context body
 * })
 * // logs the time it took to execute the body
 * ```
 * @param logger any function that accepts a number.
 * This function would be called with the elasped time
 * (in milliseconds). defaults to a timelogger that logs
 * the time in this format `HH:MM:SS:mmm`
 */
const timed = contextmanager(function* (logger = _timelogger) {
    let start = Date.now();
    try {
        start = Date.now();
        yield;
    }
    finally {
        logger(Date.now() - start);
    }
});
exports.timed = timed;
/**Context manager that automatically closes something at the end of the body
 *
 * ```
 * With(closing(<closeable>), closeable => {
 *  // do something with <closeable>
 * })
 * ```
 * @param thing any object that has a `close` method.
 */
const closing = contextmanager(function* closing(thing) {
    try {
        yield thing;
    }
    finally {
        thing.close();
    }
});
exports.closing = closing;
/**
 * Context manager used to suppress specific errors.
 *
 * After the error is suppressed, execution proceeds with the next statement
 * following the context handler.
 *
 * ```
 * With(suppress(TypeError), ()=>{
 *  throw new TypeError
 * })
 * // execution stills resumes here
 * ```
 * @param errors Error classes e.g: (`TypeError`, `SyntaxError`, `CustomError`)
 */
const suppress = contextmanager(function* suppress(...errors) {
    try {
        yield;
    }
    catch (error) {
        for (let i = 0; i < errors.length; i++) {
            if (error instanceof errors[i]) {
                return;
            }
        }
        ;
        throw error;
    }
});
exports.suppress = suppress;
exports.default = With;
//# sourceMappingURL=contextlib.js.map