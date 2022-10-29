# First class context managers

Usually, when you [create](/docs/with.md) a context manager, you're either using a class or an object, but it's possible to use functons too; a special type of function called generator function.

## What are generator functions?

Generator functions allow us to create a computed iterable.

To illustrate, if you wanted to create a range function that'll iterate from say, `x` to `y` incrementing by `z` each time, you'll do this

```js
function* range(start, stop, step) {
    for (var i = start; i < stop; i += step)
    yield i;
}

for (var x of range(10, 100, 5))
    console.log(x);
```

```
10
15
20
25
...
100
```

> Note: Above we used `function*` instead of `function`

## Generator context managers

For a generator function to be used as a context manager, it has to meet some requirements

* It must `yield` exactly once

* It must `yield` exactly once

* It must `yield` exactly once

### Context manager lifecycle methods?

How do we control the lifecycle of the cm through a generator function?

#### **Everything before `yield` is considered as `enter()`**

Yeah, that's true. Everything in the generator function that appears before the yield is used as setup, before entering the context body.

```js
class Socket {
    bind(addr, port) { ... }
    listen() { ... }
    disconnect() { ... }
}

function* socket(host, port)
{
    const newSocket = new Socket();
    newSocket.bind(host, port);
    /* more stuffs... */

    yield;
}
```

#### The yielded value is passed to the context body

Let's say you were implementing a socket contextmanager using a generator function, you'll need a way to pass the created socket into the context body right? You can do this by yielding the socket and it'll be automatically passed to the context body.

```js
function* socket(host, port)
{
    const newSocket = new Socket();
    newSocket.bind(host, port);
    /* more stuffs... */

    yield newSocket;
}
```

#### Tear down after the yield statement

You can perform cleanup after the yield statement.

```js
function* socket(host, port)
{
    const newSocket = new Socket();
    newSocket.bind(host, port);
    /* more stuffs... */

    yield newSocket;

    newSocket.disconnect();
}
```

In a manager's `exit()` method, you have the ability to handle errors, and this is also true for a generator cm, by using the `try-finally` method.

> Every error thrown in the context body, would be thrown in the generator function, right after the `yield` statement.

```js
function* socket(host, port)
{
    const newSocket = new Socket();
    newSocket.bind(host, port);
    /* more stuffs... */

    try {
        yield newSocket;
    } finally {
        newSocket.disconnect();
    }
}

With(socket("localhost", 8080), sock => {
    try {
        sock.listen();
    } catch (error)
        throw error
    }
})
```

### The `contextmanager()` decorator

This function is used under the hood to convert your generator function into a context manager. You might never need to explicitly use it, but in case you need to, then you can use it like this

```js
import { contextmanager } from "contextlib";

const socketmanager = contextmanager(socket);
const localhost = socketmanager("localhost", 8080);


With(localhost, socket => {
    try {
        sock.listen();
    } catch (error)
        throw error
    }
})
```
