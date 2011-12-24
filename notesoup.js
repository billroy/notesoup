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
var crypto = require('crypto');

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
	res.updatelist = [];
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

sendreply: function(req, res) {

	var reply = {
		result: '',
		error: null,
		id: req.body.id,
		command: res.updatelist
	}
	console.log('Reply:');
	console.dir(res.updatelist);
	console.dir(reply);
	res.send(reply);
},

api_savenote: function(req, res) {
	var self = this;

	if (typeof(req.body.params.note[0]) == 'undefined') {	// a single note, not an array
		if (!('id' in req.body.params.note)) {
			self.redis.incr(self.key_nextid(req.body.params.tofolder), function(err, id) {
				req.body.params.note.id = id.toString();
				self.savenote(req, res, req.body.params.note, req.body.params.tofolder);
				self.sendreply(req, res);
			});
		}
		else {
			self.savenote(req, res, req.body.params.note, req.body.params.tofolder);
			self.sendreply(req, res);
		}
	}
	else {		// an array of notes
		req.body.params.note.forEach(function(note) {
			if (!('id' in note)) {
				self.redis.incr(self.key_nextid(req.body.params.tofolder), function(err, id) {
					note.id = id.toString();
					self.savenote(req, res, note, req.body.params.tofolder);
				});
			}
			else {
				self.savenote(req, res, req.body.params.note, req.body.params.tofolder);
			}
		});
		self.sendreply(req, res);
	}
},

savenote: function(req, res, note, tofolder) {
	var self = this;
	var now = new Date().getTime();
	var jsonnote = JSON.stringify(note);

	var update = ['updatenote', note];
	res.updatelist.push(update);
	self.notifychange(tofolder, update);

	self.redis.multi()
		.hset(self.key_note(tofolder), note.id, jsonnote)
		.zadd(self.key_mtime(tofolder), now, note.id)
	 	.exec(function (err, replies) {
			console.log("SaveNote got " + replies.length + " replies");
			replies.forEach(function (reply, index) {
				console.log("Reply " + index + ": " + reply.toString());
	        });
	});
},

notifychange: function(tofolder, update) {
	var self = this;
	console.log("Notify: ");
	console.dir(update);
	self.io.sockets.emit(tofolder, update);
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
		self.sendreply(req, res);
	});
},

api_sendnote: function(req, res) {
	var self = this;
	self.redis.multi()
		.hget(self.key_note(req.body.params.fromfolder), req.body.params.noteid)
		.incr(self.key_nextid(req.body.params.tofolder))
		.exec(function(err, reply) {

			// Bug: crash here on Duplicate Note: note is null?!
			console.log('Send note bulk reply: ');
			console.dir(reply);

			var note = JSON.parse(reply[0]);
			console.log('Fetched note: ' + typeof(note));
			console.dir(note);
			note.id = reply[1].toString();
			console.log('New note id: ' + note.id);
			var now = new Date().getTime();

			self.redis.multi()
				.hset(self.key_note(req.body.params.tofolder), note.id, JSON.stringify(note))
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
								self.sendreply(req, res);
							});
					}
					else self.sendreply(req, res);
				});
		});
},

api_appendtonote: function(req, res) {
	var self = this;
	self.redis.hget(self.key_note(req.body.params.tofolder), 
		req.body.params.noteid, function(err, notetext) {

		if (notetext) {
			var note = JSON.parse(notetext);
			console.log('Append: note ' + typeof(note));
			console.dir(note);

			if (note.text) note.text = note.text + req.body.params.text;
			else note.text = req.body.params.text;

			self.savenote(req, res, note, req.body.params.tofolder);
			self.sendreply(req, res);
		}
	});
},

api_postevent: function(req, res) {
	console.log('PostEvent via api:');
	console.dir(req.body.params);
	//io.socket.send(res.body.params.
	return this.sendreply(req, res);
},

