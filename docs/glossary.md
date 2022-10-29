context
-------
The circumstances surrounding a block of code being executed. A context consists of a [manager](#contextmanager) and a [body](#contextbody).

contextmanager
--------------
An instance of a class or an object that implements an `enter()` and an `exit()` method.

```js
// Class contextmanager
class Manager {
    enter() {
        /* do setup here, like fetching resources */
    }
    exit() {
        /* do cleanup here, like releasing resources */
    }
}

// Object contextmanager
const manager = {
    enter() {
        /* do setup here, like fetching resources */
    },
    exit() {
        /* do cleanup here, like releasing resources */
    }
}
```
> The variation of contextmanagers created using functions are called [generator contextmanagers](#generator-contextmanager)

contextbody
----------
A contextbody is a callback function. This function represents everything to be done within the [context](#context).

```js
function body() {
    /**
     * everything inside this function
     * would be executed within the context.
    */
   return whatever;
}

With(new Manager(), body);
```

**You can optionally use arrow functions**

```js
With(new Manager(), () => {
    /* within context */
})
```


generator contextmanager
------------------------
A variation of contextmanagers built using [generator functions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function*). All generator contextmanagers **must yield once and only once**.

<u>**A simple generator context manager**</u>

```js
function* manager() {
    /* Setup before the yield statement */
    console.log("setting up...");
    yield;
    /* Perform cleanup after the yield statement*/
    console.log("cleaning up...");
}

With(manager(), () => {
    console.log("within context.")
})
```

**Output**

```
setting up...
within context.
cleaning up...
```

### Error Bubbling
The `catch` statement in Javascript lets you handle an error that gets thrown. If you don't catch the error, then the error **bubles up**(or down, depending on how you view the call stack) until it reaches the first called function and there it will crash the program.