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
const async_1 = require("../src/async");
const index_1 = require("../index");
describe('With', () => {
    test('error', () => __awaiter(void 0, void 0, void 0, function* () {
        const out = [];
        yield (() => __awaiter(void 0, void 0, void 0, function* () {
            try {
                yield (0, async_1.With)({
                    enter: function () {
                        return __awaiter(this, arguments, void 0, function* () {
                            expect(arguments).toHaveLength(0);
                            out.push(1);
                            yield new Promise((resolve) => setTimeout(resolve, 50));
                            return 2;
                        });
                    },
                    exit: function (v) {
                        expect(v).toStrictEqual(7);
                        expect(arguments).toHaveLength(1);
                        out.push(3);
                        return 4;
                    }
                }, (v) => __awaiter(void 0, void 0, void 0, function* () {
                    expect(v).toStrictEqual(2);
                    out.push(5);
                    yield new Promise((resolve) => setTimeout(resolve, 50));
                    out.push(6);
                    throw 7;
                }));
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
    test('error suppressed', () => __awaiter(void 0, void 0, void 0, function* () {
        const out = [];
        const result = yield (0, async_1.With)({
            enter: function () {
                return __awaiter(this, arguments, void 0, function* () {
                    expect(arguments).toHaveLength(0);
                    out.push(1);
                    yield new Promise((resolve) => setTimeout(resolve, 50));
                    return 2;
                });
            },
            // eslint-disable-next-line @typescript-eslint/promise-function-async
            exit: function (v) {
                return __awaiter(this, arguments, void 0, function* () {
                    expect(v).toStrictEqual(7);
                    expect(arguments).toHaveLength(1);
                    out.push(3);
                    return new Promise((resolve) => setTimeout(resolve, 100)).then(() => {
                        out.push(4);
                        return true;
                    });
                });
            }
        }, (v) => __awaiter(void 0, void 0, void 0, function* () {
            expect(v).toStrictEqual(2);
            out.push(5);
            yield new Promise((resolve) => setTimeout(resolve, 50));
            out.push(6);
            throw 7;
        }));
        expect(result.suppressed).toStrictEqual(true);
        expect(result.suppressed ? result.error : result.result).toStrictEqual(7);
        expect(out).toStrictEqual([
            1,
            5,
            6,
            3,
            4
        ]);
    }));
});
describe('Use', () => {
    test('success', () => __awaiter(void 0, void 0, void 0, function* () {
        var e_1, _a;
        const out = [];
        try {
            for (var _b = __asyncValues((0, async_1.Use)({
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
    test('success with async', () => __awaiter(void 0, void 0, void 0, function* () {
        var e_2, _d;
        const out = [];
        try {
            for (var _e = __asyncValues((0, async_1.Use)({
                enter: function () {
                    return __awaiter(this, arguments, void 0, function* () {
                        expect(arguments).toHaveLength(0);
                        out.push(1);
                        yield new Promise((resolve) => setTimeout(resolve, 50));
                        return 2;
                    });
                },
                exit: function () {
                    return __awaiter(this, arguments, void 0, function* () {
                        expect(arguments).toHaveLength(0);
                        out.push(3);
                        yield new Promise((resolve) => setTimeout(resolve, 50));
                    });
                }
            })), _f; _f = yield _e.next(), !_f.done;) {
                const v = _f.value;
                expect(v).toStrictEqual(2);
                out.push(4);
                yield new Promise((resolve) => setTimeout(resolve, 50));
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (_f && !_f.done && (_d = _e.return)) yield _d.call(_e);
            }
            finally { if (e_2) throw e_2.error; }
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
            var e_3, _g;
            try {
                try {
                    // eslint-disable-next-line no-unreachable-loop
                    for (var _h = __asyncValues((0, async_1.Use)({
                        enter: function () {
                            return __awaiter(this, arguments, void 0, function* () {
                                expect(arguments).toHaveLength(0);
                                out.push(1);
                                yield new Promise((resolve) => setTimeout(resolve, 50));
                                return 2;
                            });
                        },
                        exit: function () {
                            expect(arguments).toHaveLength(0);
                            out.push(3);
                            return 4;
                        }
                    })), _j; _j = yield _h.next(), !_j.done;) {
                        const v = _j.value;
                        expect(v).toStrictEqual(2);
                        out.push(5);
                        yield new Promise((resolve) => setTimeout(resolve, 50));
                        out.push(6);
                        throw 7;
                    }
                }
                catch (e_3_1) { e_3 = { error: e_3_1 }; }
                finally {
                    try {
                        if (_j && !_j.done && (_g = _h.return)) yield _g.call(_h);
                    }
                    finally { if (e_3) throw e_3.error; }
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
    test("after exit all callbacks would be called in the reverse order", () => __awaiter(void 0, void 0, void 0, function* () {
        const log = jest.fn(console.log);
        yield (0, async_1.With)(new async_1.ExitStack(), exitstack => {
            exitstack.callback(() => log("first"));
            exitstack.callback(() => log("second"));
            exitstack.callback(() => log("third"));
        });
        expect(log.mock.calls.length).toBe(3);
        expect(log.mock.calls[0][0]).toBe("third");
        expect(log.mock.calls[2][0]).toBe("first");
    }));
    test('with multiple errors the last error would be thrown', () => __awaiter(void 0, void 0, void 0, function* () {
        const buggycm = (0, index_1.contextmanager)(function* buggycm(id) {
            yield id;
            const msg = `there was an error in contextmanager[${id}]`;
            console.warn('Throwing: %s', msg);
            throw new Error(msg);
        });
        const exitstack = new async_1.ExitStack();
        for (let i = 1; i <= 3; i++) {
            yield exitstack.enterContext(buggycm(i));
        }
        yield (() => __awaiter(void 0, void 0, void 0, function* () {
            try {
                yield (0, async_1.With)(exitstack, () => {
                });
            }
            catch (e) {
                // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                expect(`${e}`).toStrictEqual("Error: there was an error in contextmanager[3]");
                return;
            }
            expect('didnt throw error').toEqual('threw error');
        }))();
    }));
    test('suppressed called with error', () => __awaiter(void 0, void 0, void 0, function* () {
        const es = new async_1.ExitStack();
        es.callback(() => true);
        expect(es._exitCallbacks).toHaveLength(1);
        expect(yield es.exit(undefined)).toStrictEqual(true);
        expect(es._exitCallbacks).toHaveLength(0);
    }));
    test('suppressed called without error', () => __awaiter(void 0, void 0, void 0, function* () {
        const es = new async_1.ExitStack();
        es.callback(() => true);
        expect(es._exitCallbacks).toHaveLength(1);
        expect(yield es.exit()).toStrictEqual(false);
        expect(es._exitCallbacks).toHaveLength(0);
    }));
    test('higher nested cm can swallow errors from lower ones', () => __awaiter(void 0, void 0, void 0, function* () {
        const es = new async_1.ExitStack();
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
        expect(yield es.exit(1)).toStrictEqual(true);
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
    }));
    test('error swallowing w/o having passed in an error wont return true', () => __awaiter(void 0, void 0, void 0, function* () {
        const es = new async_1.ExitStack();
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
        expect(yield es.exit()).toStrictEqual(false);
        expect(out).toStrictEqual([
            1,
            2,
            4,
            5,
            6,
            7
        ]);
    }));
});
//# sourceMappingURL=async.test.js.map