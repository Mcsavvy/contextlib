import * as contextlib from '../src'
import { AsyncContextManager } from '../src'
import { ContextManager } from '../src/types'
import With from '../src/contextlib'

test('imports', () => {
    expect(typeof With).toBe('function')
})
