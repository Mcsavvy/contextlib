import {closing, suppress, timed} from '../src/helpers'
import With from "../src/index"

describe('closing', () => {
    test('async close', async () => {
        const out: unknown[] = []
        const closer = {
            // eslint-disable-next-line @typescript-eslint/promise-function-async
            close: () => {
                out.push(1)
                return new Promise((resolve) => setTimeout(resolve, 100)).then(() => {
                    out.push(2)
                    return 3
                })
            },
            wat: () => 4
        }
        const cm = closing(closer)
        const val = cm.enter()
        expect(val).toBe(closer)
        expect(out).toStrictEqual([])
        const p = cm.exit()
        expect(out.splice(0, out.length)).toStrictEqual([1])
        expect(await p).toStrictEqual(3)
        expect(out.splice(0, out.length)).toStrictEqual([2])
    })
})

describe("suppress", () => {
    test("string => string", ()=>{
        expect(()=>With(suppress("test"), ()=>{
            throw "test"
        })).not.toThrow()
    })
    test("string => error object", ()=>{
        expect(()=>With(suppress("test"), ()=>{
            throw new Error("test")
        })).not.toThrow()
    })
    test("regexp => string", ()=>{
        expect(()=>With(suppress(/^tes?./), ()=>{
            throw "test"
        })).not.toThrow()
    })
    test("regexp => error object", ()=>{
        expect(()=>With(suppress(/^tes?./), ()=>{
            throw new Error("test")
        })).not.toThrow()
    })
    test("error constructor => error object", ()=>{
        class NewError extends Error {}

        expect(()=>With(suppress(Error), ()=>{
            throw new NewError("test")
        })).not.toThrow()
    })
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
    expect(close).toHaveBeenCalled();
})