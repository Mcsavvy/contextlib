import * as contextlib from '../src'

test('imports', () => {
    expect(typeof contextlib.With).toBe('function')
})
