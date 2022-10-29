"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getattr = void 0;
const sentinel = Symbol('void');
function getattr(_obj, _key, _default = sentinel) {
    if (_key in _obj) {
        return _obj[_key];
    }
    else if (_default !== sentinel) {
        return _default;
    }
    throw `AttributeError: object has no attribute "${_key.toString()}"`;
}
exports.getattr = getattr;
