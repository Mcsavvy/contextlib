const {With, ExitStack} = require("..");

var padding = 0;

class Draw {
	constructor(character){
		this.char = character;
	}
	drawLine() {
		console.log("%s%s", ".".repeat(padding), this.char)
	}
	enter() {
		this.drawLine();
		padding++;
	}

	exit() {
		this.drawLine();
		padding--;
	}
}

With(new ExitStack(), stack => {
	let childstack;

	stack.enterContext(new Draw(">"));
	childstack = stack.enterContext(new ExitStack());
	for (let i=0; i < 4; i++)
		childstack.enterContext(new Draw(">"));
	childstack.exit()
	stack.enterContext(new Draw("*"));
	childstack = stack.enterContext(new ExitStack());
	for (let i=0; i < 6; i++)
		childstack.enterContext(new Draw("*"));
	childstack.exit()
	childstack = stack.enterContext(new ExitStack());
	for (let i=0; i < 3; i++)
		childstack.enterContext(new Draw("+"));	
})