api_getnotes: function(req, res) {
	var self = this;
	self.redis.hgetall(self.key_note(req.body.params.fromfolder), function(err, jsonnotes) {
		if (!jsonnotes) return;
		//console.log("Got notes from " + req.body.params.fromfolder);
		//console.dir(json_notes);
		var parsed_notes = {};
		for (var n in jsonnotes) {
			var note = JSON.parse(jsonnotes[n]);
			parsed_notes[note.id] = note;
		}
		
		res.updatelist.push(['notes', parsed_notes]);
		self.sendreply(req, res);
	});
},

key_folderquery: function(user) {
	return this.key_note(user + '/*');
},

api_getfolderlist: function(req, res) {
	var self = this;

	// Todo: should use session username
	self.redis.keys(self.key_folderquery(req.body.params.user), function(err, keylist) {
		var folderlist = [];
		keylist.forEach(function(key) {
			folderlist.push(key.substr(6));	// prune off 'notes/'
		});
		res.updatelist.push(['folderlist', folderlist]);
		self.sendreply(req, res);
	});
},

api_createfolder: function(req, res) {
	this.api_openfolder(req, res);
},

api_openfolder: function(req, res) {
	res.updatelist.push(['navigateto', '/folder/' + req.body.params.tofolder]);
	this.sendreply(req, res);
},

effectiveuser: function(req, res) {
	return req.session.loggedin ? req.session.username : 'guest';
},

navigatehome: function(req, res) {
	var self = this;
	if (req.session.loggedin) {
		res.updatelist.push([
			'navigateto', 
			'/folder/' + self.effectiveuser(req, res) + '/' + self.inboxfolder
		]);
	}
	else res.updatelist.push(['navigateto', '/']);
	//self.sendreply(req, res);
},

deletefolder: function(req, res, folder, execfunc) {
	var self = this;
	// BUG: need that evil filename character check here!
	self.redis.multi()
		.del(self.key_note(folder))
		.del(self.key_mtime(folder))
		.del(self.key_nextid(folder))
		.del(self.key_foldermeta(folder))
		.exec(execfunc());
},

api_deletefolder: function(req, res) {
	var self = this;
	self.deletefolder(req, res, req.body.params.fromfolder, function(err, replies) {
		self.navigatehome(req, res);
		self.sendreply(req, res);
	});
},

api_emptytrash: function(req, res) {
	var self = this;
	self.deletefolder(req, res, this.effectiveuser(req, res) + '/trash', function(err, replies) {
		res.updatelist.push(['say', 'The trash is empty.']);
		self.sendreply(req, res);
	});
},


/**
*	return a string of random alphanumeric characters of a specified length
*	@param {int} namelen the length of the string
*/
randomName: function(namelen) {
	var charset = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
	var name = '';
	while (name.length < namelen) 
		name += charset.charAt(Math.floor(Math.random() * charset.length));
	return name;
},

key_usermeta: function(user) {
	return 'user/' + user + '/.passwd';
},

api_createuser: function(req, res) {
	this.initsessiondata(req, res);
	this.save_password_hash(req, res, req.body.params.username, req.body.params.password);
	this.navigatehome(req, res);
	this.sendreply(req, res);
},

inboxfolder: 'inbox',

save_password_hash: function(req, res, user, passwordhash) {
	var self = this;
	self.redis.set(self.key_usermeta(user), passwordhash, function(err, reply) {
	});
},

key_foldermeta: function(folder) {
	return 'fldr/' + folder;
},

api_setfolderacl: function(req, res) {

	var self = this;
	var acl = {};
	if (req.body.params.editors) acl.editors = req.body.params.editors;
	if (req.body.params.readers) acl.readers = req.body.params.readers;
	if (req.body.params.senders) acl.senders = req.body.params.senders;
	if (req.body.params.password) acl.password = req.body.params.password;

	console.log("SetACL " + req.body.params.tofolder);
	console.dir(acl);

	self.redis.hmset(self.key_foldermeta(req.body.params.tofolder), acl, function(err, reply) {
		res.updatelist.push(['say','Folder permissions updated.']);
		self.sendreply(req, res);
	});
},

