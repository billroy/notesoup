/*****
	Note Soup server for node.js / redis
	
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

var fs = require('fs');

NoteSoup = {

connect: function(redis_url) {

	if (redis_url) {
		console.log("Connecting to Redis at " + redis_url);
		this.redis = require('redis-url').connect(redis_url);
	}
	else {
		console.log("Connecting to local Redis");
		this.redis = require("redis").createClient();		// port, host, options
	}
	
	this.redis.on("error", function (err) {
		console.log("Redis Error " + err);
	});
},


dispatch: function(req, res) {
	if (typeof(this['api_'+req.body.method]) != "function") {
		console.log("No method for request: ");
		console.dir(req.body);
		this.senderror(req, res, "The server does not know how to " + req.body.method);
		return 0;
	}
	console.log("api req: " + req.body.method);
	console.dir(req.body.params);
	this['api_'+req.body.method](req, res);
	return 1;
},

// Redis key mapping
//
key_note: function(folder) 		{ return 'notes/' + folder; },
key_mtime: function(folder) 	{ return 'mtime/' + folder; },
key_nextid:  function(folder)	{ return 'next/'  + folder; },


senderror: function(req, res, errormessage) {
	var reply = {
		result: '',
		error: errormessage,
		id: req.body.id,
		command: []		
	}
	res.send(reply);
},


sendreply: function(req, res, updatelist) {

	var reply = {
		result: '',
		error: null,
		id: req.body.id,
		command: updatelist
	}
	res.send(reply);
},

api_savenote: function(req, res) {
	var self = this;
	if (!('id' in req.body.params.note)) {
		self.redis.incr(self.key_nextid(req.body.params.tofolder), function(err, id) {
			req.body.params.note.id = id.toString();
			self.savenote_with_id(req, res);
		});
	}
	else self.savenote_with_id(req, res);
},

savenote_with_id: function(req, res) {

	var now = new Date().getTime();
	var jsonnote = JSON.stringify(req.body.params.note);
	var self = this;

	self.redis.multi() 
		.hset(self.key_note(req.body.params.tofolder), req.body.params.note.id, jsonnote)
		.zadd(self.key_mtime(req.body.params.tofolder), now, req.body.params.note.id)
	 	.exec(function (err, replies) {
			console.log("MULTI got " + replies.length + " replies");
			replies.forEach(function (reply, index) {
				console.log("Reply " + index + ": " + reply.toString());
	        });
			self.sendreply(req, res, [['updatenote', req.body.params.note]]);
        });
},



api_sync: function(req, res) {

	res.newlastupdate = new Date().getTime();
	var self = this;

	// TODO: HGETALL would save a server roundtrip here
	if (req.body.params.lastupdate == 0) {
		self.redis.hkeys(self.key_note(req.body.params.fromfolder), function(err, noteids) {
			self.sync_sendupdates(req, res, noteids);
		});
	}
	else {
		self.redis.zrangebyscore(self.key_mtime(req.body.params.fromfolder), 
			req.body.params.lastupdate, res.newlastupdate, function(err, noteids) {
			self.sync_sendupdates(req, res, noteids);
		});
	}
},


sync_sendupdates: function(req, res, noteids) {

	res.updatelist = [];
	var self = this;
	self.redis.hmget(self.key_note(req.body.params.fromfolder), noteids, function(err, notes) {
		if (notes) {
			console.log("Syncing notes:");
			console.dir(notes);
			res.updatelist.push(['beginupdate','']);
			for (var i=0; i<notes.length; i++) {
				var note = JSON.parse(notes[i]);
				res.updatelist.push(['updatenote', note]);
			}
			res.updatelist.push(['endupdate','']);
		}
		res.updatelist.push(['setupdatetime', res.newlastupdate.toString()]);
		self.sendreply(req, res, res.updatelist);
	});
},



api_sendnote: function(req, res) {
	var self = this;
	res.updatelist = [];
	self.redis.multi()
		.hget(self.key_note(req.body.params.fromfolder), req.body.params.noteid)
		.incr(self.key_nextid(req.body.params.tofolder))
		.exec(function(err, reply) {

			// Bug: crash here on Duplicate Note: note is null?!
			//console.log("Send note bulk reply:");
			//console.dir(reply);

			var note = reply[0];
			note.id = reply[1].toString();
			var jsonnote = JSON.stringify(note);
			var now = new Date().getTime();

			self.redis.multi()
				.hset(self.key_note(req.body.params.tofolder), note.id, note)
				.zadd(self.key_mtime(req.body.params.tofolder), now, note.id)
				.exec(function(err, reply) {

					if (req.body.params.tofolder == req.body.params.notifyfolder)
						res.updatelist.push(['updatenote', note]);

					if (!('deleteoriginal' in req.body.params) || req.body.params.deleteoriginal) {
						self.redis.multi()
							.hdel(self.key_note(req.body.params.fromfolder), req.body.params.noteid)
							.zrem(self.key_mtime(req.body.params.fromfolder), req.body.params.noteid)
							.exec(function(err, reply) {
								res.updatelist.push(['deletenote', req.body.params.noteid]);
								self.sendreply(req, res, res.updatelist);
							});
					}
					else self.sendreply(req, res, res.updatelist);
				});
		});
},

api_postevent: function(req, res) {
	console.log('PostEvent via api:');
	console.dir(req.body.params);
	//io.socket.send(res.body.params.
	return this.sendreply(req, res, []);
},

api_getnotes: function(req, res) {
//	console.dir(req.body.params);
	return this.sendreply(req, res, []);
},

api_getfolderlist: function(req, res) {
//	console.dir(req.body.params);
// TODO: fetch from redis
	return this.sendreply(req, res, [['folderlist',['user/inbox','user/public','user/trash']]]);
},

api_openfolder: function(req, res) {
//	console.dir(req.body.params);
	return this.sendreply(req, res, [['navigateto', '/folder/' + req.body.params.tofolder]]);
},


loadfiles: function(directory, tofolder) {

	var files = fs.readdirSync(directory);
	var responses_pending = 0;
	var self = this;

	files.forEach(function(filename) {
	
		var filepath = directory + '/' + filename;
		var filetext = fs.readFileSync(filepath, 'utf8');		// specifying 'utf8' to get a string result
		var note = JSON.parse(filetext);
	
		self.redis.incr(self.key_nextid(tofolder), function(err, id) {
	
			note.id = id.toString();
			var now = new Date().getTime();
			var jsonnote = JSON.stringify(note);
			++responses_pending;
	
			self.redis.multi() 
				.hset(self.key_note(tofolder), note.id, jsonnote)
				.zadd(self.key_mtime(tofolder), now, note.id)
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
	var timer = setInterval(function() {
		if (responses_pending > 0) console.log("Loadfiles waiting for responses: " + responses_pending);
		else {
			clearInterval(timer);
		}
	}, 1000);
}
};	// NoteSoup = {...};

module.exports = NoteSoup;
