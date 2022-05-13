import {contextmanager, With, ContextManagerBase, ExitStack, suppress, timed, closing} from '../src/contextlib'

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
