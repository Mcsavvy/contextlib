/**@alias Error */
type ErrorType = Error;
/**this function is called whe the context is being left
 * if an error is throw in the context body, the error
 * is passed to this method. return a true value to suppress
 * the error
 */
type exit = (...error: [ErrorType?]) => any;
/**this function is called when the context is entered, the return value is
 * passes to the context body as argument
 */
type enter<T> = (...args: []) => T;

/**
 * Context managers are resource managers that allow you
 * to allocate and release resources precisely when you want to.
 * 
 * A context manager can be any class or object, as long
 * as it correctly implemets the 'enter' and 'exit' method
 */
interface ContextManager<T=any> {
    /**this method is called when the context is being entered, the return value is
     * passes to the context body as argument
     */
    enter: enter<T>;
    /**this method is called whe the context is being left
     * if an error is throw in the context body, the error
     * is passed to this method. return a true value to suppress
     * the error
     */
    exit: exit;
}
/**A generator */
type gen<T> = Generator<T, any>
/**This function yield a generator when called with <args>? */
type genFunc<T, Y extends any[]> = (...args: Y) => gen<T>
/**This is the body of a context,
 * it accepts the value returned from the contextmanager's
 * 'enter' method*/
type body<T> = (...args: [T?]) => void


declare function With<T>(manager: ContextManager<T>, body: body<T>): void


declare class ContextManagerBase implements ContextManager<ContextManagerBase>{
    enter: enter<ContextManagerBase>;
    exit: exit;
}


export class ExitStack extends ContextManagerBase {
    _exitCallbacks: exit[];
    _makeExitWrapper(cb: Function): exit;
    new(): ExitStack;
    callback(cb: Function): exit;
    push(cm: ContextManager): void;
    enterContext<T>(cm: ContextManager<T>): T;
    popAll(): ExitStack;
}


declare class GeneratorCM<T> implements ContextManager<T> {
    gen: gen<T>;
    new(gen: gen<T>): GeneratorCM<T>;
    enter: enter<T>;
    exit: exit;
}

declare function contextmanager<T,Y extends any[]>(func: genFunc<T,Y>): (...args: Y) => GeneratorCM<T>;

declare class nullcontext implements ContextManager<void> {
    enter: enter<void>;
    exit: exit;
}

declare function timed<T>(): GeneratorCM<T>;

declare function closing<T>(thing: T): GeneratorCM<T>;

declare function suppress(errors: typeof Error[]): any;