"use strict";
/* eslint-disable import/no-unresolved */
/**
 * The with function manages context by entering a given contextmanager
 * on invocation and exiting it on return.
 *
 * It accepts two arguments
 * - a contextmanager
 * - a context body
 *
 * The context body is a callback function that would be invoked in
 * the context of the contextmanager.
 *
 * The contextbody is invoked with whatever value was returned from calling
 * the contextmanager's "enter" method.
 *
 * Any error raise in the context body is passed to the contextmanager's
 * "exit" method for handling. Such error would be suppressed if the "exit"
 * method returns true.
 */
var __await = (this && this.__await) || function (v) { return this instanceof __await ? (this.v = v, this) : new __await(v); }
var __asyncGenerator = (this && this.__asyncGenerator) || function (thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i;
    function verb(n) { if (g[n]) i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; }
    function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
    function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
    function fulfill(value) { resume("next", value); }
    function reject(value) { resume("throw", value); }
    function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useAsync = exports.Use = exports.withAsync = exports.With = void 0;
const generatorcm_1 = require("./generatorcm");
/**
 * With - handles entering and exiting a context
 *
 * @param manager the context manager for this context
 * @param body a function that'll be used as contextmanager's
 * body
 * @returns {WithResult} an object that shows the status of the context
 * at exit
 * */
function With(manager, body) {
    let cm;
    if (typeof manager.throw == 'function') {
        cm = new generatorcm_1.GeneratorContextManager(manager);
    }
    else {
        cm = manager;
    }
    if (cm['enter'] == undefined)
        throw Error(`contextmanager has no enter() method`);
    if (cm['exit'] == undefined)
        throw Error(`contextmanager has no exit() method`);
    const contextvar = cm.enter();
    try {
        const ret = body(contextvar);
        cm.exit();
        return {
            completed: true,
            value: ret
        };
    }
    catch (error) {
        if (cm.exit(error) !== true) {
            throw error;
        }
        return {
            completed: false,
            value: error
        };
    }
}
exports.With = With;
/**
 * Use constructs a generator that may be used to fulfil the same role as With,
 * though without the suppression or error handling capabilities.
 *
 * @param {ContextManager<T>} manager
 * @returns {Generator<T>} a generator function that yields the value
 * returned from the context manager's enter()
 */
function* Use(manager) {
    const val = manager.enter();
    try {
        yield val;
    }
    finally {
        // TODO: block on promises
        manager.exit();
    }
}
exports.Use = Use;
/**
 * An async implementation of Use.
 * It differs in that, due to the limitations of JS generators, exit will not
 * be awaited.
 *
 * Use constructs a generator that may be used to fulfil the same role as With,
 * though without the suppression or error handling capabilities.
 *
 * @param {ContextManager<T>} manager
 * @returns {Generator<T>} a generator function that yields the value
 * returned from the context manager's enter()
 */
function useAsync(manager) {
    return __asyncGenerator(this, arguments, function* useAsync_1() {
        const val = yield __await(manager.enter());
        try {
            yield yield __await(val);
        }
        finally {
            // unfortunately there does not appear to be any way to get this to block on promises
            yield __await(manager.exit());
        }
    });
}
exports.useAsync = useAsync;
/**
 * An async implementation of With.
 * Handles entering and exiting a context
 *
 * @param manager the context manager for this context
 * @param body a function that'll be used as contextmanager's
 * body
 * @returns {WithResult} an object that shows the status of the context
 * at exit
 * */
async function withAsync(manager, body) {
    let cm;
    if (typeof manager.throw == 'function') {
        cm = new generatorcm_1.AsyncGeneratorContextManager(manager);
    }
    else {
        cm = manager;
    }
    if (cm['enter'] == undefined)
        throw Error(`contextmanager has no enter() method`);
    if (cm['exit'] == undefined)
        throw Error(`contextmanager has no exit() method`);
    const contextvar = await cm.enter();
    try {
        const ret = await body(contextvar);
        await cm.exit();
        return {
            completed: true,
            value: ret
        };
    }
    catch (error) {
        if (await cm.exit(error) !== true) {
            throw error;
        }
        return {
            completed: false,
            value: error
        };
    }
}
exports.withAsync = withAsync;
//# sourceMappingURL=with.js.map