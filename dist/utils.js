const sentinel = Symbol('void');
export function getattr(__obj, __key, __default = sentinel) {
    if (__key in __obj)
        return __obj[__key];
    else if (__default !== sentinel)
        return __default;
    throw `AttributeError: object has no attribute "${__key.toString()}"`;
}
//# sourceMappingURL=utils.js.map