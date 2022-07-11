import { nullcontext } from '../src/helpers'
import {
    contextmanager,
    With,
    Use,
    ContextManagerBase,
    ExitStack,
} from '../src/contextlib'

describe("ContextManager - General Tests", ()=>{
    test("The value passed to the context body is the return value of the cm's enter method", () => {
        // regular cms
        var cm = {
            enter(){
                return "Value"
            }, exit(){}
        }
        With(cm, value=>{
            expect(value).toStrictEqual(cm.enter())
        })

        // generator cms
        var gencm = contextmanager(function*(value){
            yield value
        })("Value")

        With(gencm, value=>{
            expect(value).toStrictEqual("Value")
        })
    })
})

describe("Generator Context Managers", ()=>{
    test("contextmanagers must yield once and only once", () => {
        const nonYieldingGeneratorCM = contextmanager(function*(){});
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

    test("when there is an error in the context body, "+
    "it is throw right after the yield statement in the generator function", ()=>{
        var err: any = undefined

        function* generatorFn(){
            try {
                yield
            } catch(error){
                err = error
            }
        }
        expect(()=>With(contextmanager(generatorFn)(), ()=>{
            throw "this error would be thrown in the generator fn"
        })).toThrowError()
        expect(err).toBeDefined()
    })

    test("errors in the context body can be suppressed by catching the"+
    " error in the generator, then returning true", ()=>{
        var err: any = undefined

        function* generatorFn(){
            try {
                yield
            } catch(error){
                err = error
            } return true
        }
        expect(()=>With(contextmanager(generatorFn)(), ()=>{
            throw "this error would be thrown in the generator fn"
        })).not.toThrowError()
        expect(err).toBeDefined()
    })
})

describe("ExitStack", ()=>{
    test("An exitstack acts exactly like nested context managers", ()=>{
        const logA = jest.fn(console.log.bind(console, 'A')),
              logB = jest.fn(console.log.bind(console, "B")),

        cmA = contextmanager(function*(){
            yield "A"
            for (var a = 0; a <= 2; a++){
                logA()
            }
        }),
        cmB = contextmanager(function*(){
            yield "B"
            for (var b = 0; b <= 2; b++){
                logB()
            }
        });

        // nested context managers
        With(cmA(), ()=>{
            With(cmA(), ()=>{
                With(cmA(), ()=>{
                    With(cmA(), ()=>{
                        With(cmA(), ()=>{
                        })
                    })
                })
            })
        })

        // ExitStack
        With(new ExitStack(), stack => {
            stack.enterContext(cmB())
            stack.enterContext(cmB())
            stack.enterContext(cmB())
            stack.enterContext(cmB())
            stack.enterContext(cmB())
        })
        expect(logB.mock.calls.length).toEqual(logB.mock.calls.length);
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
        const buggycm = contextmanager(function*(program: string){
            try {
                yield program
            } catch(error){
                console.log("caught error: ", error)
                console.log("throwing error: ", program)
            } finally {
                throw program
            }
        });
        expect(() => With(new ExitStack, stack => {
            stack.enterContext(buggycm("heroku"))
            stack.enterContext(buggycm("git"))
            stack.enterContext(buggycm("nodejs"))
            stack.enterContext(buggycm("vscode"))
            
        })).toThrowError("heroku")
    })

    test("A cm can swallow up error from nested cms by returning true in it's exit method", ()=>{
        const info = jest.fn(console.log);
        const error = jest.fn(console.error);
        const buggycm = contextmanager(function*(program: string){
            try {
                yield program
            } catch(error){
                info("caught error: " + error)
            } finally {
                error("throwing error: " + program)
                throw program
            }
        });
        const parentcm = {
            enter: nullcontext.prototype.enter,
            exit: () => true
        }
        expect(() => With(new ExitStack, stack => {
            // swallow up error "heroku"
            stack.enterContext(parentcm)
            stack.enterContext(buggycm("heroku"))
            stack.enterContext(buggycm("git"))
            // swallow up error "nodejs"
            stack.enterContext(parentcm)
            stack.enterContext(buggycm("nodejs"))
            stack.enterContext(buggycm("vscode"))
        })).not.toThrowError()
        expect(info).toHaveBeenCalledTimes(2)
        expect(error).toHaveBeenCalledTimes(4)
        expect(error).toHaveBeenCalledWith("throwing error: vscode")
        expect(info).toHaveBeenCalledWith("caught error: vscode")
        expect(error).toHaveBeenCalledWith("throwing error: nodejs")
        expect(info).not.toHaveBeenCalledWith("caught error: nodejs") // nodejs is swallowed
        expect(error).toHaveBeenCalledWith("throwing error: git")
        expect(info).toHaveBeenCalledWith("caught error: git")
        expect(error).toHaveBeenCalledWith("throwing error: heroku")
        expect(info).not.toHaveBeenCalledWith("caught error: heroku") // heroku is swallowed
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
