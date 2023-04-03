

### Syntax

```js
const { With } = require("contextlib");

With(<contextmanager>, <contextbody>;
```

### @contextmanager

This can be an instance of a class or an object, as long as it implements an `enter()` and an `exit()` methods.
It can also be a [function](/docs/contextmanager.md).

```js
class Manager {
    enter() {
    /* do setup here, like fetching resources */
    }
    exit() {
    /* do cleanup here, like releasing resources */
    }
}

const manager = {
    enter() {
    /* do setup here, like fetching resources */
    },
    exit() {
    /* do cleanup here, like releasing resources */
    }
}
```

### @contextbody

This is a function that represents everything that'll be done in the context.

```js
With(new Manager(), () => {
    /* you're now within the context
       make use of the resources here
       and they'll automatically be released
       when this function returns
    */
    return whatever;
})
```

The `With` function passes the value returned from the contextmanager's `enter()` to this function as argument. This can be useful in a lot of situations

```js
class Manager {
    doThis() { ... }
    doThat() { ... }
    enter() { return this }
    exit() { ... }
}

With(new Manager(), manager => {
    manager.doThis();
    manager.doThat();
});
```

The `With` function returns an object like this

```ts
{completed: boolean, value: any}
```

where completed is `true` or `false` depending on is there was an error in the context or not. If the context completed with no error, then `value` would be the value returned from the context body, else `value` would be the error that made the context terminate.

> In case of an error, the With function only returns if the error was [suppressed](/docs/suppress.md)