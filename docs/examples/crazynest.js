import { With } from "../../dist/cjs";

var padding = 0;

class Draw {
	constructor(character){
		this.char = character;
	}
	drawLine() {
		console.log(
			"%s%s",
			Array(padding)
			.fill(".")
			.join(""),
			this.char
		)
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

With(new Draw(">"), () => {
	With(new Draw(">"), () => {
		With(new Draw(">"), () => {
			With(new Draw(">"), () => {
				With(new Draw(">"), () => {})	
			})
		})	
	})
	With(new Draw("*"), () => {
		With(new Draw("*"), () => {
			With(new Draw("*"), () => {
				With(new Draw("*"), () => {
					With(new Draw("*"), () => {
						With(new Draw("*"), () => {
							With(new Draw("*"), () => {})	
						})
					})	
				})
			})
		})
		With(new Draw("+"), () => {
			With(new Draw("+"), () => {
				With(new Draw("+"), () => {})
			})	
		})
	})
})