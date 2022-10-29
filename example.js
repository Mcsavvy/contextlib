import With from "contextlib";

class Manager {
	doThis() { ... }
	doThat() { ... }
	enter() { return this }
	exit() { ... }
}

With(new Manager(), manager => {
	// within context
	manager.doThis()
	manager.doThat()
})
