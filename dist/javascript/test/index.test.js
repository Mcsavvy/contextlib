import * as contextlib from '../src';
test('imports', () => {
    expect(typeof contextlib.With).toBe('function');
});
test('cm is subset of async cm', () => {
    const cm = {
        enter: () => 123,
        exit: err => {
        }
    };
    const acm = cm;
    expect(acm.enter()).toEqual(123);
});
//# sourceMappingURL=index.test.js.map