/* 
 This example shows how to use
 contextmanagers to handle socket operations
 */

// First we need to import the net module
var net = require('net');

// Then we need to import the contextlib module
var {With, contextmanager} = require('../../dist/index.js'); // or require('contextlib)

// Now we can use the With function to open a socket
// and close it when we're done

class SocketManager {
    constructor(host, port) {
        this.host = host;
        this.port = port;
        this.socket = new net.Socket();
    }

    enter() {
        // open the socket
        this.socket.connect({
            host: this.host,
            port: this.port
        });
        console.log('Connected to %s:%s', this.host, this.port);
        return this.socket;
    }

    exit() {
        // close the socket
        this.socket.end();
        console.log('Disconnected from %s:%s', this.host, this.port);
    }
}

const socketManager = new SocketManager('google.com', 80);

With(socketManager, socket => {
    // log if the socket is connected
    console.log('Waiting for data...');
    console.log('------------------');
    return socket;
});

// In case of an error
With(socketManager, socket => {
    // log if the socket is connected
    console.log('Waiting for data...');
    console.log('------------------');
    throw new Error('An error occured');
    return socket;
});

/*
    Output:
    Connected to google.com:80
    Waiting for data...
    ------------------
    Disconnected from google.com:80
    Connected to google.com:80
    Waiting for data...
    ------------------
    Disconnected from google.com:80
    Error: An error occured
        at ...
*/