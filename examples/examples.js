const {With, withAsync, timed, timedAsync} = require("..");


function sleep(seconds) {
    const start = Date.now();
	while (start + (seconds * 1000) < Date.now())
		continue;
}

With(timed(), () => {
	const start = Date.now();
	while (start + (seconds * 1000) < Date.now())
		continue;
})
