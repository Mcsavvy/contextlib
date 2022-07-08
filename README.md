# Contextlib
JS implementation of python's context managers. **_With 💙 { `...` }_**

Have you been waiting on this too? Probably you thought of implementing it yourself.
_Well_ here's the thing "context managers are even better with Javascript!" check this out...

```js
class SocketManager{
    constructor(host, port){
        this.socket = new Socket(host, port)
    }

    enter() {
        this.socket.open();
        console.log('Opened socket.')
        return this.socket
    }

    exit(){
        this.socket.close()
        console.log('closed socket.')
    }
}

With(new SocketManager('localhost', 5000), socket => {
    // do something with <socket>
})
```
```bash
Opened socket.
Closed socket.
```

Installation
------------
> npm install contextlib


Usage
-----
#### What are context managers?
Context managers are resource managers that allow you to allocate and release resources precisely when you want to.

**Put Simply**: You tell them what to do at the beginning and at the end and they make sure they do it no matter what happens - _Even an Exception is not an exception_.

#### What do you need them for?
The list is endless but here are some common uses of CMs

+ Closing files after usage
+ Close sockets after usage
+ Suppressing silly exceptions
+ Logging errors to a file...

#### let's create one!
CMs are regular classes that implement these two methods `enter` and `exit`.
```js
class context:
    enter(){
        console.log("Entering context")
        // return anything
    }

    exit(error){
        console.log("Leaving context")
    }
```
Now we have our context manager or CM, we can use our `With` function.

With
----
The With function accepts a CM as first argument and a callback as second argument. The callback would represent the body of the context.

The value returned from the context manager's `enter` method is passed to the callback as argument.


```js
With(context, function(value){
    // the body of the context goes here
    console.log("Inside context")
})
```
```bash
Entering context
Inside context
Leaving context
```
Generator Functions as CMs
----------------------------
Do you know you can also use generator functions as CMs, as long as the yield only once.
All you have to do is to wrap the function with `contextmanager`
```js
function* genfunc(<args>){
    console.log("Entering context")
    yield value
    console.log("Leaving context")
}
var contextmanager = contextmanager(genfunc)(..args)
```
The value yield from the genfunc would
be passed to the body function.

Any error raised in the body function would be thrown in the genfunc at the point it yielded.
So to make sure we release our resources, we'll use a `try-finally` block.
```js
function* generator(<args>){
    try {
        console.log("Entering context")
        yield value
        // any error in the body function
        // is raised here
    }
    finally {
        console.log("Leaving context")
    }
    
}
var contextmanager = contextmanager(generator)(..args)
```
> Any error thrown in the body function would be re-raised after the `With` function returns. To avoid this, you can suppress the error in the genfunc using a `try-catch` block instead.

Handling Multiple Contexts
--------------------------
If you're going to be using a couple of context managers and want to avoid nesting multiple `With` functions,
you can use an `ExitStack`

ExitStack is a context manager that manages a stack of context managers.
It can be used to manage multiple nested context managers.

All context managers are entered in the order they are pushed.
Their exit methods are called in the reverse order (LIFO).

When an error is raise in the body of an exit stack or one of its context managers,
the error propagates to the next context manager's `exit` method until it is handled.
If the error is not handled, it is raised when the ExitStack exits.

Also, the ExitStack accepts callbacks that are called when the ExitStack exits.
These callbacks are invoked with any error raised in the ExitStack's `exit` method,
so they can be used to handle errors or clean up resources.

```js
With(new ExitStack(), exitstack => {
  exitstack.enterContext(<contextmanager>)
  exitstack.push(<exitmethod>)
  exitstack.callback(<callback>)
  // on exit, the exitstack will invoke these in reverse order
})
```

##### Features
+ Written in typescript
+ Transpiled to javascript
+ Typescript support for 'contextlib.js'
+ JSDoc comments on all classes, methods, functions and parameters
+ Comprehensive tests using jest

##### Exports
+ With (_default export_)
+ ContextManagerBase
+ ExitStack
+ GeneratorCM
+ contextmanager
+ nullcontext
+ timed
+ closing
+ suppress
