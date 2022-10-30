/* eslint-disable import/no-unresolved */
/**
 * The with function manages context by entering a given contextmanager
 * on invocation and exiting it on return.
 *
 * It accepts two arguments
 * - a contextmanager
 * - a context body
 *
 * The context body is a callback function that would be invoked in
 * the context of the contextmanager.
 *
 * The contextbody is invoked with whatever value was returned from calling
 * the contextmanager's "enter" method.
 *
 * Any error raise in the context body is passed to the contextmanager's
 * "exit" method for handling. Such error would be suppressed if the "exit"
 * method returns true.
 */

import { GeneratorContextManager } from './generatorcm.js'
import {
    ContextManager,
    WithResult
} from './types.js'


type ContextBody<ArgT, ReturnT> = (...args?: [ArgT]) => ReturnT

/**
 * With - handles entering and exiting a context
 *
 * @param manager the context manager for this context
 * @param body a function that'll be used as contextmanager's
 * body
 * */
function With<T, R = unknown> (
    manager: ContextManager<T> | Generator<T>,
    body: ContextBody<T, R>
): WithResult<R> {
    let cm: ContextManager<T>
    if (typeof (manager as Generator<T>).throw == 'function') {
        cm = new GeneratorContextManager(manager as Generator<T>)
    } else {
        cm = manager as ContextManager<T>
    }
    if (cm.enter == undefined)
        throw Error("Attribute Error: Object has no enter()")
    if (cm.exit == undefined)
        throw Error("Attribute Error: Object has no exit()")

    const contextvar = cm.enter()
    try {
        const ret = body(contextvar)
        cm.exit()
        return {
            completed: true,
            value: ret
        }
    } catch (error) {
        if (!(cm.exit(error) ?? false)) { throw error }
        return {
            completed: false,
            value: error
        }
    }
}

export default With
