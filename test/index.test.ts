import * as contextlib from '../src'
import { AsyncContextManager } from '../src'
import {ContextManager} from '../src/types'

test('imports', () => {
    expect(typeof contextlib.With).toBe('function')
})

test('cm is subset of async cm', () => {
    const cm: ContextManager<number> = {
        enter: () => 123,
        exit: err => {
        }
    }
    const acm: AsyncContextManager<number> = cm
    expect(acm.enter()).toEqual(123)
})
