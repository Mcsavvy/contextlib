/* 
 This example shows how to use the fs module in conjunction
 contextmanagers to handle file operations
 */

// First we need to import the fs module
var fs = require('fs');

// Then we need to import the contextlib module
var {With, contextmanager} = require('../../dist/index.js'); // or require('contextlib)

// Now we can use the With function to open a file
// and close it when we're done

const openFile = contextmanager(function*(filename, mode){
    var fd = fs.openSync(filename, mode);
    yield fd;
    fs.closeSync(fd);
});

With(openFile('test.txt', 'w'), fd => {
    fs.writeSync(fd, 'Hello World!');
});