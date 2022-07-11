

export function getattr<T>(object: T, name: string, _default=null){
    if (name in object){
        return object[name]
    } else if (_default !== null) return _default;
    throw `AttributeError: ${object} has no attribute "${name}"`
}