# Handling Errors In Contexts

What happens when an error occurs in the contextbody? Well the error makes the context end prematurely, then the error is thrown.

**An Illustration**

```js
const manager = {
    doThis() {
    	throw "couldn't do this 💔";
    },
    enter() {
	    console.log("entering context");
    	return this;
    },
    exit() {
	    console.log("leaving context");
    }
}

With(manager, cm => {
    console.log("inside context");
    cm.doThis();
})

console.log("outside context");
```

```
entering context
inside context
leaving context

node:internal/process/esm_loader:94
    internalBinding('errors').triggerUncaughtException(
                              ^
couldn't do this 💔
(Use `node --trace-uncaught ...` to show where the exception was thrown)
```

## suppressing errors

When an error is thrown, it stops the execution of the whole program, not just the context. To prevent such errors from being thrown outside the context, all you have to do is to return `true` from the contextmanager's `exit()` method (<mark>the context would still be end due to the error</mark>)

```js
const manager = {
    doThis() {
    	throw "couldn't do this 💔";
    },
    enter() {
	    console.log("entering context");
    	return this;
    },
    exit() {
	    console.log("leaving context");
        return true;
    }
}

With(manager, cm => {
    console.log("inside context");
    cm.doThis();
})

console.log("outside context");
```

```
entering context
inside context
leaving context
outside context
```

**For generator contextmanagers, you **
