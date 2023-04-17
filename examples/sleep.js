const {With, withAsync, timed, timedAsync} = require(".");


function sleep(seconds) {
	const start = Date.now();
	while (start + (seconds * 1000) > Date.now())
		continue;
}

async function sleepAsync(seconds) {
    await new Promise(resolve => setTimeout(resolve, seconds * 1000))
}

With(timed(), () => {
    for (let i = 1; i <= 5; i++) {
    	console.log(`sync[${i}] -> sleeping for 2 seconds`)
        sleep(2)
        console.log(`sync[${i}] -> done sleeping`)
    }
})

console.log("----------------------------------")

withAsync(timedAsync(), async () => {
    for (let i = 1; i <= 5; i++) {
    	console.log(`async[${i}] -> sleeping for 2 seconds`)
        sleepAsync(2)
        console.log(`async[${i}] -> done sleeping`)
    }
})
