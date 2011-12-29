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
		console.log("Redis Error " + err);
	});
},

dispatch_old: function(req, res) {
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

dispatch: function(req, res) {
	var self = this;
	this.req = req;
	this.res = res;
	self.res.updatelist = [];
	
	self.log('dispatching api req: ' + req.body.method);
	self.dir(req.body.params);

	async.series(
		[self.validatemethod, self.validateaccess, self.execute],
		function(err, reply) {
			if (err) {
				//self.senderror(err);
				self.addupdate(['navigateto', '/folder/system/accesserror']);
				self.sendreply();
			}
		}
	);
},

validatemethod: function(next) {
	var self = NoteSoup;
	if (typeof(self['api_' + self.req.body.method]) != 'function') {
		self.log('No method for request: ');
		self.dir(self.req.body);
		next('The server does not know how to ' + self.req.body.method);
	}
	else if (!self.req.body.method in self.acl_checklist) {
		self.log('No acl for method: ' + self.req.body.method);
		next('ACL error');
	}
	next(null);
},

validateaccess: function(next) {
	var self = NoteSoup;
	//next(null, 'Everybody has root!');		// enable this for wide-open soup
	//next('No soup for you');				// enable this for closed soup
	//return;

	var aclcheck = self.acl_checklist[self.req.body.method];
	if (!aclcheck) {
		next(null);		// 'No acl check string?!');
		return;
	}

	self.log('aclcheck: ' + aclcheck);

	while (aclcheck.length) {

		// determine the level of access required for the function
		var accessmode;
		if (aclcheck[1] == 'o') accessmode = 'owners';
		else if (aclcheck[1] == 'e') accessmode = 'editors';
		else if (aclcheck[1] == 's') accessmode = 'senders';
		else accessmode = 'readers';

		// now determine whether we're checking tofolder or fromfolder
		var folder;
		if (aclcheck[0] == 't') folder = self.req.body.params.tofolder;
		else if (aclcheck[0] == 'f') folder = self.req.body.params.fromfolder;

		self.log('validateaccess: folder ' + folder + ' ' + accessmode);
		self.dir(self.req.body.params);
		aclcheck = aclcheck.substring(2);	// prune off what we handled

		self.hasaccess(self.effectiveuser(), folder, accessmode, next);
	};
	//next(null);
},

execute: function(next) {
	var self = NoteSoup;
	//this['api_'+req.body.method]();
	//self.call(self['api_' + self.req.body.method]);
	NoteSoup['api_' + self.req.body.method]();
	next(null);
},


acl_checklist: {
	'savenote': 		'ts',
	'appendtonote': 	'ts',		// should be editors?  or is this a hack?
	'sendnote': 		'tsfr',		// ts+deleteoriginal ? fe : fr, the api upgrades
	'getnote': 			'fr',
	'getfolder': 		'fr',
	'openfolder': 		'fr',
	'sync': 			'fr',
	'gettemplatelist': 	'fr',		// fromfolder case: 'fr' else uses user templates
	'getnotes': 		'fr',
	'deletefolder': 	'fo',
	'copyfolder': 		'frts',		// +destination folder create is required ? to : ts
	'getfolderacl': 	'to',
	'setfolderacl': 	'to'
},

isvalidfoldername: function(foldername) {
	if (foldername.split('/').length != 2) return false;
	return true;
},

getuserpart: function(folder) {
	return folder.split('/')[0];
},

hasaccess: function (requestor, tofolder, accessmode, next) {
	var self = this;
	self.log('hasaccess: requestor ' + requestor);
	self.log('hasaccess: tofolder ' + tofolder);
	self.log('hasaccess: accessmode ' + accessmode);
	var result = self.getaccess(requestor, tofolder, accessmode, next);

/***
	// read and append inherit from edit so appeal a "no" to the higher priv
	if (!result && ((accessmode == this.readers) || (accessmode == this.senders)))
		return self.getaccess(requestor, tofolder, this.editors);

	self.log("hasAccess: " + requestor + ' ' + tofolder + ' ' + accessmode + ' ' + result);
	return result;
***/
},

readers: 'readers',
editors: 'editors',
senders: 'senders',
owners: 'owners',

getaccess: function(requestor, tofolder, accessmode, next) {
	var self = this;
	if (!self.isvalidfoldername(tofolder)) return false;
	
	// TODO: Can't access non-existent user/folder
	
	// A user has full access to her own folders...
	// ...as does the systemuser
	var owner = self.getuserpart(tofolder);
	self.log('owner ' + owner + ' requestor ' + requestor);
	if ((requestor == owner) || (requestor == self.systemuser)) {
		next(null, tofolder);
		return;
	}
	
	// Accessing another user's data - check the permissions
	//accessstring = self.getAccess(tofolder, accessmode)
	self.redis.hget(self.key_foldermeta(tofolder), accessmode, function(err, accessstring) {

		if (self.err) next('Key error.');
		if (!accessstring) accessstring = '';	// act like -*, deny below
		accessstring = accessstring.trim();
		self.log('getaccess: ' + accessmode + ' [' + accessstring + ']');

		// TODO: regexp matching for domain-based group permissions like *.example.com
		// For now, *, -* and username, -username, separated by commas
		// -@ means "anyone but guest"
		var access = false;
		var specifiers = accessstring.split(',');
		for (var i=0; i < specifiers.length; i++) {
			var a = specifiers[i];
			self.log('access string frag: ' + a);
			if (a == '') continue;		// skip empty/null items
			if (a[0] == '-') {			// Process DENY items
				if (a.length < 2) break;	// naked '-'
				var denied = a.substr(1);
				if ((denied == '*') || (denied == requestor)) break;	// deny
				if (denied == '@') {									// deny guest
					access = (requestor == self.guestuser);
					break;
				}
			}
			else if ((a == '*') || (a == requestor)) {
				access = true;		// allow
				break;
			}
			else if (a == '@') {
				access = (requestor != self.guestuser);		// allow non-guest
				break;
			}
		}

		if (access) {
			self.log('Access granted.');
			next(null, tofolder);
		}
		else {
			self.log('Access denied.');
			next("Access denied.");
		}
	});
},

systemuser: 'system',
guestuser: 'guest',

// Redis key mapping
//
key_note: function(folder) 		{ return 'notes/' + folder; },
key_mtime: function(folder) 	{ return 'mtime/' + folder; },
//key_nextid:  function(folder)	{ return 'next/'  + folder; },
key_nextid:  function(folder)	{ return 'stats/notes_created'; },

log: function(text) {
	console.log(text);
},

dir: function(thing) {
	console.log(util.inspect(thing, false, 5, true));
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
			
			self.req.body.params.note = note;
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

	self.log("apisendnote:");
	self.dir(self.req.body.params);

	// if a single id was passed in, coerce it to a list
	if (typeof(self.req.body.params.noteid) == 'string')
		self.req.body.params.noteid = [self.req.body.params.noteid];

	//self.dir(self.req.body.params);
	
	async.forEachSeries(self.req.body.params.noteid,
		function(noteid, next) {
			self.sendnote(noteid, function(err, reply) {
				next(null, noteid);
			});
		},
		function(err, reply) {
			self.sendreply();
		});
},

sendnote: function(noteid, next) {
	var self = NoteSoup;
	self.redis.multi()
		.hget(self.key_note(self.req.body.params.fromfolder), noteid)
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
							.hdel(self.key_note(self.req.body.params.fromfolder), noteid)
							.zrem(self.key_mtime(self.req.body.params.fromfolder), noteid)
							.exec(function(err, reply) {
								if (self.req.body.params.fromfolder == self.req.body.params.notifyfolder)
									self.addupdate(['deletenote', noteid]);
								next(null, noteid);
							});
					}
					else next(null, noteid);
				});
		});
},

