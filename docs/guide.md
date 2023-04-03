# Getting Started With Context Managers

# With great power...

If you're familiar with python, you've probably come across the `with` keyword; it handles the starting and exiting of contextmanagers.

Similarly, contextlib provides a `With` function that does this **perfectly**. It's job is creating and destroying [contexts](glossary.md#context).

The `With` function accepts two arguments;
1. A [contextmanager](glossary.md#contextmanager)
2. And a [contextbody](glossary.md#contextmanager)

The `With` function also sends any value returned from the contextmanager's `enter()` method to the contextbody as an argument. This is useful when creating a relationship between contextmanager and contextbody. Like this;

```js
class Manager {
    doThis() { ... }

    doThat() { ... }

    enter() { return this; }

    exit() { ... }
}


With(new Manager(), manager => {
    manager.doThis();
    manager.doThat();
});
```

Finally, the `With` function returns an object with two keys;

- <u>completed</u>
	- `true` when the function exits normally
	- `false` when the function exits due to an error
- <u>value</u>: This can vary depending on if the `With` function exits normally or not.
	- If the function exits normally, then it holds the value returned from the contextbody
	- If the function exits due to an error, then it holds the error that caused to function to terminate.

> Usually, when an error makes the `With` function to exit prematurely, the error affects the whole program too. [_Error bubbling_](glossary.md#error-bubbling) can be prevented using a technique called **suppressing** which I would talk about later in this guide.

---

Nested Contexts Are Cool
------------------------
A context can have another context inside of it, this is what we refer to as context nesting; the inner context is a nested context.
How is context nesting achieved? All contexts are created by the `With` function, so you would need two `With` function calls.

1. Create two contextmanagers; one for each context.
```js
class ManagerA {
    enter() {
        console.log("entering context A...");
    }
    exit() {
        console.log("leaving context A...");
    }
}

class ManagerB {
    enter() {
        console.log("entering context B...");
    }
    exit() {
        console.log("leaving context B...");
    }
}
```
2. Create a context (we'll call this the **base context**)
```js
With(new ManagerA(), ()=> {
    console.log("inside context A.");
})
```
3. Now create another context inside the **base context**'s contextbody.
```js
With(new ManagerA(), ()=> {
    console.log("inside context A.");

    With(new ManagerB(), () => {
        console.log("inside context B.")
    })
})
```
4. Done! You now have a nested context.

**Output**
```
entering context A...
inside context A.
entering context B...
inside context B.
leaving context B...
leaving context A...
```
> Check out the crazy nesting we did [here](examples/crazynest.js)

When nested contextmanagers begin to get harder to manage and less readable, you should consider switching to [**ExitStacks**](exitstack.md).

---