api_knockknock: function(req, res) {
	req.session.nonce = this.randomName(32);	// save login nonce
	res.updatelist.push(['whosthere', req.session.nonce]);
	this.sendreply(req, res);
},

api_login: function(req, res) {
	// fetch username passwordhash
	var self = this;
	self.redis.get(self.key_usermeta(req.body.params.username), function(err, passwordhash) {

		if (!passwordhash) {
			self.clearsessiondata(req, res);
			self.senderror(req, res, 'Invalid login.');
			return;
		}

		var salted_hash = crypto.createHash('sha1')
							.update(passwordhash + req.session.nonce)
							.digest('hex');
		console.log('Login: saved  hash ' + passwordhash);
		console.log('Login: saved nonce ' + req.session.nonce);
		console.log('Login: salted hash ' + salted_hash);
		console.log('Login: client hash ' + req.body.params.passwordhash);
		if (salted_hash == req.body.params.passwordhash) {
			self.initsessiondata(req, res);
			self.navigatehome(req, res);
			self.sendreply(req, res);
		}
		else {
			self.clearsessiondata(req, res);
			self.senderror(req, res, 'Invalid login.');
		}
	});
},

initsessiondata: function(req, res) {
	req.session.loggedin = true;
	req.session.username = req.body.params.username;
	delete req.session.nonce;
},

clearsessiondata: function(req, res) {
	delete req.session.loggedin;
	delete req.session.username;
	delete req.session.nonce;
},

api_logout: function(req, res) {
	this.clearsessiondata(req, res);
	res.updatelist.push(['navigateto', '/']);
	this.sendreply(req, res);
},

loadfiles: function(directory, tofolder) {

	var files = fs.readdirSync(directory);
	var responses_pending = 0;
	var self = this;

	files.forEach(function(filename) {
		if (filename.charAt(0) == '.') {
			console.log('Skipping system file ' + filename);
			return;
		}
		console.log('Loading ' + directory + ' ' + filename);
		var filepath = directory + '/' + filename;
		var filetext = fs.readFileSync(filepath, 'utf8');		// specifying 'utf8' to get a string result
		var note = JSON.parse(filetext);
	
		// Clean up the note a bit
		if (note.bgcolor == '#FFFF99') delete note.bgcolor;
		if ('syncme' in note) delete note.syncme;
		if (note.imports) {
			note.imports = note.imports.replace('http://chowder.notesoup.net', '');
		}

		if (note.backImage) {
			note.backImage = note.backImage.replace('http://notesoup.net', '');
		}

		self.redis.incr(self.key_nextid(tofolder), function(err, id) {
	
			note.id = id.toString();
			note.mtime = new Date().getTime();
			var jsonnote = JSON.stringify(note);
			++responses_pending;
	
			self.redis.multi() 
				.hset(self.key_note(tofolder), note.id, jsonnote)
				.zadd(self.key_mtime(tofolder), note.mtime, note.id)
				.exec(function (err, replies) {
					--responses_pending;
					//console.log("MULTI got " + replies.length + " replies");
					//replies.forEach(function (reply, index) {
					//	console.log("Reply " + index + ": " + reply.toString());
					//});
				});
		});
	});

	// Wait for the last command to complete
	var timer;
	timer = setInterval(function() {
		if (responses_pending > 0) console.log("Loadfiles waiting for responses: " + responses_pending);
		else clearInterval(timer);
	}, 100);
},

loaduser: function(user) {

	var userpath = __dirname + '/templates/soupbase/' + user;
	var folders = fs.readdirSync(userpath);
	var responses_pending = 0;
	var self = this;

	folders.forEach(function(foldername) {
		if (foldername.charAt(0) == '.') {
			console.log('Skipping system file ' + foldername);
			return;
		}
		console.log('Loading folder ' + user + '/' + foldername);
		self.loadfiles(userpath + '/' + foldername, user + '/' + foldername);
	});
}

};	// NoteSoup = {...};

module.exports = NoteSoup;
