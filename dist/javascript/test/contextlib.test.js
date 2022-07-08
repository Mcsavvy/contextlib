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
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
Object.defineProperty(exports, "__esModule", { value: true });
const contextlib_1 = require("../src/contextlib");
test("Generator contextmanagers must yield once", () => {
    const nonYieldingGeneratorCM = (0, contextlib_1.contextmanager)(function* () {
    });
    const multiYieldingGeneratorCM = (0, contextlib_1.contextmanager)(function* () {
        yield 1;
        yield 2;
    });
    expect(() => {
        (0, contextlib_1.With)(nonYieldingGeneratorCM(), () => { });
    }).toThrow("Generator did not yield!");
    expect(() => {
        (0, contextlib_1.With)(multiYieldingGeneratorCM(), () => { });
    }).toThrow("Generator did not stop!");
});
test("Once an exitstack exits, all callbacks would be called in the reverse order", () => {
    const log = jest.fn(console.log);
    (0, contextlib_1.With)(new contextlib_1.ExitStack(), exitstack => {
        exitstack.callback(() => log("first"));
        exitstack.callback(() => log("second"));
        exitstack.callback(() => log("third"));
    });
    expect(log.mock.calls.length).toBe(3);
    expect(log.mock.calls[0][0]).toBe("third");
    expect(log.mock.calls[2][0]).toBe("first");
});
test(`When multiple errors occur in an exitstack, the last error would be thrown`, () => {
    const buggycm = (0, contextlib_1.contextmanager)(function* buggycm(id) {
        yield id;
        const msg = `there was an error in contextmanager[${id}]`;
        console.warn('Throwing: %s', msg);
        throw new Error(msg);
    });
    const exitstack = new contextlib_1.ExitStack();
    for (let i = 1; i <= 3; i++) {
        exitstack.enterContext(buggycm(i));
    }
    ;
    expect(() => {
        (0, contextlib_1.With)(exitstack, () => { });
    }).toThrow("there was an error in contextmanager[3]");
});
test('Any error in a context body would be thrown in the context manager', () => {
    const cm = (0, contextlib_1.contextmanager)(function* () {
        let error;
        try {
            yield;
        }
        catch (e) {
            error = e;
        }
        expect(error).toBeDefined();
        expect(error.message).toBe("this error was throw in the body");
    });
    (0, contextlib_1.With)(cm(), () => {
        throw new Error("this error was throw in the body");
    });
});
test('Any error in the context body would be suppressed if the cm\'s exit method returns a true value', () => {
    class truthycm extends contextlib_1.ContextManagerBase {
        exit() { return true; }
    }
    expect(() => {
        (0, contextlib_1.With)(new truthycm, () => {
            throw new Error("this error would be suppressed");
        });
    }).not.toThrowError();
    // you can also use a generator cm
    const truthycm_ = (0, contextlib_1.contextmanager)(function* () {
        try {
            yield;
        }
        finally {
            return true;
        }
    });
    expect(() => {
        (0, contextlib_1.With)(truthycm_(), () => {
            throw new Error("this error would be suppressed");
        });
    }).not.toThrowError();
});
test("suppress", () => {
    expect(() => {
        (0, contextlib_1.With)((0, contextlib_1.suppress)(SyntaxError), () => {
            throw new SyntaxError();
        });
    }).not.toThrowError();
});
test("timed", () => {
    const timelogger = jest.fn((time) => {
        const date = new Date(time), hours = date.getUTCHours().toString().padStart(2, '0'), minutes = date.getUTCMinutes().toString().padStart(2, '0'), seconds = date.getUTCSeconds().toString().padStart(2, '0'), milliseconds = date.getUTCMilliseconds().toString().padStart(3, '0');
        return `${hours}:${minutes}:${seconds}:${milliseconds}`;
    });
    (0, contextlib_1.With)((0, contextlib_1.timed)(timelogger), () => { });
    expect(typeof timelogger.mock.calls[0][0]).toBe('number');
    expect(timelogger.mock.results[0].value).toMatch(/\d{2}:\d{2}:\d{2}:\d{3}/);
});
test("closing", () => {
    const close = jest.fn();
    const closingThing = {
        close: function () {
            close();
        }
    };
    (0, contextlib_1.With)((0, contextlib_1.closing)(closingThing), () => { });
    expect(close.mock.calls.length).toBe(1);
});
describe('Use', () => {
    test('success', () => __awaiter(void 0, void 0, void 0, function* () {
        var e_1, _a;
        const out = [];
        try {
            for (var _b = __asyncValues((0, contextlib_1.Use)({
                enter: function () {
                    expect(arguments).toHaveLength(0);
                    out.push(1);
                    return 2;
                },
                exit: function () {
                    expect(arguments).toHaveLength(0);
                    out.push(3);
                }
            })), _c; _c = yield _b.next(), !_c.done;) {
                const v = _c.value;
                expect(v).toStrictEqual(2);
                out.push(4);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) yield _a.call(_b);
            }
            finally { if (e_1) throw e_1.error; }
        }
        out.push(5);
        expect(out).toStrictEqual([
            1,
            4,
            3,
            5
        ]);
    }));
    test('error', () => __awaiter(void 0, void 0, void 0, function* () {
        const out = [];
        yield (() => __awaiter(void 0, void 0, void 0, function* () {
            try {
                // eslint-disable-next-line no-unreachable-loop
                for (const v of (0, contextlib_1.Use)({
                    enter: function () {
                        expect(arguments).toHaveLength(0);
                        out.push(1);
                        return 2;
                    },
                    exit: function () {
                        expect(arguments).toHaveLength(0);
                        out.push(3);
                        return 4;
                    }
                })) {
                    expect(v).toStrictEqual(2);
                    out.push(5);
                    yield new Promise((resolve) => setTimeout(resolve, 50));
                    out.push(6);
                    throw 7;
                }
            }
            catch (e) {
                out.push(8);
                expect(e).toStrictEqual(7);
                return;
            }
            expect('didnt throw error').toEqual('threw error');
        }))();
        expect(out).toStrictEqual([
            1,
            5,
            6,
            3,
            8
        ]);
    }));
});
describe('ExitStack', () => {
    test('suppressed called with error', () => {
        const es = new contextlib_1.ExitStack();
        es.callback(() => true);
        expect(es._exitCallbacks).toHaveLength(1);
        expect(es.exit(undefined)).toStrictEqual(true);
        expect(es._exitCallbacks).toHaveLength(0);
    });
    test('suppressed called without error', () => {
        const es = new contextlib_1.ExitStack();
        es.callback(() => true);
        expect(es._exitCallbacks).toHaveLength(1);
        expect(es.exit()).toStrictEqual(false);
        expect(es._exitCallbacks).toHaveLength(0);
    });
    test('higher nested cm can swallow errors from lower ones', () => {
        const es = new contextlib_1.ExitStack();
        const out = [];
        es.callback(function () {
            out.push(14);
            expect(arguments).toHaveLength(0);
            out.push(15);
        });
        es.callback(err => {
            out.push(12);
            expect(err).toStrictEqual(11);
            out.push(13);
            return true;
        });
        es.callback(function () {
            out.push(9);
            expect(arguments).toHaveLength(0);
            out.push(10);
            throw 11;
        });
        es.callback(err => {
            out.push(7);
            expect(err).toStrictEqual(1);
            out.push(8);
            // suppress
            return true;
        });
        es.callback(err => {
            out.push(4);
            expect(err).toStrictEqual(1);
            out.push(5);
            throw 6;
        });
        es.callback(err => {
            out.push(2);
            expect(err).toStrictEqual(1);
            out.push(3);
            return false;
        });
        expect(es.exit(1)).toStrictEqual(true);
        expect(out).toStrictEqual([
            2,
            3,
            4,
            5,
            7,
            8,
            9,
            10,
            12,
            13,
            14,
            15
        ]);
    });
    test('error swallowing w/o having passed in an error wont return true', () => {
        const es = new contextlib_1.ExitStack();
        const out = [];
        es.callback(err => {
            out.push(6);
            expect(err).toStrictEqual(3);
            out.push(7);
            return true;
        });
        es.callback(err => {
            out.push(4);
            expect(err).toStrictEqual(3);
            out.push(5);
            return false;
        });
        es.callback(function () {
            out.push(1);
            expect(arguments).toHaveLength(0);
            out.push(2);
            throw 3;
        });
        expect(es.exit()).toStrictEqual(false);
        expect(out).toStrictEqual([
            1,
            2,
            4,
            5,
            6,
            7
        ]);
    });
});
describe('closing', () => {
    test('async close', () => __awaiter(void 0, void 0, void 0, function* () {
        const out = [];
        const closer = {
            // eslint-disable-next-line @typescript-eslint/promise-function-async
            close: () => {
                out.push(1);
                return new Promise((resolve) => setTimeout(resolve, 100)).then(() => {
                    out.push(2);
                    return 3;
                });
            },
            wat: () => 4
        };
        const cm = (0, contextlib_1.closing)(closer);
        const val = cm.enter();
        expect(val).toBe(closer);
        expect(out).toStrictEqual([]);
        const p = cm.exit();
        expect(out.splice(0, out.length)).toStrictEqual([1]);
        expect(yield p).toStrictEqual(3);
        expect(out.splice(0, out.length)).toStrictEqual([2]);
    }));
});
//# sourceMappingURL=contextlib.test.js.map