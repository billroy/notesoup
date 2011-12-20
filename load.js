
// add notes from file-based soup to user/inbox in the redis store

var redis = require("redis");
var client = redis.createClient();		// port, host, options
client.on("error", function (err) {
	console.log("Error " + err);
});
//client.auth(password);				// server auth

// Redis key mapping
//
function key_note(folder) 	{ return 'notes/' + folder; }
function key_mtime(folder) 	{ return 'mtime/' + folder; }
function key_nextid(folder)	{ return 'next/'  + folder; }

var fs = require('fs');

var tofolder = 'user/inbox';
var directory = '/Users/bill/Sites/soup/data/soupbase/user/inbox';
var files = fs.readdirSync(directory);

var responses_pending = 0;

files.forEach(function(filename) {

	var filepath = directory + '/' + filename;
	var filetext = fs.readFileSync(filepath, 'utf8');		// specifying 'utf8' to get a string result
	var note = JSON.parse(filetext);

	client.incr(key_nextid(tofolder), function(err, id) {

		note.id = id.toString();
		var now = new Date().getTime();
		var jsonnote = JSON.stringify(note);
		++responses_pending;

		client.multi() 
			.hset(key_note(tofolder), note.id, jsonnote)
			.zadd(key_mtime(tofolder), now, note.id)
	 		.exec(function (err, replies) {
				--responses_pending;
				console.log("MULTI got " + replies.length + " replies");
				replies.forEach(function (reply, index) {
					console.log("Reply " + index + ": " + reply.toString());
	    	    });
        	});
	});
});

// Wait for the last command to complete
setInterval(function() {
	if (responses_pending > 0) console.log("Waiting for responses: " + responses_pending);
	else {
		client.quit();
		process.exit(0);
	}
}, 1000);
