import With from "./index.js";
import fs from "fs";

function open(path, options) {
    return {
        enter() {
            this.file = fs.openSync(path, options);
	    return this.file;
        },
        exit() {
            fs.closeSync(this.file);
        }
    }
}

With(open("example.txt"), file => {
    const data = fs.readFileSync(file);
})
