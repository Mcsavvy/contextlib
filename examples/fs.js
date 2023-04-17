/* 
 This example shows how to use the fs module in conjunction
 contextmanagers to handle file operations
 */

// First we need to import the fs module
var fs = require('fs');

// Then we need to import the contextlib module
var {With, contextmanager} = require('..'); // or require('contextlib)

// Now we can use the With function to open a file
// and close it when we're done

const openFile = contextmanager(function*(filename, mode){
	let modename;
	switch (mode) {
		case 'w':
			modename = "write";
		case 'r':
			modename = "read";
		case 'a':
			modename = 'append';
	}
	var fd = fs.openSync(filename, mode);
	console.log(`[INFO] Opened ${filename} in ${modename} mode (fd=${fd})`);
	try {
		yield fd;
	}
	finally {
		fs.closeSync(fd);
		console.log(`[INFO] Closed ${filename} (fd=${fd})`);
	}
});

With(openFile('test.txt', 'w'), fd => {
	console.log(`[INFO] writing into file`);
	fs.writeSync(fd, 'Hello World!\n');
});

With(openFile('test.txt', 'a'), fd => {
	console.log(`[INFO] appending into file`);
	fs.writeSync(fd, 'I Love Context Managers');
});

With(openFile('test.txt', 'r'), fd => {
	console.log(`[INFO] reading from file`);
	let size = fs.statSync("test.txt").size;
	let buffer = Buffer.alloc(size);
	fs.readSync(fd, buffer);
	console.log('************');
	console.log(buffer.toString());
	console.log('***********************');
	console.log("[WARNING] Throwing Error!");
	throw Error("Buffer Overflow")
});

