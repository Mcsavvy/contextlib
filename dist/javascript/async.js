"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
exports.ExitStack = exports.Use = exports.With = void 0;
/**
 * An async implementation of With.
 */
function With(manager, body) {
    return __awaiter(this, void 0, void 0, function* () {
        const val = yield manager.enter();
        let result;
        try {
            result = { result: yield body(val) };
        }
        catch (error) {
            if ((yield manager.exit(error)) !== true) {
                throw error;
            }
            return {
                error,
                suppressed: true
            };
        }
        yield manager.exit();
        return result;
    });
}
exports.With = With;
/**
 * An async implementation of Use.
 * It differs in that, due to the limitations of JS generators, exit will not
 * be awaited.
 */
function Use(manager) {
    return __asyncGenerator(this, arguments, function* Use_1() {
        const val = yield __await(manager.enter());
        try {
            yield yield __await(val);
        }
        finally {
            // unfortunately there does not appear to be any way to get this to block on promises
            manager.exit();
        }
    });
}
exports.Use = Use;
/**
 * An async implementation of ExitStack.
 */
class ExitStack {
    constructor() {
        this._exitCallbacks = [];
    }
    enter() {
        return this;
    }
    exit(error) {
        return __awaiter(this, arguments, void 0, function* () {
            const hasError = arguments.length !== 0;
            let suppressed = false;
            let pendingRaise = false;
            // callbacks are invoked in LIFO order to match the behaviour of
            // nested context managers
            while (this._exitCallbacks.length !== 0) {
                const cb = this._exitCallbacks.pop();
                if (cb === undefined) {
                    continue;
                }
                try {
                    const cbResult = !pendingRaise && (suppressed || !hasError) ? yield cb() : yield cb(error);
                    if (cbResult === true) {
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
        });
    }
    callback(cb) {
        this._exitCallbacks.push(cb);
    }
    push(cm) {
        this.callback(cm.exit.bind(cm));
    }
    enterContext(cm) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield cm.enter();
            this.push(cm);
            return result;
        });
    }
    popAll() {
        const stack = new ExitStack();
        stack._exitCallbacks = this._exitCallbacks;
        this._exitCallbacks = [];
        return stack;
    }
}
exports.ExitStack = ExitStack;
//# sourceMappingURL=async.js.map