import * as contextlib from '../index'

test('imports', () => {
    expect(typeof contextlib.With).toBe('function')
})

test('cm is subset of async cm', () => {
    const cm: contextlib.ContextManager<number> = {
        enter: () => 123,
        exit: err => {
        }
    }
    const acm: contextlib.AsyncContextManager<number> = cm
    expect(acm.enter()).toEqual(123)
})
