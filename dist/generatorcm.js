/**
 * Create a contextmanager using a generator function.
 * The function must yield only once, and the value yielded
 * would be passed as argument to the context body.
 *
 * After the context body returns,
 * the generator function is entered once again;
 * this time, the generator function should clean up
 * just like an "exit" method would.
 *
 * Any error thrown in the context body would be through
 * inside the generator function, at the point where it yielded.
 * This error can be handled using a `try-finally` block.
 */
class GeneratorContextManager {
    constructor(gen) {
        this.gen = gen;
        this._yielded = false;
    }
    enter() {
        // prevent a generator cm from being re-entered
        if (this._yielded)
            throw 'cannot re-enter a generator contextmanager';
        var { value, done } = this.gen.next();
        this._yielded = true;
        if (done)
            throw Error('Generator did not yield!');
        return value;
    }
    exit(error) {
        const hasError = arguments.length > 0;
        if (!hasError) {
            var { value, done } = this.gen.next();
            if (done)
                return false;
            else
                throw "Generator did not stop!";
        }
        else {
            // reraise the error inside the generator
            try {
                var { value, done } = this.gen.throw(error);
            }
            catch (err) {
                /**
                 * only re-throw an error if it's not the same error that
                 * was passed to throw(), because exit() must not raise
                 * an error unless exit() itself failed.
                 */
                if (err === error)
                    return false;
                throw err;
            }
            // suppress the error if it was suppressed in the generator
            if (!done)
                throw "Generator did not stop!";
            return true;
        }
        ;
    }
}
/**
 * transform a generator function into a contextmanager
 * @param func a generator function
 * @returns a wrapper around func which returns a contextmanager when called
 */
function contextmanager(func) {
    function wrapper(...args) {
        const gen = func(...args);
        return new GeneratorContextManager(gen);
    }
    return wrapper;
}
export default contextmanager;
export { GeneratorContextManager };
//# sourceMappingURL=generatorcm.js.map