api_postevent: function() {
	this.log('PostEvent via api:');
	this.dir(this.req.body.params);
	//io.socket.send(this.res.body.params.
	return this.sendreply();
},

getTemplates: function(folder, next) {
	var self = this;
	self.redis.hgetall(self.key_note(folder), function(err, jsonnotes) {
		//self.log('getTemplates:');
		//self.dir(jsonnotes);
		if (!jsonnotes) {
			next('no notes');
			return;
		}
		for (var n in jsonnotes) {
			var note = JSON.parse(jsonnotes[n]);
			self.res.templatelist.push([folder, note, note.notename || 'untitled']);
		}
		// sort by item[2], the notename
		self.res.templatelist.sort(function(a,b) {
			if (a[2] > b[2]) return 1;
			if (a[2] == b[2]) return 0;
			if (a[2] < b[2]) return -1;
		});
		next(null);
	});
},

templatefolder: 'templates',

api_gettemplatelist: function() {
	var self = this;
	self.res.templatelist = [];

	// the portable hole uses the fromfolder form
	if (self.req.body.params.fromfolder) {
		self.getTemplates(self.req.body.params.fromfolder, function() {
			self.addupdate(['templatelist', self.res.templatelist]);
			self.sendreply();
		});
	}

	else self.getTemplates(self.systemuser + '/' + self.templatefolder, function() {
		self.getTemplates(self.effectiveuser() + '/' + self.templatefolder, function() {
			self.addupdate(['templatelist', self.res.templatelist]);
			self.sendreply();
		});
	});
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
		folderlist.sort();
		self.addupdate(['folderlist', folderlist]);
		self.sendreply();
	});
},

