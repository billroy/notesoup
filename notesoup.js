/*****
	Note Soup server for node.js / redis
	
	Copyright 2011-2012 by Bill Roy.

	Redistribution and use in source and binary forms, with or without modification, 
	are permitted provided that the following conditions are met:
	
		-	Redistributions of source code must retain the above copyright notice, 
			this list of conditions and the following disclaimer.
		-	Redistributions in binary form must reproduce the above copyright notice, 
			this list of conditions and the following disclaimer in the documentation 
			and/or other materials provided with the distribution.
		-	Neither the name of the authors nor the names of its contributors may be
			used to endorse or promote products derived from this software without 
			specific prior written permission.
	
	THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
	"AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
	LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
	A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR
	CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
	EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
	PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
	PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
	LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
	NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
	SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

*****/

/*****
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
var rl = require('readline');
var fs = require('fs');


var NoteSoup = {

// Server configuration
//
opensignup: true,		// when true, anyone, not just 'system', can add a user
enablepush: true,		// true to enable the interworkspace transporter
locked:		false,		// true to disable all access to the soup
wideopen:	false,		// true to disable all access control


connect: function(redis_url) {
	var self = this;
	if (redis_url) {
		self.log("Connecting to Redis at " + redis_url);
		self.redis = require('redis-url').connect(redis_url);
	}
	else {
		self.log("Connecting to local Redis");
		self.redis = require("redis").createClient();		// port, host, options
	}
	
	self.redis.on("error", function (err) {
		console.log("Redis Error: " + err);
	});

	self.initdatabase();

	// init socket.io
	if (self.enablepush) {
		self.io = require('socket.io').listen(self.app);
		self.io.sockets.on('connection', function(socket) {
			console.log('Socket connection accepted.');
			//console.log(util.inspect(socket, 3));
			socket.on('subscribe', function(request) {
				console.log('Subscription request:');
				console.dir(request);
				socket.on(request.channel, function(msg) {
					self.io.sockets.emit(request.channel, msg);
				});
			});
		});
	}

	return self;
},

workspace_template: null,

load_workspace_template: function() {
	var self = this;
	self.workspace_template = fs.readFileSync(__dirname + '/templates/index.html', 'utf-8');
},

renderworkspace: function(req, res) {
	var self = NoteSoup;
	console.log('Render folder ' + req.params.user + ' ' + req.params.folder);

	if (self.locked) {
		res.redirect('Service unavailable.  Please try again later.', 503);
		return;
	}

	// marshall like an api call so we can use the API's ACL-check pipeline handlers
	self.req = req;
	self.res = res;
	self.req.body.method = 'openfolder';
	if (!self.req.body.params) self.req.body.params = {};
	self.req.body.params.fromfolder = req.params.user + '/' + req.params.folder;
	self.res.updatelist = [];
	self.req.starttime = new Date().getTime();

	async.series([
			self.loadfromacl, 
			self.validateaccess,
			self.sendworkspace
		],
		function(err, reply) {
			if (err) res.redirect('/folder/system/accesserror');
		});
},


sendworkspace: function(next) {
	var self = NoteSoup;

	// provision the client options	
	// TODO: hook up real ACL
	var opts = {
		loggedin:	self.req.session.loggedin || false,
		username:	self.req.session.username || 'guest',
		foldername:	self.req.params.user + '/' + self.req.params.folder,
		isowner:	self.req.session.loggedin && (self.req.session.username == self.req.params.user)
		//iseditor:	true,
		//isreader:	true,
		//issender:	true,
		//ispublic:	true
		//initnotes:{}
	};

	// render index.html as a template with these options
	if (!self.workspace_template) self.load_workspace_template();
	var this_page = self.workspace_template;

	var string_opts = JSON.stringify(opts);
	console.log('Rendering options:');
	console.log(string_opts);
	self.res.send(this_page.replace('\'{0}\'', string_opts));
	next(null);
},


dispatch: function(req, res) {
	var self = this;
	this.req = req;
	this.res = res;
	self.res.updatelist = [];
	self.req.starttime = new Date().getTime();
	
	self.log('*********************************************************************');
	self.log('dispatching api req: ' + req.body.method);
	self.log('*********************************************************************');
	self.dir(req.body.params);

	async.series([
			self.validatemethod, 
			self.loadfromacl, 
			self.loadtoacl, 
			self.validateaccess, 
			self.execute
		],
		function(err, reply) {
			if (err) {
				self.senderror(err);
				//self.addupdate(['navigateto', '/folder/system/accesserror']);
				//self.sendreply();
			}
		});
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

loadfromacl: function(next) {
	var self = NoteSoup;
	self.loadfolderacl('fromfolder', next);
},

loadtoacl: function(next) {
	var self = NoteSoup;
	self.loadfolderacl('tofolder', next);
},


// todo: don't fetch a folder if it's already in the acl

loadfolderacl: function(fieldname, next) {
	var self = NoteSoup;
	if (!self.req.acl) self.req.acl = {};

	self.log('loadfolderacl: ' + fieldname + ' ' + self.req.body.params[fieldname]);
	//self.dir(self.req.body.params);

	if (typeof(self.req.body.params[fieldname]) == 'undefined') {
		self.log('no arg ' + fieldname);
		next(null);
		return;
	}

	var folder = self.req.body.params[fieldname];	// fetch fromfolder or tofolder
	
	self.log('Loadfolderacl: ' + fieldname + ' ' + folder);

	if (!self.isvalidfoldername(folder)) {
		next('Invalid folder name.');
	}
	else if (folder in self.req.acl) next(null);	// if we already have it, don't reread it
	else if (folder) {
		self.redis.hgetall(self.key_foldermeta(folder), function (err, folderdata) {
			if (err) {
				self.log('Error fetching folder acl: ' + folder);
				next('Error fetching folder acl.');
				return;
			}
			self.req.acl[folder] = folderdata;
			self.log('loadfolderacl: ');
			self.dir(self.req.acl);
			next(null);
		});
	}
	else next(null);
},

validateaccess: function(next) {
	var self = NoteSoup;

	if (self.wideopen) {
		next(null, 'Everybody has root!');
		return;
	}
	if (self.locked) {
		next('System locked.');
		return;
	}

	var aclcheck = self.acl_checklist[self.req.body.method];
	if (!aclcheck) {
		self.log('validateaccess: *** no acl check for api: ' + self.req.body.method);
		next(null);		// 'No acl check string?!');
		return;
	}

	self.log('aclcheck: ' + aclcheck);

	while (aclcheck.length) {

		// determine the level of access required for the function
		var accessmode;
		if (aclcheck[1] == 'o') accessmode = self.owners;
		else if (aclcheck[1] == 'e') accessmode = self.editors;
		else if (aclcheck[1] == 's') accessmode = self.senders;
		else accessmode = self.readers;

		// now determine whether we're checking tofolder or fromfolder
		var folder;
		if (aclcheck[0] == 't') folder = self.req.body.params.tofolder;
		else if (aclcheck[0] == 'f') folder = self.req.body.params.fromfolder;
		else next('bad acl spec');

		self.log('validateaccess: folder ' + folder + ' ' + accessmode);
		//self.dir(self.req.body.params);
		aclcheck = aclcheck.substring(2);	// prune off what we handled

		if (!self.hasaccess(self.effectiveuser(), folder, accessmode)) {
			self.log('Access denied.');
			next("Access denied.");
			return;
		}
	}
	self.log('Access granted.');
	next(null);
},

execute: function(next) {
	var self = NoteSoup;
	//this['api_'+req.body.method]();
	//self.call(self['api_' + self.req.body.method]);
	NoteSoup['api_' + self.req.body.method]();
	next(null);
},


// Encoded folder access requirements for command ACL checks
//
// ts: tofolder requires sender permission or better
// fr: fromfolder requires reader
// to: tofolder requires owner
//
acl_checklist: {
	'savenote': 		'ts',
	'appendtonote': 	'ts',		// should be editors?  or is this a hack?
	'sendnote': 		'tsfr',		// ts+deleteoriginal ? fe : fr, the api upgrades
	'getnote': 			'fr',
	'getfolder': 		'fr',
	'openfolder': 		'fr',
	'sync': 			'fr',
	'gettemplatelist': 	'fr',
	'getnotes': 		'fr',
	'createfolder':		'to',
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

readers: 'readers',
editors: 'editors',
senders: 'senders',
owners: 'owners',


hasaccess: function (requestor, tofolder, accessmode) {
	var self = this;
	//self.log('hasaccess: requestor ' + requestor);
	//self.log('hasaccess: tofolder ' + tofolder);
	//self.log('hasaccess: accessmode ' + accessmode);
	var result = self.getaccess(requestor, tofolder, accessmode);

	// read and append inherit from edit so appeal a "no" to the higher priv
	if (!result && ((accessmode == this.readers) || (accessmode == this.senders))) {
		result = self.getaccess(requestor, tofolder, this.editors);
	}
	self.log("hasAccess: " + requestor + ' ' + tofolder + ' ' + accessmode + ' ' + result);
	return result;
},

getaccess: function(requestor, tofolder, accessmode) {
	var self = this;
	if (!self.isvalidfoldername(tofolder)) return false;
	
	// TODO: Can't access non-existent user/folder
	
	// A user has full access to her own folders...
	// ...as does the systemuser
	var owner = self.getuserpart(tofolder);
	//self.log('owner ' + owner + ' requestor ' + requestor);
	if ((requestor == owner) || (requestor == self.systemuser)) {
		return true;
	}

	// Accessing another user's data - check the permissions
	//accessstring = self.getAccess(tofolder, accessmode)
	if (!self.req.acl[tofolder]) {
		self.log('getaccess: folder not in acl cache: ' + tofolder);
		return false;
	}

	var accessstring = self.req.acl[tofolder][accessmode];	// get access string from acl{}
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
		//self.log('access string frag: ' + a);
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
	return access;
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

	this.log('Error:');
	this.dir(reply);
	this.log('dt=' + this.req.time + 'ms');

	this.res.send(reply);
},

sendreply: function() {

	var reply = {
		result: '',
		error: null,
		id: this.req.body.id,
		command: this.res.updatelist
	};

	this.req.endtime = new Date().getTime();
	this.req.time = this.req.endtime - this.req.starttime;
	this.log('Reply:');
	this.dir(reply);
	this.log('dt=' + this.req.time + 'ms');

	this.res.send(reply);
},


// generic end-of-api-call result handler
simpleReply: function(err, reply) {
	var self = NoteSoup;
	if (err) self.senderror(err);
	else self.sendreply();
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
				next(err);
			});
		},
		self.simpleReply);
},

checkid: function(next) {
	var self = NoteSoup;

	//console.log('Checkid: this');
	//console.dir(this);
	
	self.log('Checkid: params');
	self.dir(self.req.body.params);	

	if (!self.req.body.params.thenote.id) {
		self.redis.incr(self.key_nextid(self.req.body.params.tofolder), function(err, id) {
			if (err) next(err);
			self.req.body.params.thenote.id = id.toString();
			next(null, 1);
		});
	}
	else next(null, 2);
	//self.log('Leaving checkid');
},

addupdate: function(update) {
	var self = this;
	self.log("addupdate:");
	self.dir(update);
	self.res.updatelist.push(update);
	//self.notifychange(self.req.body.params.tofolder, update);
},

savenote: function(next) {
	var self = NoteSoup;
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

		if (err) self.senderror(err);
		else if (!notetext) self.senderror('Note?');
		else {
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

	if (self.req.body.params.lastupdate == 0) {
		self.redis.hgetall(self.key_note(self.req.body.params.fromfolder), function(err, notes) {
			if (err) {
				self.senderror(err);
				return;
			}
			self.log('First sync:');
			self.dir(notes);
			self.addupdate(['beginupdate','']);
			for (var id in notes) {
				var note = JSON.parse(notes[id]);
				self.addupdate(['updatenote', note]);
			}
			self.addupdate(['endupdate','']);
			self.addupdate(['setupdatetime', self.res.newlastupdate.toString()]);
			self.sendreply();
		});
	}
	else {
		self.redis.zrangebyscore(self.key_mtime(self.req.body.params.fromfolder), 
			self.req.body.params.lastupdate, self.res.newlastupdate, function(err, noteids) {
				if (err) {
					self.senderror(err);
					return;
				}
				if (!noteids.length) {
					self.addupdate(['setupdatetime', self.res.newlastupdate.toString()]);
					self.sendreply();
					return;
				}
				self.redis.hmget(self.key_note(self.req.body.params.fromfolder), noteids, function(err, notes) {
					if (err) {
						self.senderror(err);
						return;
					}
					self.log('Syncing updated notes:');
					self.dir(notes);
					if (notes) {
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
		});
	}
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
				next(err);
			});
		}, self.simpleReply);
},

sendnote: function(noteid, next) {
	var self = NoteSoup;
	self.redis.multi()
		.hget(self.key_note(self.req.body.params.fromfolder), noteid)
		.incr(self.key_nextid(self.req.body.params.tofolder))
		.exec(function(err, reply) {

			if (err) {
				next(err);
				return;
			}

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

					if (err) {
						next(err);
						return;
					}

					if (self.req.body.params.tofolder == self.req.body.params.notifyfolder)
						self.addupdate(['updatenote', note]);

					if (!('deleteoriginal' in self.req.body.params) || self.req.body.params.deleteoriginal) {
						self.redis.multi()
							.hdel(self.key_note(self.req.body.params.fromfolder), noteid)
							.zrem(self.key_mtime(self.req.body.params.fromfolder), noteid)
							.exec(function(err, reply) {
								if (err) {
									next(err);
									return;
								}

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
	this.log('PostEvent via api: (DROPPED)');
	this.dir(this.req.body.params);
	//io.socket.send(this.res.body.params.
	return this.sendreply();
},

getTemplates: function(folder, next) {
	var self = this;
	self.redis.hgetall(self.key_note(folder), function(err, jsonnotes) {

		if (err) {
			next(err);
			return;
		}
	
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
	if (!self.req.body.params.includesystemtemplates) {
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
		if (err) {
			self.senderror(err);
			return;
		}
		else if (jsonnotes) {
			//self.log("Got notes from " + req.body.params.fromfolder);
			//self.dir(json_notes);
			var parsed_notes = {};
			for (var n in jsonnotes) {
				var note = JSON.parse(jsonnotes[n]);
				parsed_notes[note.id] = note;
			}	
			self.addupdate(['notes', parsed_notes]);
		}
		self.sendreply();
	});
},

key_folderquery: function(user) {
	return this.key_note(user + '/*');
},

api_getfolderlist: function() {
	var self = this;
	self.redis.keys(self.key_folderquery(self.effectiveuser()), function(err, keylist) {
		if (err) {
			self.senderror(err);
			return;
		}
		if (keylist.length) {
			var folderlist = [];
			keylist.forEach(function(key) {
				folderlist.push(key.substr(6));	// prune off 'notes/'
			});
			folderlist.sort();
			self.addupdate(['folderlist', folderlist]);
		}
		self.sendreply();
	});
},

api_createfolder: function() {
	var self = this;
	self.req.body.params.fromfolder = self.req.body.params.tofolder;
	self.api_openfolder();
},

api_openfolder: function() {
	var self = this;
	self.res.updatelist.push(['navigateto', '/folder/' + self.req.body.params.fromfolder]);
	self.sendreply();
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

deletefolder: function(folder, next) {
	var self = this;
	// BUG: need that evil filename character check here!
	self.redis.multi()
		.del(self.key_note(folder))
		.del(self.key_mtime(folder))
		.del(self.key_nextid(folder))
		.del(self.key_foldermeta(folder))
		.exec(function(err, reply) {
			next(err, reply);
		});
},

api_deletefolder: function() {
	var self = this;
	self.deletefolder(self.req.body.params.fromfolder, function(err, reply) {
		if (err) self.senderror(err);
		else {
			self.navigatehome();
			self.sendreply();
		}
	});
},

api_emptytrash: function() {
	var self = this;
	self.deletefolder(self.effectiveuser() + '/trash', function(err, reply) {
		if (err) self.senderror(err);
		else {
			self.addupdate(['say', 'The trash is empty.']);
			self.sendreply();
		}
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
	var self = this;
	async.series([
			self.checksignup,
			self.checkuserexists,
			self.inituser
		],
		function(err, reply) {
			if (err) self.senderror(err);
		});
},

checksignup: function(next) {
	var self = NoteSoup;
	if (!self.opensignup &&
		(!self.req.session.loggedin || (self.effectiveuser() != self.systemuser))) {
		next('Signups are closed.  Please contact the system administrator to create a new user.');
	}
	else next(null);
},

checkuserexists: function(next) {
	var self = NoteSoup;
	self.redis.hget(self.key_usermeta(self.req.body.params.username), 
		self.passwordattr, function(err, passwordhash) {
			if (err) next(null);	// error-> no password saved -> no user -> ok to create
			else next('That name is not available.');	// no error-> name taken
		});
},

inituser: function(next) {
	var self = NoteSoup;
	self.initsessiondata();
	self.save_password_hash(self.req.body.params.username, self.req.body.params.password, 
		function(err, reply) {
			if (err) self.senderror(err);
			else {
				self.navigatehome();
				self.sendreply();
			}
		}
	);
},

inboxfolder: 'inbox',

save_password_hash: function(user, passwordhash, next) {
	var self = this;
	self.redis.hset(self.key_usermeta(user), 
		self.passwordattr, 
		passwordhash, 
		function(err, reply) {
			if (err) next(err);
			else {
				self.log('Password updated for ' + user);
				self.dir(reply);
				next(null);
			}
		}
	);
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
	['readers','senders', 'editors', 'password'].forEach(
		function(fieldname, index) {
			if (self.req.body.params.hasOwnProperty(fieldname)) {
				acl[fieldname] = self.req.body.params[fieldname];
			}
		});

	self.log("SetACL " + self.req.body.params.tofolder);
	self.dir(acl);

	self.redis.hmset(self.key_foldermeta(self.req.body.params.tofolder), acl, function(err, reply) {
		if (err) self.senderror(err);
		else {
			self.addupdate(['say','Folder permissions updated.']);
			self.sendreply();
		}
	});
},

api_knockknock: function() {
	var self = this;
	self.req.session.nonce = self.randomName(32);	// save login nonce
	self.res.updatelist.push(['whosthere', self.req.session.nonce]);
	self.sendreply();
},


badlogin: function() {
	var self = this;
	self.clearsessiondata();
	self.senderror('Invalid login.');
},

api_login: function() {
	var self = this;
	self.redis.hget(self.key_usermeta(self.req.body.params.username), 
		self.passwordattr, function(err, passwordhash) {

		if (err) {
			self.log('Login hget error: ' + err);
			self.badlogin();
			return;
		}

		self.log('login: ' + self.req.body.params.username);
		self.dir(passwordhash);

		if (!passwordhash) {
			self.badlogin();
			return;
		}

		var salted_hash = crypto.createHash('sha1')
							.update(passwordhash + self.req.session.nonce)
							.digest('hex');
		//self.log('Login: saved  hash ' + passwordhash);
		//self.log('Login: saved nonce ' + self.req.session.nonce);
		//self.log('Login: salted hash ' + salted_hash);
		//self.log('Login: client hash ' + self.req.body.params.passwordhash);
		if (salted_hash == self.req.body.params.passwordhash) {
			self.initsessiondata();
			self.navigatehome();
			self.sendreply();
		}
		else {
			self.badlogin();
		}
	});
},

initsessiondata: function() {
	this.req.session.loggedin = true;
	this.req.session.username = this.req.body.params.username;
	delete this.req.session.nonce;
},

clearsessiondata: function() {
	var self = this;
	delete self.req.session.loggedin;
	delete self.req.session.username;
	delete self.req.session.nonce;
},

api_logout: function() {
	var self = this;
	self.clearsessiondata();
	self.addupdate(['navigateto', '/']);
	self.sendreply();
},


// File Import

loadfile: function(fromdirectory, filename, tofolder, next) {
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
				if (err) next(err);
				else {
					self.log('folder attribute set: ' + tofolder + ' ' + aclattrs[aclindex] + ' ' + filetext);
					next(null);
				}
			}
		);
		return;
	}
	else if (filename.charAt(0) == '.') {
		self.log('Skipping unhandled system file ' + filename);
		next(null);
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
	var killfields = ['syncme','showme','feedstr','feeddata','from'];
	for (var k in killfields) delete note[k];

	// Map fields to new squeezenote format

	self.redis.incr(self.key_nextid(tofolder), function(err, id) {
		if (err) {
			next(err);
			return;
		}
		note.id = id.toString();
		//note.mtime = new Date().getTime();
		var mtime = new Date().getTime();
		var jsonnote = JSON.stringify(note);

		self.redis.multi() 
			.hset(self.key_note(tofolder), note.id, jsonnote)
			.zadd(self.key_mtime(tofolder), mtime, note.id)
			.exec(function (err, replies) {
				if (err) next(err);
				else next(null);
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
					if (err) nextfolder(err);
					else {
						self.log('password set');
						nextfolder(null, foldername);
					}
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
			NoteSoup.loadfile(self.load.fromdirectory, filename, self.load.tofolder, 
				function(err, reply) {
					if (err) nextfile(err);
					else nextfile(null);
				});
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

loaduser: function(user, next) {
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
				if (err) nextfolder(err);
				else nextfolder(null, foldername);
			});
		},
		function(err, reply) {
			if (err) next(err);
			else {
				self.log('Loaduser complete.');
				self.dir(reply);
				next(null);
			}
		}
	);
},


// pipeline for initdb

getsystempassword: function(next) {
	var self = NoteSoup;
	var i = rl.createInterface(process.stdin, process.stdout, null);
	i.question('Enter a password for the "system" user:', function(password) {
		i.question('Enter it again:', function(password2) {
			if (password != password2) {
				self.log('Passwords do not match.  Please try again.');
				process.exit(1);
			}

			var passwordhash = crypto.createHash('sha1').update(password).digest('hex');
	
			self.log('Password hash: ' + passwordhash);
			self.save_password_hash(self.systemuser, passwordhash, 
				function(err, reply) {
	
					// per recipe from nodejs readline doc
					i.close();
					process.stdin.destroy();
					next(err);
				}
			);

		});
	});
},

setdbcreated: function(next) {
	var self = NoteSoup;
	var now = new Date();
	self.redis.set(self.key_dbcreated(), now, function(err, worked) {
		if (err) next(err);
		else next(null);
	});
},

loadsystemuser: function(next) { NoteSoup.loaduser('system', next); },
loadguestuser: function(next) { NoteSoup.loaduser('guest', next); },

key_dbcreated: function() { return 'stats/db_created'; },

initdatabase: function() {
	var self = this;
	self.log('Checking for database...');
	self.redis.get(self.key_dbcreated(), function(err, created) {
		if (err) {
			self.log('Init: Error reading database.  Is redis running?');
			process.exit(1);
		}
		else if (created) self.log('Using database created ' + created);
		else {
			self.log('Initializing database.');
			async.series([
					self.loadsystemuser,
					self.loadguestuser,
					self.getsystempassword,
					self.setdbcreated
				], 
				function(err, reply) {
					if (err) self.log(err);
					else self.log('Database initialization complete.');
				}
			);
		}
	});
}


};	// NoteSoup = {...};

module.exports = NoteSoup;
