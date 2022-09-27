# Contextlib

### ⚙ JavaScript Context Managers

Context managers are resource managers that handle the allocating and release of resource unconditionally.

---

### A Simple Example

```javascript
class Socket {
    constructor(host, port) {
        this.host = host;
        this.port = port;
    }

    enter() {
        console.log('opened socket.');
        return this;
    }

    exit(){
        console.log('closed socket.');
    }
}

With(new Socket('127.0.0.1', 5000), socket => {
        console.log("serving at %s:%d", socket.host, socket.port);
        throw Error("Network Unreachable");
});

```

```
opened socket.
serving at 127.0.0.1:5000
closed socket.
Uncaught Error: Network Unreachable
    at REPL
    at With (...)
```

> This is just one of the many uses of a context manager

## Installation

#### npm

```bash
npm install contextlib
```

#### clone repo

```bash
git clone https://github.com/mcsavvy/contextlib.git
```

> after cloning, all exports would be available via the file [`dist/index.js`](/dist/index.js)

#### Use as ES2020 module (recommended)
```javascript
import With from "contextlib";
```
#### or use as CommonJs
```javascript
const With = require("contextlib");
```

### Features 🌩
- Intuitive and easy to use
- Intellisense support. contextlib was built using typescript and is fully typed. This would integrate well with your IDE
- Well documented
- Fully tested ✅

### Building a contextmanager 🔨

A contextmanager can be any object, as long as it provides these two essential methods:

- `enter()` - called at the beginning of the context

- `exit()` - called at the end of the context

> **FUN FACT**: the `exit()` method would be called even when an error occurs in the context!

### Creating a context 🍞
A context is the product of a contextmanager and a context body. Context bodies are in the form of functions, and can include statements, assignments and can even return a value. 

The `With` function is used to handle contexts. It takes two simple arguments; a contextmanager and a context body.

**Here's what your context would look like 😎**
```javascript
var manager = {
    enter(){
        // setup
    }
    exit(){
        // clean up
    }
}

With(manager, () => {
    // do stuff...
})
```

## Documentation
- [Context Managers](/docs/contextmanager.md)
    * Nesting multiple contextmanagers
    * Suppressing errors in context body
    * Contextmanagers that yield
- [With](/docs/with.md)
- [Exitstacks](/docs/exitstack.md): **nesting made easy**
- [Suppress](/docs/suppress.md): **advanced error suppressing**
- [Utilities](/docs/helpers.md)
    * keep track of elapsed time in your program

Have a look at our examples [here](/examples/)

## Contributing
To make contributions to this project, checkout our guidelines for [contributors](/docs/CONTRIBUTING.md)



















