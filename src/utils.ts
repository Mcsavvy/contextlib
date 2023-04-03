const sentinel = Symbol('void')

export function getattr<T, R> (_obj: T, _key: string): R
export function getattr<T, R> (_obj: T, _key: string, _default: R): R

export function getattr<T> (_obj: T, _key: string, _default: unknown = sentinel): unknown {
    if (_key in (_obj as object)) { return (_obj as { [index: string]: unknown })[_key] } else if (_default !== sentinel) { return _default }
    throw `AttributeError: object has no attribute "${_key.toString()}"`
}
