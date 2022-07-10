/**
 * An async implementation of With.
 */
export async function With(manager, body) {
    const val = await manager.enter();
    let result;
    try {
        result = { result: await body(val) };
    }
    catch (error) {
        if (await manager.exit(error) !== true) {
            throw error;
        }
        return {
            error,
            suppressed: true
        };
    }
    await manager.exit();
    return result;
}
/**
 * An async implementation of Use.
 * It differs in that, due to the limitations of JS generators, exit will not
 * be awaited.
 */
export async function* Use(manager) {
    const val = await manager.enter();
    try {
        yield val;
    }
    finally {
        // unfortunately there does not appear to be any way to get this to block on promises
        manager.exit();
    }
}
/**
 * An async implementation of ExitStack.
 */
export class ExitStack {
    constructor() {
        this._exitCallbacks = [];
    }
    enter() {
        return this;
    }
    async exit(error) {
        const hasError = arguments.length !== 0;
        let suppressed = false;
        let pendingRaise = false;
        // callbacks are invoked in LIFO order to match the behaviour of
        // nested context managers
        while (this._exitCallbacks.length !== 0) {
            const cb = this._exitCallbacks.pop();
            if (cb === undefined) {
                continue;
            }
            try {
                const cbResult = !pendingRaise && (suppressed || !hasError) ? await cb() : await cb(error);
                if (cbResult === true) {
                    suppressed = true;
                    pendingRaise = false;
                    error = undefined;
                }
            }
            catch (e) {
                suppressed = false;
                pendingRaise = true;
                error = error || e;
            }
        }
        if (pendingRaise) {
            throw error;
        }
        return hasError && suppressed;
    }
    callback(cb) {
        this._exitCallbacks.push(cb);
    }
    push(cm) {
        this.callback(cm.exit.bind(cm));
    }
    async enterContext(cm) {
        const result = await cm.enter();
        this.push(cm);
        return result;
    }
    popAll() {
        const stack = new ExitStack();
        stack._exitCallbacks = this._exitCallbacks;
        this._exitCallbacks = [];
        return stack;
    }
}
//# sourceMappingURL=async.js.map