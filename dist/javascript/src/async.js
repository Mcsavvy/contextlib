var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _GeneratorContextManager_yielded;
import { ExitStackBase } from './contextlib';
import { getattr } from 'utils';
/** context manager class to inherit from.
 * It returns itself in it's enter method like the default python implementation. */
export class ContextManagerBase {
    async enter() { return this; }
    async exit() { }
}
/**
 * GeneratorContextManager is a context manager that wraps an async generator.
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
 * async function* genFn(<args>){
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
export class GeneratorContextManager {
    /** @param gen A generator */
    constructor(gen) {
        _GeneratorContextManager_yielded.set(this, void 0);
        this.gen = gen;
        __classPrivateFieldSet(this, _GeneratorContextManager_yielded, false, "f");
    }
    async enter() {
        if (__classPrivateFieldGet(this, _GeneratorContextManager_yielded, "f"))
            throw 'cannot re-enter a generator contextmanager';
        const { value, done } = await this.gen.next();
        __classPrivateFieldSet(this, _GeneratorContextManager_yielded, true, "f");
        if (done) {
            throw Error('Generator did not yield!');
        }
        ;
        return value;
    }
    async exit(error) {
        let result;
        const hasError = error != undefined;
        if (hasError) {
            // reraise the error inside the generator
            result = await this.gen.throw(error);
            // suppress the error if it was suppressed in the generator
            if (!result.done)
                throw "Generator didn't stop after throw";
            return result.value === true;
        }
        ;
        // clean up
        result = await this.gen.next();
        // the generator should be done since it yields only once
        if (!result.done) {
            throw new Error('Generator did not stop!');
        }
    }
}
_GeneratorContextManager_yielded = new WeakMap();
/**
 * asynccontextmanager decorator to wrap a generator function and turn
 * it into a context manager.
 *
 * Typical Usage:
 * ```
 * var GeneratorContextManager = contextmanager(async function* genfunc(<args>){
 *     // setup with <args>
 *     try {
 *         yield <value>
 *     }
 *     finally {
 *         // cleanup
 *     }
 * })
 * // GeneratorContextManager still needs to be invoked with <args> to get the context manager.
 * var cm = await GeneratorContextManager(<args>)
 * ```
 * @param func a generator function or any function that returns a generator
 * @returns a function that returns a GeneratorContextManager when called with the argument
 * for func */
export async function contextmanager(func) {
    async function helper(...args) {
        const gen = await func(...args);
        return new GeneratorContextManager(gen);
    }
    Object.defineProperty(helper, 'name', { value: func.name || 'generatorcontext' });
    return helper;
}
/**
 * An async implementation of With.
 */
export async function With(manager, body) {
    const val = await manager.enter();
    let result;
    try {
        result = { result: await body(val) };
    }
    catch (error) {
        if (await manager.exit(error) !== true) {
            throw error;
        }
        return {
            error,
            suppressed: true
        };
    }
    await manager.exit();
    return result;
}
/**
 * An async implementation of Use.
 * It differs in that, due to the limitations of JS generators, exit will not
 * be awaited.
 */
export async function* Use(manager) {
    const val = await manager.enter();
    try {
        yield val;
    }
    finally {
        // unfortunately there does not appear to be any way to get this to block on promises
        manager.exit();
    }
}
/**
 * An async implementation of ExitStack.
 */
export class ExitStack extends ExitStackBase {
    /** Registers an async callback with the standard `ContextManager.exit` method signature.
     *
     * Can suppress exceptions the same way exit methods can.
     * Also accepts any object with an `exit` method(registering a call to the method instead of the object)
    */
    pushAsync(exit) {
        try {
            const exit_method = getattr(exit, 'exit');
            this.push_cm_exit(exit_method.bind(exit), false);
        }
        catch (error) {
            this.push_cm_exit(exit, false);
        }
        return exit; // allow use as a decorator
    }
    /** Enters the supplied context manager
     *
     * If successful, also pushes the exit method as a callback and returns the results
     * of the enter method
     */
    async enterAsyncContext(cm) {
        const _exit = getattr(cm, 'exit');
        const result = await cm.enter();
        this.push_cm_exit(_exit.bind(cm), false);
        return result;
    }
    /** Registers an arbitrary async callback.
     *
     * Cannot suppress exceptions {@link https://github.com/Mcsavvy/contextlib/issues/2}
     */
    async callbackAsync(callback) {
        this.push_exit_callback(callback, false);
        return callback; // allow use as a decorator
    }
    async enter() {
        return this;
    }
    async exit(error) {
        const hasError = arguments.length !== 0;
        let suppressed = false;
        let pendingRaise = false;
        // callbacks are invoked in LIFO order to match the behavior of
        // nested context managers
        while (this.exit_callbacks.length !== 0) {
            const [isSync, isCallback, Fn] = this.exit_callbacks.pop();
            if (Fn === undefined)
                continue;
            try {
                if (isCallback)
                    isSync ? Fn() : await Fn();
                else {
                    const result = !pendingRaise && (suppressed || !hasError)
                        ? isSync ? Fn() : await Fn()
                        : isSync ? Fn(error) : await Fn(error);
                    if (result === true) {
                        suppressed = hasError;
                        pendingRaise = false;
                        error = undefined;
                    }
                    else
                        suppressed = !hasError;
                }
            }
            catch (e) {
                suppressed = false;
                pendingRaise = true;
                error = e;
            }
        }
        if (pendingRaise)
            throw error;
        if (hasError)
            return suppressed;
    }
}
//# sourceMappingURL=async.js.map