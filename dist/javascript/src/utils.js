export function getattr(object, name, _default = null) {
    if (name in object) {
        return object[name];
    }
    else if (_default !== null)
        return _default;
    throw `AttributeError: ${object} has no attribute "${name}"`;
}
//# sourceMappingURL=utils.js.map