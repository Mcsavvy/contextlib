import {Use, ExitStack, With} from '../src/async'
import {contextmanager} from "../src";
import {Success} from '../src/types'

describe('With', () => {
    test('error', async () => {
        const out: any[] = []
        await (async () => {
            try {
                await With({
                    enter: async function () {
                        expect(arguments).toHaveLength(0)
                        out.push(1)
                        await new Promise((resolve) => setTimeout(resolve, 50))
                        return 2
                    },
                    exit: function (v) {
                        expect(v).toStrictEqual(7)
                        expect(arguments).toHaveLength(1)
                        out.push(3)
                        return 4
                    }
                }, async (v) => {
                    expect(v).toStrictEqual(2)
                    out.push(5)
                    await new Promise((resolve) => setTimeout(resolve, 50))
                    out.push(6)
                    throw 7
                })
            } catch (e) {
                out.push(8)
                expect(e).toStrictEqual(7)
                return
            }
            expect('didnt throw error').toEqual('threw error')
        })()
        expect(out).toStrictEqual([
            1,
            5,
            6,
            3,
            8
        ])
    })
    test('error suppressed', async () => {
        const out: any[] = []
        const result = await With({
            enter: async function () {
                expect(arguments).toHaveLength(0)
                out.push(1)
                await new Promise((resolve) => setTimeout(resolve, 50))
                return 2
            },
            // eslint-disable-next-line @typescript-eslint/promise-function-async
            exit: function (v) {
                expect(v).toStrictEqual(7)
                expect(arguments).toHaveLength(1)
                out.push(3)
                return new Promise((resolve) => setTimeout(resolve, 100)).then(() => {
                    out.push(4)
                    return true
                })
            }
        }, async (v) => {
            expect(v).toStrictEqual(2)
            out.push(5)
            await new Promise((resolve) => setTimeout(resolve, 50))
            out.push(6)
            throw 7
        })
        expect(result.suppressed).toStrictEqual(true)
        expect(result.suppressed ? result.error : (result as Success<number>).result).toStrictEqual(7)
        expect(out).toStrictEqual([
            1,
            5,
            6,
            3,
            4
        ])
    })
})

describe('Use', () => {
    test('success', async () => {
        const out: any[] = []
        for await (const v of Use({
            enter: function () {
                expect(arguments).toHaveLength(0)
                out.push(1)
                return 2
            },
            exit: function () {
                expect(arguments).toHaveLength(0)
                out.push(3)
            }
        })) {
            expect(v).toStrictEqual(2)
            out.push(4)
        }
        out.push(5)
        expect(out).toStrictEqual([
            1,
            4,
            3,
            5
        ])
    })
    test('success with async', async () => {
        const out: any[] = []
        for await (const v of Use({
            enter: async function () {
                expect(arguments).toHaveLength(0)
                out.push(1)
                await new Promise((resolve) => setTimeout(resolve, 50))
                return 2
            },
            exit: async function () {
                expect(arguments).toHaveLength(0)
                out.push(3)
                await new Promise((resolve) => setTimeout(resolve, 50))
            }
        })) {
            expect(v).toStrictEqual(2)
            out.push(4)
            await new Promise((resolve) => setTimeout(resolve, 50))
        }
        out.push(5)
        expect(out).toStrictEqual([
            1,
            4,
            3,
            5
        ])
    })
    test('error', async () => {
        const out: any[] = []
        await (async () => {
            try {
                // eslint-disable-next-line no-unreachable-loop
                for await (const v of Use({
                    enter: async function () {
                        expect(arguments).toHaveLength(0)
                        out.push(1)
                        await new Promise((resolve) => setTimeout(resolve, 50))
                        return 2
                    },
                    exit: function () {
                        expect(arguments).toHaveLength(0)
                        out.push(3)
                        return 4
                    }
                })) {
                    expect(v).toStrictEqual(2)
                    out.push(5)
                    await new Promise((resolve) => setTimeout(resolve, 50))
                    out.push(6)
                    throw 7
                }
            } catch (e) {
                out.push(8)
                expect(e).toStrictEqual(7)
                return
            }
            expect('didnt throw error').toEqual('threw error')
        })()
        expect(out).toStrictEqual([
            1,
            5,
            6,
            3,
            8
        ])
    })
})

describe('ExitStack', () => {
    test("after exit all callbacks would be called in the reverse order", async () => {
        const log = jest.fn(console.log);
        await With(new ExitStack(), exitstack => {
            exitstack.callback(() => log("first"))
            exitstack.callback(() => log("second"))
            exitstack.callback(() => log("third"))
        })
        expect(log.mock.calls.length).toBe(3)
        expect(log.mock.calls[0][0]).toBe("third")
        expect(log.mock.calls[2][0]).toBe("first")
    })
    test('with multiple errors the last error would be thrown', async () => {
        const buggycm = contextmanager(function* buggycm(id: number) {
            yield id;
            const msg = `there was an error in contextmanager[${id}]`;
            console.warn('Throwing: %s', msg);
            throw new Error(msg);
        });
        const exitstack = new ExitStack();
        for (let i = 1; i <= 3; i++) {
            await exitstack.enterContext(buggycm(i))
        }
        await (async () => {
            try {
                await With(exitstack, () => {
                })
            } catch (e) {
                // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                expect(`${e}`).toStrictEqual("Error: there was an error in contextmanager[3]")
                return
            }
            expect('didnt throw error').toEqual('threw error')
        })()
    })
    test('suppressed called with error', async () => {
        const es = new ExitStack()
        es.callback(() => true)
        expect(es._exitCallbacks).toHaveLength(1)
        expect(await es.exit(undefined)).toStrictEqual(true)
        expect(es._exitCallbacks).toHaveLength(0)
    })
    test('suppressed called without error', async () => {
        const es = new ExitStack()
        es.callback(() => true)
        expect(es._exitCallbacks).toHaveLength(1)
        expect(await es.exit()).toStrictEqual(false)
        expect(es._exitCallbacks).toHaveLength(0)
    })
    test('higher nested cm can swallow errors from lower ones', async () => {
        const es = new ExitStack()
        const out: any[] = []
        es.callback(function () {
            out.push(14)
            expect(arguments).toHaveLength(0)
            out.push(15)
        })
        es.callback(err => {
            out.push(12)
            expect(err).toStrictEqual(11)
            out.push(13)
            return true
        })
        es.callback(function () {
            out.push(9)
            expect(arguments).toHaveLength(0)
            out.push(10)
            throw 11
        })
        es.callback(err => {
            out.push(7)
            expect(err).toStrictEqual(1)
            out.push(8)
            // suppress
            return true
        })
        es.callback(err => {
            out.push(4)
            expect(err).toStrictEqual(1)
            out.push(5)
            throw 6
        })
        es.callback(err => {
            out.push(2)
            expect(err).toStrictEqual(1)
            out.push(3)
            return false
        })
        expect(await es.exit(1)).toStrictEqual(true)
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
        ])
    })
    test('error swallowing w/o having passed in an error wont return true', async () => {
        const es = new ExitStack()
        const out: any[] = []
        es.callback(err => {
            out.push(6)
            expect(err).toStrictEqual(3)
            out.push(7)
            return true
        })
        es.callback(err => {
            out.push(4)
            expect(err).toStrictEqual(3)
            out.push(5)
            return false
        })
        es.callback(function () {
            out.push(1)
            expect(arguments).toHaveLength(0)
            out.push(2)
            throw 3
        })
        expect(await es.exit()).toStrictEqual(false)
        expect(out).toStrictEqual([
            1,
            2,
            4,
            5,
            6,
            7
        ])
    })
})
