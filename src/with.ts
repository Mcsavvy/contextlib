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

import {
    GeneratorContextManager,
    AsyncGeneratorContextManager
} from './generatorcm'

import {
    ContextManager,
    AsyncContextManager,
    WithResult
} from './types'

type ContextBody<ArgT, ReturnT> = (...args: [ArgT]) => ReturnT
type AsyncContextBody<ArgT, ReturnT> = (...args: [ArgT]) => PromiseLike<ReturnT> | ReturnT

/**
 * With - handles entering and exiting a context
 *
 * @param manager the context manager for this context
 * @param body a function that'll be used as contextmanager's
 * body
 * @returns {WithResult} an object that shows the status of the context
 * at exit
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
    if (cm['enter'] == undefined)
        throw Error(`contextmanager has no enter() method`)
    if (cm['exit'] == undefined)
        throw Error(`contextmanager has no exit() method`)

    const contextvar = cm.enter()
    try {
        const ret = body(contextvar)
        cm.exit()
        return {
            completed: true,
            value: ret
        }
    } catch (error) {
        if (cm.exit(error) !== true) { throw error }
        return {
            completed: false,
            value: error
        }
    }
}

/**
 * Use constructs a generator that may be used to fulfil the same role as With,
 * though without the suppression or error handling capabilities.
 * 
 * @param {ContextManager<T>} manager
 * @returns {Generator<T>} a generator function that yields the value
 * returned from the context manager's enter()
 */
function * Use<T> (manager: ContextManager<T>): Generator<T> {
    const val = manager.enter()
    try {
        yield val
    } finally {
        // TODO: block on promises
        manager.exit()
    }
}

/**
 * An async implementation of Use.
 * It differs in that, due to the limitations of JS generators, exit will not
 * be awaited.
 *
 * Use constructs a generator that may be used to fulfil the same role as With,
 * though without the suppression or error handling capabilities.
 *
 * @param {ContextManager<T>} manager
 * @returns {Generator<T>} a generator function that yields the value
 * returned from the context manager's enter()
 */
async function * useAsync<T> (manager: AsyncContextManager<T>): AsyncGenerator<T> {
    const val = await manager.enter()
    try {
        yield val
    } finally {
        // unfortunately there does not appear to be any way to get this to block on promises
        await manager.exit()
    }
}

/**
 * An async implementation of With.
 * Handles entering and exiting a context
 *
 * @param manager the context manager for this context
 * @param body a function that'll be used as contextmanager's
 * body
 * @returns {WithResult} an object that shows the status of the context
 * at exit
 * */
async function withAsync<T, R = unknown> (
    manager: AsyncContextManager<T> | AsyncGenerator<T>,
    body: AsyncContextBody<T, R> | ContextBody<T, R>
): Promise<WithResult<R>> {
    let cm: AsyncContextManager<T>
    if (typeof (manager as AsyncGenerator<T>).throw == 'function') {
        cm = new AsyncGeneratorContextManager(manager as AsyncGenerator<T>)
    } else {
        cm = manager as AsyncContextManager<T>
    }
    if (cm['enter'] == undefined)
        throw Error(`contextmanager has no enter() method`)
    if (cm['exit'] == undefined)
        throw Error(`contextmanager has no exit() method`)
    const contextvar = await cm.enter()
    try {
        const ret = await body(contextvar)
        await cm.exit()
        return {
            completed: true,
            value: ret
        }
    } catch (error) {
        if (await cm.exit(error) !== true) {
            throw error
        }
        return {
            completed: false,
            value: error
        }
    }
}

export {With, withAsync, Use, useAsync }