/**
 * The With function manages context, it enters the given context on invocation
 * and exits the context on return.
 * It accepts two arguments, a context manager and a callback.
 * The calback is called with the context manager's return value as argument.
 * If an error is raised in the callback, the context manager's `exit()` method
 * is called with the error as argument.
 * If the context manager's `exit()` method returns true, the error is suppressed.
 * @param manager the context manager for this context
 * @param body the body function for this context*/
function With(manager, body) {
    try {
        body(manager.enter());
        manager.exit();
    }
    catch (e) {
        var r = manager.exit(e);
        if (!r) {
            throw e;
        }
    }
}
/**context manager class to inherit from.
 * It returns itself in it's enter method like the default python implementation.*/
class ContextManagerBase {
    enter() { return this; }
    exit() { }
}
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
    /**An array of all callbacks plus contexts exit methds */
    _exitCallbacks;
    /**turn a regular callback to an exit function
     * @param cb a regular callback
     * @returns an exit function
     */
    _makeExitWrapper(cb) {
        function helper(error) {
            return cb();
        }
        return helper;
    }
    constructor() {
        this._exitCallbacks = [];
    }
    enter() { return this; }
    exit(error) {
        var hasError = error != undefined;
        var suppressed = false, pendingRaise = false, frameErr = error;
        // callbacks are invoked in LIFO order to match the behaviour of
        // nested context managers
        while (this._exitCallbacks.length > 0) {
            var cb = this._exitCallbacks.pop();
            try {
                if (cb(error)) {
                    suppressed = true;
                    pendingRaise = false;
                    error = undefined;
                }
            }
            catch (e) {
                if (!(e instanceof Error)) {
                    console.log("error is not an Error instance");
                    e = new Error(e.toString());
                }
                var newError = e;
                pendingRaise = true;
                error = error || newError;
            }
        }
        if (pendingRaise) {
            throw error;
            // try {
            //     var fixedCause = error.cause;
            //     throw error
            // } catch (e){
            //     e.cause = fixedCause;
            //     throw e as Error
            // }
        }
        return hasError && suppressed;
    }
    /**
     * Add a regular callback to the ExitStack.
     * @param cb a regular callback*/
    callback(cb) {
        this._exitCallbacks.push(this._makeExitWrapper(cb));
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
        this.push(cm);
        return cm.enter();
    }
    /**
     * Remove all context managers from the ExitStack and return a new ExitStack containing
     * the removed context managers.
     * @returns A new exit stack containing all exit callbacks from this one*/
    popAll() {
        // preserve the context stack by tranferring the callbacks to a new stack
        var stack = new ExitStack();
        stack._exitCallbacks = this._exitCallbacks;
        this._exitCallbacks = [];
        return stack;
    }
}
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
    /**A generator */
    gen;
    /**@param gen A generator */
    constructor(gen) {
        this.gen = gen;
    }
    enter() {
        var { value, done } = this.gen.next();
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
        var r = this.gen.next();
        // the generator should be done since it yields only once
        if (!r.done) {
            throw new Error("Generator did not stop!");
        }
        // alway return true to suppress the error
        return true;
    }
}
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
        var gen = func(...args);
        return new GeneratorCM(gen);
    }
    Object.defineProperty(helper, 'name', { value: func.name || 'generatorcontext' });
    return helper;
}
/**
 * This acts as a stand-in when a context manager is required.
 * It does not additional processing.*/
class nullcontext {
    enter() { }
    exit(error) { }
}
function _timelogger(time) {
    var date = new Date(time), hours = date.getUTCHours().toString().padStart(2, '0'), minutes = date.getUTCMinutes().toString().padStart(2, '0'), seconds = date.getUTCSeconds().toString().padStart(2, '0'), milliseconds = date.getUTCMilliseconds().toString().padStart(3, '0');
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
var timed = contextmanager(function* (logger = _timelogger) {
    var start = Date.now();
    try {
        start = Date.now();
        yield;
    }
    finally {
        logger(Date.now() - start);
    }
});
/**Context manager that automatically closes something at the end of the body
 *
 * ```
 * With(closing(<closeable>), closeable => {
 *  // do something with <closeable>
 * })
 * ```
 * @param thing any object that has a `close` method.
 */
var closing = contextmanager(function* closing(thing) {
    try {
        yield thing;
    }
    finally {
        thing.close();
    }
});
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
var suppress = contextmanager(function* suppress(...errors) {
    try {
        yield;
    }
    catch (error) {
        for (var i = 0; i < errors.length; i++) {
            if (error instanceof errors[i]) {
                return;
            }
        }
        ;
        throw error;
    }
});
// export { With, ContextManagerBase, ExitStack, GeneratorCM, contextmanager, nullcontext, timed, suppress, closing };
// export default With;

module.exports = {
    With, ContextManagerBase, ExitStack, GeneratorCM, contextmanager, nullcontext, timed, suppress, closing
}

module.exports.default = With
//# sourceMappingURL=index.js.map