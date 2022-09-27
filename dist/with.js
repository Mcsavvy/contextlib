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
import { getattr } from "./utils.js";
/**
 * With - handles entering and exiting a context
 *
 * @param manager the context manager for this context
 * @param body a function that'll be used as contextmanager's
 * body
 * */
function With(manager, body) {
    getattr(manager, "enter");
    getattr(manager, "exit");
    const contextvar = manager.enter();
    try {
        var ret = body(contextvar);
        manager.exit();
        return { Return: ret };
    }
    catch (error) {
        if (manager.exit(error) !== true)
            throw error;
        return { Error: error };
    }
}
export default With;
//# sourceMappingURL=with.js.map