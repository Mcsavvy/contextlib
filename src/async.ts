import {Result as WithResult, Success as WithSuccess} from './with'

/**
 * An async variant (and superset) of ContextManager<T>.
 */
export interface ContextManager<T = unknown> {
    enter: () => Promise<T> | T
    exit: (err?: unknown) => unknown
}

/**
 * An async implementation of With.
 */
export async function With<T, R = unknown>(manager: ContextManager<T>, body: (val: T) => Promise<R>): Promise<WithResult<R>> {
    const val = await manager.enter()
    let result: WithSuccess<R> | undefined
    try {
        result = {result: await body(val)}
    } catch (error) {
        if (!await manager.exit(error)) {
            throw error
        }
        return {
            error,
            suppressed: true
        }
    }
    await manager.exit()
    return result
}

/**
 * An async implementation of Use.
 * It differs in that, due to the limitations of JS generators, exit will not
 * be awaited.
 */
export async function* Use<T>(manager: ContextManager<T>): AsyncGenerator<T> {
    const val = await manager.enter()
    try {
        yield val
    } finally {
        // unfortunately there does not appear to be any way to get this to block on promises
        manager.exit()
    }
}

/**
 * An async implementation of ExitStack.
 */
export class ExitStack implements ContextManager<ExitStack> {
    _exitCallbacks: Array<(error?: unknown) => unknown>

    constructor() {
        this._exitCallbacks = [];
    }

    enter(): ExitStack {
        return this
    }

    async exit(error?: unknown): Promise<boolean> {
        let suppressed = false
        let pendingRaise = false
        while (true) {
            const cb = this._exitCallbacks.pop()
            if (cb === undefined) {
                break
            }
            try {
                if (await cb(error)) {
                    suppressed = true
                    pendingRaise = false
                    error = undefined
                }
            } catch (e) {
                pendingRaise = true;
                error = error || e
            }
        }
        if (pendingRaise) {
            throw error
        }
        return arguments.length !== 0 && suppressed
    }

    callback(cb: (error?: unknown) => unknown) {
        this._exitCallbacks.push(cb)
    }

    push(cm: ContextManager) {
        this.callback(cm.exit.bind(cm))
    }

    async enterContext<T>(cm: ContextManager<T>): Promise<T> {
        const result = await cm.enter()
        this.push(cm)
        return result
    }

    popAll(): ExitStack {
        const stack = new ExitStack();
        stack._exitCallbacks = this._exitCallbacks;
        this._exitCallbacks = [];
        return stack
    }
}
