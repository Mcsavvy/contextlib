import {
    contextmanager,
    With,
    Use,
    ContextManagerBase,
    ExitStack,
    suppress,
    timed,
    closing
} from '../src/contextlib'

test("Generator contextmanagers must yield once", () => {
    const nonYieldingGeneratorCM = contextmanager(function*(){

    });
    const multiYieldingGeneratorCM = contextmanager(function*(){
        yield 1;
        yield 2;
    })
    expect(() => {
        With(nonYieldingGeneratorCM(), ()=>{})
    }).toThrow("Generator did not yield!")

    expect(() => {
        With(multiYieldingGeneratorCM(), ()=>{})
    }).toThrow("Generator did not stop!")
})

test("Once an exitstack exits, all callbacks would be called in the reverse order", ()=>{
    const log = jest.fn(console.log);
    With(new ExitStack(), exitstack => {
        exitstack.callback(() => log("first"))
        exitstack.callback(() => log("second"))
        exitstack.callback(() => log("third"))
    })
    expect(log.mock.calls.length).toBe(3)
    expect(log.mock.calls[0][0]).toBe("third")
    expect(log.mock.calls[2][0]).toBe("first")
})


test(`When multiple errors occur in an exitstack, the last error would be thrown`, () => {
    const buggycm = contextmanager(function* buggycm(id: number){
        yield id;
        const msg = `there was an error in contextmanager[${id}]`;
        console.warn('Throwing: %s', msg);
        throw new Error(msg);
    });
    const exitstack = new ExitStack();
    for (let i=1; i <= 3; i++) {
        exitstack.enterContext(buggycm(i))
    };
    expect(()=>{
        With(exitstack, ()=>{})
    }).toThrow("there was an error in contextmanager[3]")
})

test('Any error in a context body would be thrown in the context manager', () => {
    const cm = contextmanager(function* () {
        let error: Error | undefined;
        try {
            yield;
        } catch (e) {
            error = e as Error
        }
        expect(error).toBeDefined()
        expect((error as Error).message).toBe("this error was throw in the body")
    })
    With(cm(), () => {
        throw new Error("this error was throw in the body")
    })
})

test('Any error in the context body would be suppressed if the cm\'s exit method returns a true value', () => {
    class truthycm extends ContextManagerBase{
        exit() {return true}
    }
    expect(() => {
        With(new truthycm, () => {
            throw new Error("this error would be suppressed")
        })
    }).not.toThrowError();

    // you can also use a generator cm
    const truthycm_ = contextmanager(function*(){
        try {
            yield
        } finally {
            return true
        }
    });

    expect(() => {
        With(truthycm_(), () => {
            throw new Error("this error would be suppressed")
        })
    }).not.toThrowError()
})

test("suppress", ()=>{
    expect(() => {
        With(suppress(SyntaxError), ()=>{
            throw new SyntaxError()
        })
    }).not.toThrowError()
})

test("timed", ()=> {
    const timelogger = jest.fn((time: number) => {
        const date = new Date(time),
            hours = date.getUTCHours().toString().padStart(2, '0'),
            minutes = date.getUTCMinutes().toString().padStart(2, '0'),
            seconds = date.getUTCSeconds().toString().padStart(2, '0'),
            milliseconds = date.getUTCMilliseconds().toString().padStart(3, '0');
        return `${hours}:${minutes}:${seconds}:${milliseconds}`;
    })
    With(timed(timelogger), ()=>{});
    expect(typeof timelogger.mock.calls[0][0]).toBe('number');
    expect(timelogger.mock.results[0].value).toMatch(/\d{2}:\d{2}:\d{2}:\d{3}/)
})

test("closing", ()=>{
    const close = jest.fn();
    const closingThing = {
        close: function(){
            close()
        }
    }
    With(closing(closingThing), ()=>{})
    expect(close.mock.calls.length).toBe(1);
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
    test('error', async () => {
        const out: any[] = []
        await (async () => {
            try {
                // eslint-disable-next-line no-unreachable-loop
                for (const v of Use({
                    enter: function () {
                        expect(arguments).toHaveLength(0)
                        out.push(1)
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
    test('suppressed called with error', () => {
        const es = new ExitStack()
        es.callback(() => true)
        expect(es._exitCallbacks).toHaveLength(1)
        expect(es.exit(undefined)).toStrictEqual(true)
        expect(es._exitCallbacks).toHaveLength(0)
    })
    test('suppressed called without error', () => {
        const es = new ExitStack()
        es.callback(() => true)
        expect(es._exitCallbacks).toHaveLength(1)
        expect(es.exit()).toStrictEqual(false)
        expect(es._exitCallbacks).toHaveLength(0)
    })
    test('higher nested cm can swallow errors from lower ones', () => {
        const es = new ExitStack()
        const out: any[] = []
        es.callback(function() {
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
        es.callback(function() {
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
        expect(es.exit(1)).toStrictEqual(true)
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
    test('error swallowing w/o having passed in an error wont return true', () => {
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
        expect(es.exit()).toStrictEqual(false)
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
