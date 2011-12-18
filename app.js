/*****
	Note Soup server for node.js
	
	Copyright 2011 by Bill Roy.
	Licensed for use.  See LICENSE.

Database use:

	hash: notes/<user>/<folder>
		field: note.id
		value: json representation of note data
	
	sorted set: mtime/<user>/<folder>
		score: note update time from new Date().getTime()
		id: note.id
	
	integer: next/<user>/<folder>
		next note number in sequence
		actually pre-increments...

*****/

/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')

var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  //app.set('views', __dirname + '/views');
  //app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  //app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

// Routes

//app.get('/', routes.index);

app.post('/notesoup.php', function(req, res) {
	//console.log("Request body: " + typeof(req.body));
	//console.dir(req.body);

	if (req.body.method == 'savenote') apisavenote(req, res);
	else if (req.body.method == 'sync') apisync(req, res);
	else if (req.body.method == 'sendnote') apisendnote(req, res);
	else {
		console.log("Error in request body: " + typeof(req.body));
		console.dir(req.body);
		console.log("*****");
		console.dir(req);
		res.send("Huh?");
	}
	
});


var redis = require("redis");
var client = redis.createClient();		// port, host, options
client.on("error", function (err) {
	console.log("Error " + err);
});
//client.auth(password);				// server auth

function apisendreply(req, res, updatelist) {

	var reply = {
		result: '',
		error: null,
		id: req.body.id,
		command: updatelist
	}
	res.send(reply);
}

function apisavenote(req, res) {

	if (!('id' in req.body.params.note)) {
		client.incr('next/' + req.body.params.tofolder, function(err, id) {
			req.body.params.note.id = id.toString();
			apisavenote_with_id(req, res);
		});
	}
	else apisavenote_with_id(req, res);
}

function apisavenote_with_id(req, res) {

	var now = new Date().getTime();
	var jsonnote = JSON.stringify(req.body.params.note);

	client.multi() 
		.hset('notes/' + req.body.params.tofolder, req.body.params.note.id, jsonnote)
		.zadd('mtime/' + req.body.params.tofolder, now, req.body.params.note.id)
	 	.exec(function (err, replies) {
			console.log("MULTI got " + replies.length + " replies");
			replies.forEach(function (reply, index) {
				console.log("Reply " + index + ": " + reply.toString());
	        });
			apisendreply(req, res, [['updatenote', req.body.params.note]]);
        });
}



function apisync(req, res) {
	var folder = req.body.params.fromfolder;
	var newlastupdate = new Date().getTime();

	if (req.body.params.lastupdate == 0) {
		client.hkeys('notes/' + folder, function(err, notes) {
			res.updatelist = [['beginupdate','']];
			client.hmget('notes/' + folder, notes, function(err, notes) {
				console.log("GOT NOTES:");
				console.dir(notes);
				if (typeof(notes) != 'undefined') {
					for (var i=0; i<notes.length; i++) {
						var note = JSON.parse(notes[i]);
						res.updatelist.push(['updatenote', note]);
					}
				}
				res.updatelist.push(['setupdatetime', newlastupdate.toString()]);
				res.updatelist.push(['endupdate','']);
				apisendreply(req, res, res.updatelist);
			});
		});
	}
	else {
		client.zrangebyscore('mtime/' + folder, 
			req.body.params.lastupdate, newlastupdate, function(err, notes) {
			res.updatelist = [['beginupdate','']];
			client.hmget('notes/' + folder, notes, function(err, notes) {
				console.log("GOT NOTES2:");
				console.dir(notes);
				if (typeof(notes) != 'undefined') {
					for (var i=0; i<notes.length; i++) {
						var note = JSON.parse(notes[i]);
						res.updatelist.push(['updatenote', note]);
					}
				}
				res.updatelist.push(['setupdatetime', newlastupdate.toString()]);
				res.updatelist.push(['endupdate','']);
				apisendreply(req, res, res.updatelist);
			});
		});
	}
}


function apisendnote(req, res) {

	res.updatelist = [];
	client.hget('notes/' + req.body.params.fromfolder, req.body.params.noteid, function(err, note) {
		client.incr('next/' + req.body.params.tofolder, function(err, newid) {

// crash here: note is null?!

			note.id = newid.toString();
			var jsonnote = JSON.stringify(note);
			var now = new Date().getTime();

			client.multi()
				.hset('notes/' + req.body.params.tofolder, note.id, note)
				.zadd('mtime/' + req.body.params.tofolder, now, note.id)
				.exec(function(err, reply) {

					if (req.body.params.tofolder == req.body.params.notifyfolder)
						res.updatelist.push(['updatenote', note]);

					if (!('deleteoriginal' in req.body.params) || req.body.params.deleteoriginal) {
						client.multi()
							.hdel('notes/' + req.body.params.fromfolder, req.body.params.noteid)
							.zrem('mtime/' + req.body.params.fromfolder, req.body.params.noteid)
							.exec(function(err, reply) {
								res.updatelist.push(['deletenote', req.body.params.noteid]);
								apisendreply(req, res, res.updatelist);
							});
					}
					else apisendreply(req, res, res.updatelist);
				});
		});
	});
}


app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
