const __fakeValue = null;

/** @typedef {string | undefined} errType */
/** @typedef {string | undefined} errStack */
/** @typedef {Error | undefined} ErrorT */
/** @typedef {Generator<T, any>} gen */
/** @typedef {(...args: any[]) => gen<T>} genFunc */
/** @typedef {[errType, ErrorT, errStack]} errorTuple */
/** @typedef {(...errorInfo: errorTuple) => any} exit */
/** @typedef {(...args: any[]) => void} body */
/** 
 * @typedef {Object<T>} ContextManager
 * @property {() => T} enter
 * @property {exit} exit
 */

/**@implements {ContextManager} */
class GeneratorCM {
    /** */
    gen = undefined;
    constructor(gen) {
        this.gen = gen;
    }
    /** @returns {T} */
    enter() { return this.gen.next().value; }
    /** @param {errorTuple} error
     * @returns {true}
     */
    exit(...error) {
        if (error[1]) {
            this.gen.throw(error[1]);
            // reraise the error inside the generator
            // if the error is not suppressed, it is thrown after
            // clean up
        }
        ;
        // clean up
        var r = this.gen.next();
        if (!r.done) {
            throw new Error("generator is still running...");
        }
        return this.gen.return(true).value;
    }
}
/** Context manager for dynamic management of a stack of exit callbacks.

    For example:
    ```
    var intervalCM = contextmanager(function*(interval, callback){
        var id = setInterval(callback, interval);
        try { yield id }
        finally { clearInterval(id) }
    });

    With(new ExitStack(), (stack) => {
        for (var i = 0; i < 10; i++) {
            stack.enter(intervalCM(1000, () => console.log(i)));
        }
        // all intervals are cleared at this point
    });
    ```
*/
class ExitStack {
    /** */
    _exitCallbacks = undefined;
    /** @private
     * @param {Function} cb
     * @returns {exit}
     */
    _makeExitWrapper(cb) {
        function helper(...error) {
            return cb(...error);
        }
        return helper;
    }
    constructor() {
        this._exitCallbacks = [];
    }
    /** @returns {ExitStack} */
    enter() { return this; }
    /** @param {errorTuple} error
     * @returns {any}
     */
    exit(...error) {
        var hasError = error[0] != undefined;
        var suppressed = false, pendingRaise = false, frameErr = error;
        // callbacks are called in reverse order LIFO
        this._exitCallbacks.forEach(function (cb) {
            try {
                if (cb(...error)) {
                    suppressed = true;
                    error = [undefined, undefined, undefined];
                }
            }
            catch (e) {
                // an error was raised in the callback
                // check if the error is the same one thrown in the exitstack
                if (e !== frameErr[1]) {
                    var err;
                    if (e instanceof Error)
                        err = e;
                    else
                        err = new Error(e.toString());
                    pendingRaise = true;
                    error = [err.name, err, err.stack];
                }
            }
        });
        this._exitCallbacks = [];
        if (pendingRaise) {
            throw error[1];
        }
        return hasError && suppressed;
    }
    /**
     * Add a callback to the ExitStack. The callback will be called with
     * the arguments given to the ExitStack's exit() method.
     * @param {Function} cb
     * @returns {void}
     */
    callback(cb) {
        this._exitCallbacks.push(this._makeExitWrapper(cb));
    }
    /**
     * Add a context manager to the ExitStack. The context manager's
     * `exit()` method will be called with the arguments given to the
     * ExitStack's exit() method.
     * @param {ContextManager<any>} cm
     * @returns {void}
     */
    push(cm) {
        this.callback(cm.exit.bind(cm));
    }
    /**
     * Enter another context manager and return its results.
     * The context manager's `exit()` method will be called with the
     * arguments given to the ExitStack's exit() method.
     * @param {ContextManager<any>} cm
     * @returns {any}
     */
    enterContext(cm) {
        this.push(cm);
        return cm.enter();
    }
    /**
     * Remove all context managers from the ExitStack and return a new ExitStack containing
     * the removed context managers.
     * @returns {any}
     */
    popAll() {
        // preserve the context stack by tranferring the callbacks to a new stack
        var stack = new ExitStack();
        stack._exitCallbacks = this._exitCallbacks;
        this._exitCallbacks = [];
        return stack;
    }
}
/**
### @contextmanager decorator

Turn a generator function to a context manager

Typical Usage
-------------
```
function genFn(...args){
    [setup]
    try { yield [value] }
    finally { [cleanup] }
}
```
This makes this:
```
With(genFn(...args), [value] => { [body] })
```

Equivalent to this:
```
[setup]
try {
    var variable = [value]
    [body]
}
finally {
    [cleanup]
}
```
 * @param {(...args: []) => gen<T>} func
 * @returns {(...args: any[]) => GeneratorCM<T>}
 */
function contextmanager(func) {
    function helper(...args) {
        return new GeneratorCM(func(...args));
    }
    return helper;
}
/**
 * The With function manages context, it enters the given context on invocation
 * and exits the context on return.
 * It accepts two arguments, a context manager and a callback.
 * The calback is called with the context manager's return value as argument.
 * If an error is raised in the callback, the context manager's `exit()` method
 * is called with the error as argument.
 * If the context manager's `exit()` method returns true, the error is suppressed.
 * @param {ContextManager<T>} manager
 * @param {(...args: [T?]) => void} body
 * @returns {void}
 */
function With(manager, body) {
    try {
        body(manager.enter());
    }
    catch (e) {
        if (e instanceof Error) {
            if (!manager.exit(e.name, e, e.stack))
                throw e;
        }
        else
            throw e;
    }
    ;
    manager.exit(undefined, undefined, undefined);
}
/**
 * This acts as a stand-in when a context manager is required.
 * It does not additional processing.*/
class nullcontext {
    /** @returns {nullcontext} */
    enter() { return this; }
    /** @param {errorTuple} error
     * @returns {true}
     */
    exit(...error) { return true; }
}
/**
 * This is a context manager that keeps track of the time it takes to execute
 * the body of the context.
 *
 * #### Typical Usage
 * ```
 * With(timeTracker, () => {
 *   // context body
 * })
 * // logs the time it took to execute the body
 * ```
 */
var timeTracker = contextmanager(function* () {
    var start = Date.now();
    try {
        start = Date.now();
        yield null;
    }
    finally {
        var date = new Date(Date.now() - start);
        var hours = date.getUTCHours().toString().padStart(2, '0');
        var minutes = date.getUTCMinutes().toString().padStart(2, '0');
        var seconds = date.getUTCSeconds().toString().padStart(2, '0');
        var milliseconds = date.getUTCMilliseconds().toString().padStart(3, '0');
        console.log(`Elapsed Time: ${hours}:${minutes}:${seconds}.${milliseconds}`);
    }
})();

export { contextmanager, ExitStack, GeneratorCM, nullcontext, With, timeTracker };
export default With;
