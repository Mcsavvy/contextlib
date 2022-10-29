import With from "../dist/index.js";

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
})
