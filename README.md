# Contextlib
JS implementation of python's context managers. **_With 💙 { `...` }_**

Have you been waiting on this too? Probably you thought of implementing it yourself.
_Well_ here's the thing "context managers are even better with Javascript!" check this out...

```js
function sleep(seconds){
    {...} // some code here....
}

var timed = contextmanger(function*(){
    var start = Date.now();
    try {yield}
    finally {
        console.log(`Execution took ${Date.now() - start}ms`)
    }
})()


With(timed, () => {
    sleep(1000)
})
```
```bash
# output
Execution took 1000ms
```

Now that's how easy it is to get started. There are no tutorial, just this brief documentation.
#### May we?

### What are context managers?
Context managers are resource managers that allow you to allocate and release resources precisely when you want to.

**Put Simply**: You tell them what to do at the beginning and at the end and they make sure they do it no matter what happens - _Even an Exception is not an exception_.

#### What do you need them for?
The list is endless but here are some common uses of CMs

+ Closing files after usage
+ Close sockets after usage
+ Suppressing silly exceptions
+ Pushing to github af every commit ( let's leave this out for now.. )

#### let's create one!
CMs are regular classes that implement these two methods `enter` and `exit`.

```js
class context:
    enter(){
        console.log("Entering context")
    }

    exit(){
        console.log("Leaving context")
    }
```

Now we have our context manager or CM, we can use our `With` function.

    note that our "With" starts with a capital letter "W"

#### The With function
Our with function accepts a CM as first argument and a callaback as second argument. The callback would represent the body of the context.

```js
With(context, function(){
    console.log("Inside context")
})
```
```bash
Entering context
Inside context
Leaving context
```
#### The contextmanager decorator
Do you know you can also use generator functions as CMs, as long as the yield only once.
All you have to do is to decorate the function with `contextmanager`
```js
function* generator(){
    console.log("Entering context")
    yield
    console.log("Leaving context")
}
var context = contextmanager(generator)()
// then you can use your `With` function again.
```