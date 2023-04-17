"use strict";
/* eslint-disable import/no-unresolved */
/**
 * Create a contextmanager using a generator function.
 * The function must yield only once, and the value yielded
 * would be passed as argument to the context body.
 *
 * After the context body returns,
 * the generator function is entered once again;
 * this time, the generator function should clean up
 * just like an "exit" method would.
 *
 * Any error thrown in the context body would be through
 * inside the generator function, at the point where it yielded.
 * This error can be handled using a `try-finally` block.
 */
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
var _AsyncGeneratorContextManager_yielded;
Object.defineProperty(exports, "__esModule", { value: true });
exports.contextmanagerAsync = exports.contextmanager = exports.AsyncGeneratorContextManager = exports.GeneratorContextManager = void 0;
/**
 * GeneratorContextManager is a context manager that wraps a generator.
 * The generator should yield only once. The value yielded is passed to the
 * body function.
 *
 * After the body function returns, the generator is entered again.
 * This time, the generator should clean up.
 *
 * If an error is raised in the body function, the error is thrown at the
 * point the generator yielded.
 */
class GeneratorContextManager {
    constructor(gen) {
        this.gen = gen;
        this._yielded = false;
    }
    /**
     * Enter a generator contextmanager
     * @returns the first value yielded from the generator function
     */
    enter() {
        // prevent a generator cm from being re-entered
        if (this._yielded) {
            throw 'cannot re-enter a generator contextmanager';
        }
        const { value, done } = this.gen.next();
        this._yielded = true;
        if (done !== null && done !== void 0 ? done : false) {
            throw Error('Generator did not yield!');
        }
        return value;
    }
    /**
     * Exit a generator context manager
     * @param error
     * @returns anything
     */
    exit(error) {
        const hasError = error !== undefined;
        let done, value;
        if (!hasError) {
            ({ done, value } = this.gen.next());
            if (done !== null && done !== void 0 ? done : false) {
                return value;
            }
            else {
                throw 'Generator did not stop!';
            }
        }
        else {
            // reraise the error inside the generator
            try {
                ({ done, value } = this.gen.throw(error));
            }
            catch (err) {
                /**
                 * only re-throw an error if it's not the same error that
                 * was passed to throw(), because exit() must not raise
                 * an error unless exit() itself failed.
                 */
                if (err === error) {
                    return false;
                }
                throw err;
            }
            if (!(done !== null && done !== void 0 ? done : false)) {
                throw 'Generator did not stop!';
            }
            // suppress the error if it was suppressed in the generator
            return value;
        }
    }
}
exports.GeneratorContextManager = GeneratorContextManager;
/**
 * transform a generator function into a contextmanager
 * @param func a generator function
 * @returns a wrapper around func which returns a contextmanager when called
 */
function contextmanager(func) {
    function wrapper(...args) {
        const gen = func(...args);
        return new GeneratorContextManager(gen);
    }
    return wrapper;
}
exports.contextmanager = contextmanager;
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
 */
class AsyncGeneratorContextManager {
    /** @param gen A generator */
    constructor(gen) {
        _AsyncGeneratorContextManager_yielded.set(this, void 0);
        this.gen = gen;
        __classPrivateFieldSet(this, _AsyncGeneratorContextManager_yielded, false, "f");
    }
    /**
     * Enter an async generator contextmanager
     * @returns the first value yielded from the generator function
     */
    async enter() {
        if (__classPrivateFieldGet(this, _AsyncGeneratorContextManager_yielded, "f"))
            throw 'cannot re-enter a generator contextmanager';
        const { value, done } = await this.gen.next();
        if (done == true) {
            throw Error('Generator did not yield!');
        }
        __classPrivateFieldSet(this, _AsyncGeneratorContextManager_yielded, true, "f");
        return value;
    }
    /**
     * Exit an async generator context manager
     * @param error
     * @returns anything
     */
    async exit(error) {
        var _a, _b;
        let result;
        const hasError = error != undefined;
        if (hasError) {
            // reraise the error inside the generator
            result = await this.gen.throw(error);
            // suppress the error if it was suppressed in the generator
            if (!((_a = result.done) !== null && _a !== void 0 ? _a : false))
                throw "Generator didn't stop after throw";
            return result.value === true;
        }
        // clean up
        result = await this.gen.next();
        // the generator should be done since it yields only once
        if (!((_b = result.done) !== null && _b !== void 0 ? _b : false)) {
            throw new Error('Generator did not stop!');
        }
        return true;
    }
}
exports.AsyncGeneratorContextManager = AsyncGeneratorContextManager;
_AsyncGeneratorContextManager_yielded = new WeakMap();
/**
 * transform an async generator function into an async contextmanager
 * @param func a generator function or any function that returns a generator
 * @returns a function that returns a GeneratorContextManager when called with the argument
 * for func */
function contextmanagerAsync(func) {
    async function wrapper(...args) {
        const gen = func(...args);
        return new AsyncGeneratorContextManager(gen);
    }
    // Object.defineProperty(helper, 'name', { value: func.name || 'generatorcontext' })
    return wrapper;
}
exports.contextmanagerAsync = contextmanagerAsync;
//# sourceMappingURL=generatorcm.js.map