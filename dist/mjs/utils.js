const sentinel = Symbol('void');
export function getattr(_obj, _key, _default = sentinel) {
    if (_key in _obj) {
        return _obj[_key];
    }
    else if (_default !== sentinel) {
        return _default;
    }
    throw `AttributeError: object has no attribute "${_key.toString()}"`;
}