api_createfolder: function() {
	this.api_openfolder();
},

api_openfolder: function() {
	this.res.updatelist.push(['navigateto', '/folder/' + this.req.body.params.fromfolder]);
	this.sendreply();
},

effectiveuser: function() {
	return this.req.session.loggedin ? this.req.session.username : this.guestuser;
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
	return 'user/' + user;
},
passwordattr: 'password',

api_createuser: function() {
	this.initsessiondata();
	this.save_password_hash(this.req.body.params.username, this.req.body.params.password);
	this.navigatehome();
	this.sendreply();
},

inboxfolder: 'inbox',

save_password_hash: function(user, passwordhash) {
	var self = this;
	self.redis.hset(self.key_usermeta(user), self.passwdattr, passwordhash, function(err, reply) {
		self.addupdate(['say','Password saved.']);
	});
},

key_foldermeta: function(folder) {
	return 'fldr/' + folder;
},

api_getfolderacl: function() {
	var self = this;
	self.redis.hgetall(self.key_foldermeta(self.req.body.params.tofolder), function(err, acl) {
		if (err) {
			self.log('getfolderacl: error');
			self.dir(err);
			return;
		}
		acl.folder = self.req.body.params.tofolder;
		self.addupdate(['folderacl', acl]);
		self.sendreply();
	});
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
	self.redis.hget(self.key_usermeta(self.req.body.params.username), 
		self.passwordattr, function(err, passwordhash) {

		self.log('login: ' + self.req.body.params.username);
		self.dir(passwordhash);

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


// File Import

loadfile: function(fromdirectory, filename, tofolder) {
	var self = NoteSoup;
	self.log('Loadfile: ' + filename);

	var aclfiles = ['.readers','.editors','.senders'];
	var aclattrs = ['readers','editors','senders'];
	var aclindex = aclfiles.indexOf(filename);
	if (aclindex >= 0) {
		self.log('handling folder attribute file: ' + filename);
		
		var filepath = self.load.fromdirectory + '/' + filename;
		self.log('filepath: ' + filepath);
		var filetext = fs.readFileSync(filepath, 'utf8');		// specifying 'utf8' to get a string result
		filetext = filetext.trim();

		self.redis.hset(self.key_foldermeta(tofolder), aclattrs[aclindex], filetext, 
			function(err, reply) {
				self.log('folder attribute set: ' + tofolder + ' ' + aclattrs[aclindex] + ' ' + filetext);
				//nextfolder(null, foldername);
			}
		);
		return;
	}
	else if (filename.charAt(0) == '.') {
		self.log('Skipping unhandled system file ' + filename);
		//nextfile(null, filename);
		return;
	}

	var filepath = fromdirectory + '/' + filename;

	self.log('filepath: ' + filepath);

	var filetext = fs.readFileSync(filepath, 'utf8');		// specifying 'utf8' to get a string result

	//self.log('filetext: ' + filetext);
	
	var note = JSON.parse(filetext);

	// Clean up the note a bit
	if (note.bgcolor == '#FFFF99') delete note.bgcolor;
	if (note.bgcolor == '#ffff99') delete note.bgcolor;
	if (note.imports) note.imports = note.imports.replace('http://chowder.notesoup.net', '');
	if (note.backImage) note.backImage = note.backImage.replace('http://notesoup.net', '');

	// Nuke some fields entirely
	killfields = ['syncme','showme','feedstr','feeddata','from'];
	for (var k in killfields) delete note[k];

	// Map fields to new squeezenote format

	self.redis.incr(self.key_nextid(tofolder), function(err, id) {

		note.id = id.toString();
		//note.mtime = new Date().getTime();
		mtime = new Date().getTime();
		var jsonnote = JSON.stringify(note);

		self.redis.multi() 
			.hset(self.key_note(tofolder), note.id, jsonnote)
			.zadd(self.key_mtime(tofolder), mtime, note.id)
			.exec(function (err, replies) {
				//nextfile(null, filename);
			});
	});
},

loadfolder: function(foldername, nextfolder) {
	var self = NoteSoup;
	self.log('Loadfolder: fromdirectory: ' + self.load.fromdirectory);
	self.log('Loadfolder: tofolder: ' + self.load.tofolder);

	if (foldername.charAt(0) == '.') {
		self.log('handling system folder/file ' + foldername);
		if (foldername == '.userinfo') {
			self.log('converting password file');
			var filepath = self.load.fromdirectory;		// misnomer, it's the full file path
			self.log('filepath: ' + filepath);
			var filetext = fs.readFileSync(filepath, 'utf8');		// specifying 'utf8' to get a string result
			filetext = filetext.trim();

			self.redis.hset(self.key_usermeta(self.load.fromuser), self.passwordattr, filetext, 
				function(err, reply) {
					self.log('password set');
					nextfolder(null, foldername);
				}
			);
			return;
		}
		else {	// not .password, we're done
			self.log('Skipping unhandled .file: ' + foldername);
			nextfolder(null, foldername);
			return;
		}
	}

	var files = fs.readdirSync(self.load.fromdirectory);
	self.dir(files);
	async.forEachSeries(files,
		function(filename, nextfile) {
			NoteSoup.loadfile(self.load.fromdirectory, filename, self.load.tofolder);
			nextfile(null, filename);
		},
		function(err, reply) { 
			if (err) self.log('Loadfolder: ' + err); 
			else {
				self.log('Loadfolder complete.');
				self.dir(reply);
				nextfolder(null, foldername);
			}
		}
	);
},

loaduser: function(user) {
	var self = this;
	self.load = {};
	var userpath = __dirname + '/templates/soupbase/' + user;
	var folders = fs.readdirSync(userpath);
	self.log('Loading user: ' + user);
	self.load.fromuser = user;
	self.dir(folders);
	async.forEachSeries(folders,
		function(foldername, nextfolder) {
			//if (!self.load) self.load = {};
			self.load.fromdirectory = userpath + '/' + foldername;
			self.load.tofolder = user + '/' + foldername;
			NoteSoup.loadfolder(foldername, function(err, reply) {
				nextfolder(null, foldername);
			});
		},
		function(err, reply) {
			self.log('Loaduser complete.');
			self.dir(reply);
		}
	);
}

};	// NoteSoup = {...};

module.exports = NoteSoup;
