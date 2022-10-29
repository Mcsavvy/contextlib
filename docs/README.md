Context Managers In Javascript
==============================

Managing Resources
------------------
The usage of resources like file operations or database connections is very common in many programming languages. However, these resources are very limited in supply. Therefore, the main problem lies in making sure to release these resources after usage. If they are not released then it will lead to resource leakage and may cause the system to slow down or even crash. It would be very helpful if developers have a mechanism for automatic setup and teardown of resources.

This pattern can be implemented in **Javascript** by using [contextmanagers](glossary.md/#contextmanagers). They facilitate the proper handling of resources.
> Contextmanagers are similar to contextmanagers in python programming language; in fact, contextlib is a **javascript implentation of python contextmanagers**.

**A simple contextmanager**

```js
class Manager {
    enter() {
        console.log("setting up...");
    }
    exit() {
        console.log("cleaning up...")
    }
}

With(new Manager(), () => {
    console.log("inside context");
    throw Error("💔");
})
```
**Output**
```
setting up...
inside context
cleaning up...
Uncaught Error: 💔
    at REPL16:3:11
    at With (/home/blvckphish/projects/contextlib/dist/cjs/with.js:47:21)
```

Contextmanagers prove to be really useful for different purposes, like;

- Automatically handling setup and cleanup.
- Managing unreliable code.
- Writing clear and concise code.
- Preventing errors from [bubbling](glossary.md#error-bubbling).

### Getting Started
Read the [developer guide](guide.md) on how to use contextmanagers in your project.

### Installing From NPM
The latest version of contextlib can be downloaded via `npm`
```
npm install contextlib
```
To use contextlib, you can import it in two different ways

1. As an ES module
```js
import With from "contextlib";
```
2. As a commonjs
```js
const { With } = require("contextlib");
```

> The above two methods of importing are fully supported, although this documentation uses the `import` method more frequently.

### Cloning From Github
The stable release of contextlib would be available on the `main` branch. The `dev` branch may contain code that isn't **fully tested**.

```
git clone https://github.com/mcsavvy/contextlib.git
cd contextlib
```
To use contextlib, you can import it in two different ways

1. As an ES module
```js
import With from ".";
```
2. As a commonjs
```js
const { With } = require(".");
```

### Contributing
To make contributions to this project, checkout our guidelines for [contributors](/docs/CONTRIBUTING.md).
