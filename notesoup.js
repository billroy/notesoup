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
var util = require('util');
var async = require('async');

NoteSoup = {

connect: function(redis_url) {

	if (redis_url) {
		this.log("Connecting to Redis at " + redis_url);
		this.redis = require('redis-url').connect(redis_url);
	}
	else {
		this.log("Connecting to local Redis");
		this.redis = require("redis").createClient();		// port, host, options
	}
	
	this.redis.on("error", function (err) {
		this.log("Redis Error " + err);
	});
},

dispatch: function(req, res) {
	res.updatelist = [];
	this.req = req;
	this.res = res;
	if (typeof(this['api_' + req.body.method]) != "function") {
		this.log("No method for request: ");
		this.dir(req.body);
		this.senderror("The server does not know how to " + req.body.method);
		return 0;
	}
	this.log("api req: " + req.body.method);
	this.dir(req.body.params);
	this['api_'+req.body.method](req, res);
	return 1;
},

// Redis key mapping
//
key_note: function(folder) 		{ return 'notes/' + folder; },
key_mtime: function(folder) 	{ return 'mtime/' + folder; },
key_nextid:  function(folder)	{ return 'next/'  + folder; },

log: function(text) {
	console.log(text);
},

dir: function(thing) {
	console.log(util.inspect(thing, false, 3, true));
},

senderror: function(errormessage) {
	var reply = {
		result: '',
		error: errormessage,
		id: this.req.body.id,
		command: []		
	};
	this.res.send(reply);
},

sendreply: function() {

	var reply = {
		result: '',
		error: null,
		id: this.req.body.id,
		command: this.res.updatelist
	};

	this.log('Reply:');
	this.dir(reply);

	this.res.send(reply);
},


api_savenote: function() {
	var self = this;

	// convert a single note to an array for the forEach construct
	if (typeof(self.req.body.params.note[0]) == 'undefined') {	// a single note, not an array
		self.req.body.params.note = [self.req.body.params.note];
	}
	// todo: test this without Series
	async.forEachSeries(self.req.body.params.note,
		function(note, next) {
			self.req.body.params.thenote = note;
			async.series([self.checkid, self.savenote], function(err, reply) {
				next(null);
			});
		},
		function(err, reply) { 
			if (err) self.log('Savenote error: ' + err); 
			else {
				self.log('Savenote complete');
				self.dir(reply);
				self.sendreply();
			}
		}
	);
},

checkid: function(next) {
	var self = this.NoteSoup;

	//console.log('Checkid: this');
	//console.dir(this);
	
	self.log('Checkid: params');
	self.dir(self.req.body.params);	

	if (!self.req.body.params.thenote.id) {
		self.redis.incr(self.key_nextid(self.req.body.params.tofolder), function(err, id) {
			self.req.body.params.thenote.id = id.toString();
			next(null, 1);
		});
	}
	else next(null, 2);
	self.log('Leaving checkid');
},

addupdate: function(update) {
	var self = this;
	self.log("addupdate:");
	self.dir(update);
	self.res.updatelist.push(update);
	//self.notifychange(self.req.body.params.tofolder, update);
},

savenote: function(next) {
	var self = this.NoteSoup;
	var now = new Date().getTime();
	var jsonnote = JSON.stringify(self.req.body.params.thenote);

	self.log('Savenote: params');
	self.dir(self.req.body.params);	

	if (!self.req.body.params.thenote.id) {
		self.log('savenote without id');
		next(null, 3);
		return;
	}

	var update = ['updatenote', self.req.body.params.thenote];
	self.addupdate(update);
	self.notifychange(self.req.body.params.tofolder, update);

	self.redis.multi()
		.hset(self.key_note(self.req.body.params.tofolder), self.req.body.params.thenote.id, jsonnote)
		.zadd(self.key_mtime(self.req.body.params.tofolder), now, self.req.body.params.thenote.id)
	 	.exec(function (err, replies) {
			self.log("SaveNote got " + replies.length + " replies");
			replies.forEach(function (reply, index) {
				self.log("Reply " + index + ": " + reply.toString());

			});
			next(null, 4);
		});
	self.log('Leaving savenote');
},

notifychange: function(tofolder, update) {
	var self = this;
	self.log("Notify: ");
	self.dir(update);
	if (self.io) self.io.sockets.emit(tofolder, update);
},

api_appendtonote: function() {
	var self = this;
	self.redis.hget(self.key_note(self.req.body.params.tofolder), 
		self.req.body.params.noteid, function(err, notetext) {

		if (notetext) {
			var note = JSON.parse(notetext);
			self.log('Append: note ' + typeof(note));
			self.dir(note);

			if (note.text) note.text = note.text + self.req.body.params.text;
			else note.text = self.req.body.params.text;

			self.api_savenote();
		}
	});
},

api_sync: function() {

	var self = this;
	self.res.newlastupdate = new Date().getTime();

	// TODO: HGETALL would save a server roundtrip here
	if (self.req.body.params.lastupdate == 0) {
		self.redis.hkeys(self.key_note(self.req.body.params.fromfolder), function(err, noteids) {
			self.sync_sendupdates(noteids);
		});
	}
	else {
		self.redis.zrangebyscore(self.key_mtime(self.req.body.params.fromfolder), 
			self.req.body.params.lastupdate, self.res.newlastupdate, function(err, noteids) {
			self.sync_sendupdates(noteids);
		});
	}
},

sync_sendupdates: function(noteids) {

	var self = this;
	self.redis.hmget(self.key_note(self.req.body.params.fromfolder), noteids, function(err, notes) {
		if (notes) {
			self.log("Syncing notes:");
			self.dir(notes);
			self.addupdate(['beginupdate','']);
			for (var i=0; i<notes.length; i++) {
				var note = JSON.parse(notes[i]);
				self.addupdate(['updatenote', note]);
			}
			self.addupdate(['endupdate','']);
		}
		self.addupdate(['setupdatetime', self.res.newlastupdate.toString()]);
		self.sendreply();
	});
},

api_sendnote: function() {
	var self = this;
	self.redis.multi()
		.hget(self.key_note(self.req.body.params.fromfolder), self.req.body.params.noteid)
		.incr(self.key_nextid(self.req.body.params.tofolder))
		.exec(function(err, reply) {

			// Bug: crash here on Duplicate Note: note is null?!
			self.log('Send note bulk reply: ');
			self.dir(reply);

			var note = JSON.parse(reply[0]);
			self.log('Fetched note: ' + typeof(note));
			self.dir(note);
			note.id = reply[1].toString();
			self.log('New note id: ' + note.id);
			var now = new Date().getTime();

			self.redis.multi()
				.hset(self.key_note(self.req.body.params.tofolder), note.id, JSON.stringify(note))
				.zadd(self.key_mtime(self.req.body.params.tofolder), now, note.id)
				.exec(function(err, reply) {

					if (self.req.body.params.tofolder == self.req.body.params.notifyfolder)
						self.addupdate(['updatenote', note]);

					if (!('deleteoriginal' in self.req.body.params) || self.req.body.params.deleteoriginal) {
						self.redis.multi()
							.hdel(self.key_note(self.req.body.params.fromfolder), self.req.body.params.noteid)
							.zrem(self.key_mtime(self.req.body.params.fromfolder), self.req.body.params.noteid)
							.exec(function(err, reply) {
								self.addupdate(['deletenote', self.req.body.params.noteid]);
								self.sendreply();
							});
					}
					else self.sendreply();
				});
		});
},

api_postevent: function() {
	this.log('PostEvent via api:');
	this.dir(this.req.body.params);
	//io.socket.send(this.res.body.params.
	return this.sendreply();
},

api_getnotes: function() {
	var self = this;
	self.redis.hgetall(self.key_note(self.req.body.params.fromfolder), function(err, jsonnotes) {
		if (!jsonnotes) return;
		//self.log("Got notes from " + req.body.params.fromfolder);
		//self.dir(json_notes);
		var parsed_notes = {};
		for (var n in jsonnotes) {
			var note = JSON.parse(jsonnotes[n]);
			parsed_notes[note.id] = note;
		}
		
		self.addupdate(['notes', parsed_notes]);
		self.sendreply();
	});
},

key_folderquery: function(user) {
	return this.key_note(user + '/*');
},

api_getfolderlist: function() {
	var self = this;

	// Todo: should use session username
	self.redis.keys(self.key_folderquery(self.req.body.params.user), function(err, keylist) {
		var folderlist = [];
		keylist.forEach(function(key) {
			folderlist.push(key.substr(6));	// prune off 'notes/'
		});
		self.addupdate(['folderlist', folderlist]);
		self.sendreply();
	});
},

api_createfolder: function() {
	this.api_openfolder();
},

api_openfolder: function() {
	this.res.updatelist.push(['navigateto', '/folder/' + this.req.body.params.tofolder]);
	this.sendreply();
},

effectiveuser: function() {
	return this.req.session.loggedin ? this.req.session.username : 'guest';
},

navigatehome: function() {
	var self = this;
	if (self.req.session.loggedin) {
		self.addupdate([
			'navigateto', 
			'/folder/' + self.effectiveuser() + '/' + self.inboxfolder
		]);
	}
	else self.addupdate(['navigateto', '/']);
},

deletefolder: function(folder, execfunc) {
	var self = this;
	// BUG: need that evil filename character check here!
	self.redis.multi()
		.del(self.key_note(folder))
		.del(self.key_mtime(folder))
		.del(self.key_nextid(folder))
		.del(self.key_foldermeta(folder))
		.exec(execfunc());
},

api_deletefolder: function() {
	var self = this;
	self.deletefolder(self.req.body.params.fromfolder, function(err, replies) {
		self.navigatehome();
		self.sendreply();
	});
},

api_emptytrash: function() {
	var self = this;
	self.deletefolder(self.effectiveuser() + '/trash', function(err, replies) {
		self.addupdate(['say', 'The trash is empty.']);
		self.sendreply();
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

api_createuser: function() {
	this.initsessiondata();
	this.save_password_hash(self.req.body.params.username, self.req.body.params.password);
	this.navigatehome();
	this.sendreply();
},

inboxfolder: 'inbox',

save_password_hash: function(user, passwordhash) {
	var self = this;
	self.redis.set(self.key_usermeta(user), passwordhash, function(err, reply) {
		self.addupdate(['say','Password saved.']);
	});
},

key_foldermeta: function(folder) {
	return 'fldr/' + folder;
},

api_setfolderacl: function() {

	var self = this;
	var acl = {};
	if (self.req.body.params.editors) acl.editors = self.req.body.params.editors;
	if (self.req.body.params.readers) acl.readers = self.req.body.params.readers;
	if (self.req.body.params.senders) acl.senders = self.req.body.params.senders;
	if (self.req.body.params.password) acl.password = self.req.body.params.password;

	self.log("SetACL " + self.req.body.params.tofolder);
	self.dir(acl);

	self.redis.hmset(self.key_foldermeta(self.req.body.params.tofolder), acl, function(err, reply) {
		self.addupdate(['say','Folder permissions updated.']);
		self.sendreply();
	});
},

api_knockknock: function() {
	this.req.session.nonce = this.randomName(32);	// save login nonce
	this.res.updatelist.push(['whosthere', this.req.session.nonce]);
	this.sendreply();
},

api_login: function() {
	// fetch username passwordhash
	var self = this;
	self.redis.get(self.key_usermeta(self.req.body.params.username), function(err, passwordhash) {

		if (!passwordhash) {
			self.clearsessiondata();
			self.senderror('Invalid login.');
			return;
		}

		var salted_hash = crypto.createHash('sha1')
							.update(passwordhash + self.req.session.nonce)
							.digest('hex');
		self.log('Login: saved  hash ' + passwordhash);
		self.log('Login: saved nonce ' + self.req.session.nonce);
		self.log('Login: salted hash ' + salted_hash);
		self.log('Login: client hash ' + self.req.body.params.passwordhash);
		if (salted_hash == self.req.body.params.passwordhash) {
			self.initsessiondata();
			self.navigatehome();
			self.sendreply();
		}
		else {
			self.clearsessiondata();
			self.senderror('Invalid login.');
		}
	});
},

initsessiondata: function() {
	this.req.session.loggedin = true;
	this.req.session.username = this.req.body.params.username;
	delete this.req.session.nonce;
},

clearsessiondata: function() {
	delete this.req.session.loggedin;
	delete this.req.session.username;
	delete this.req.session.nonce;
},

api_logout: function() {
	this.clearsessiondata();
	this.addupdate(['navigateto', '/']);
	this.sendreply();
},

loadfile: function(filename, next) {
	var self = NoteSoup;
	if (filename.charAt(0) == '.') {
		self.log('Skipping system file ' + filename);
		next();
		return;
	}
	self.log('Loading ' + self.load.directory + '/' + filename + ' ' + self.load.tofolder);

	var filepath = self.load.directory + '/' + filename;
	var filetext = fs.readFileSync(filepath, 'utf8');		// specifying 'utf8' to get a string result
	var note = JSON.parse(filetext);

	// Clean up the note a bit
	if (note.bgcolor == '#FFFF99') delete note.bgcolor;
	if (note.bgcolor == '#ffff99') delete note.bgcolor;
	if ('syncme' in note) delete note.syncme;
	if (note.imports) note.imports = note.imports.replace('http://chowder.notesoup.net', '');
	if (note.backImage) note.backImage = note.backImage.replace('http://notesoup.net', '');
	delete note.feedstr;
	delete note.feeddata;

	self.redis.incr(self.key_nextid(self.load.tofolder), function(err, id) {

		note.id = id.toString();
		note.mtime = new Date().getTime();
		var jsonnote = JSON.stringify(note);

		self.redis.multi() 
			.hset(self.key_note(self.load.tofolder), note.id, jsonnote)
			.zadd(self.key_mtime(self.load.tofolder), note.mtime, note.id)
			.exec(function (err, replies) {
				next();
			});
	});
},

loadfolder: function(directory, tofolder) {

	var self = this;
	var files = fs.readdirSync(directory);

	self.load = {};
	self.load.directory = directory;
	self.load.tofolder = tofolder;
	self.log('Loading directory ' + directory + ' to ' + tofolder);
	async.forEach(files,
		self.loadfile,
		function(err) { 
			if (err) self.log('Loadfolder: ' + err); 
		}
	);
	self.log('Folder load complete.');
},


loaduser: function(user) {

	var userpath = __dirname + '/templates/soupbase/' + user;
	var folders = fs.readdirSync(userpath);
	var responses_pending = 0;
	var self = this;

	async.forEachSeries(folders,
		function(foldername, next) {
			self.log('Loading folder ' + user + '/' + foldername);
			self.loadfolder(userpath + '/' + foldername, user + '/' + foldername);
			next();
		},
		function(err, replies) {
			self.log('Loaduser complete.');
			self.sendreply();
		}
	);
}

};	// NoteSoup = {...};

module.exports = NoteSoup;
