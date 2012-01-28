/**
*	notesoup.js
*
*	Copyright 2007-2012 Bill Roy
*	This file is licensed under the Note Soup Client License
*	See http://notesoup.net/js/LICENSE
*/

/** 
*	This structure is the center of the Note Soup universe.
*	@constructor 
*/
var notesoup = {

	/** the version we present to the server */
	clientVersion: 'notesoup-ext-node 0.7',

	debugmode: 0,					/** 0..9 for debugging log spew */
	sayDebug: false,				/** echo debug log to notification stack? */
	newNotePositionMode: 'cascade',	/** make a mess with 'random' or use 'cascade' */
	apiuri: '/api',					/** the mother ship's default code point for us */
	runScripts: true,				/** true to run ontick, onload, run, and eval() handlers */
	autoLoadAvatar: false,			/** true to deploy the avatoon on load */

	// Sync controls
	syncInterval: 60,				/** seconds between syncs; 0 to disable auto sync */
	syncUIOnUpdates: true,			/** true to render immediately on update; false defers */

	// Miscellaneous configurable options
	defaultNoteWidth: 250,			/** baby notes are this height */
	defaultNoteHeight: 100,			/** baby notes are this width */
	defaultAccessoryZIndex: 10000,	/** baby notes get this zIndex but note also css files */

	useFastFolderSwitching: false,	/** experimental. */
	foldercache: {},	// folder cache...	/** experimental. */

	imageHost: '/',					/** for node statics */
	//imageHost: 'http://images.notesoup.net/',	/** for a static server */

	/**
	*	initialize note soup.
	*	@param {object} [opts] Optional passed-in initializations.
	*/
	initialize: function(opts) {

		this['startuptime'] = new Date().getTime();

		// Set passed-in options so they are available for the rest of init
		if (opts) {
			this.serveropts = opts;
			if (typeof(opts) == 'object') this.set(opts);
		}
		
		if (!this.baseuri) {
			this.baseuri = window.location.protocol + '//' + window.location.host + '/';
			//this.baseuri = document.location;
			//this.baseuri = this.baseuri.replace('#','');
		}

		// Establish the folder name from the browser location
		// TODO: for nested folders this needs to respect more than two uriparts
		if (!this.foldername.length) {
			var uriparts = ('' + document.location).split('/');
			var numparts = uriparts.length;
			if (numparts > 1) {
				this.foldername = uriparts[numparts-2] + '/' + uriparts[numparts-1];
			}
		}

/****
		// MISO: Create an ad-hoc folder for ?folder=newadhocfoldername
		var uriparts = ('' + document.location).split('?');
		if (uriparts.length == 2) { 	// have one query part
			var queryparts = uriparts[1].split('&');
			for (var i=0; i<queryparts.length; i++) {
				var attrpair = queryparts[i].split('=');
				if (attrpair.length == 2) {
					if (attrpair[0] == 'folder') {
						this.foldername = 'user' + '/' + attrpair[1];
					}
				}
			}
		}
****/

		document.title = 'Note Soup :: ' + this.foldername;
		this.ui.initialize();
		if (navigator.userAgent.search('iPhone') >= 0)
			this.say('Welcome iPhone user!');
			
		if (this.username) this.say('Hello, ' + this.username + '.');
		this.say('Opening ' + notesoup.foldername + '...');

		// handle initial note pre-load
		if (this.serveropts.initnotes) {
			for (var i=0; i < this.serveropts.initnotes.length; i++) {
				var r = this.serveropts.initnotes[i];
				//alert('RAW NOTE STRING: ' + r);
				var n = unescape(r);
				//alert('UNESCAPED: ' + n);
				var z1 = n.replace(/&lt;/g, '<');
				//alert('Z1: ' + z1);
				var z2 = z1.replace(/&gt;/g, '>');
				var z3 = z2.replace(/&amp;/g, '&');
				//alert('Z2: ' + z2);
				var thenote = Ext.util.JSON.decode(z3);
				//alert('DECODED NOTE DUMPED: ' + this.dump(thenote));

				this.updateNote(thenote);
				//if (thenote.mtime > this.lastupdate) this.lastupdate = thenote.mtime;
			}
		}

		this.oneHertzCallback();	// call this late; it triggers sync

		if (this.serveropts.ispublic) notesoup.say('This folder is public.', 'warning');
		if (this.serveropts.isowner) notesoup.say('This folder belongs to you.');
		else if (this.serveropts.iseditor) notesoup.say('You can edit things here.');
		else if (this.serveropts.issender) notesoup.say('You can send things here.');

		if (window && window.event && window.event.shiftKey) {
			notesoup.say('Scripts supressed.', 'warning');
			this.runScripts = false;
		}

		notesoup.push.init();
		if (notesoup.sound) notesoup.sound.init();
		notesoup.frontstage.init();

		this.initialized = true;
		return true;
	},
	
	/**
	*	clean up note soup
	*/
	destroy: function() {
		this.initialized = false;
		delete this.processServerResponse;
		delete this.postRequest;
		delete this.oneHertzCallback;
		for (var n in this.notes) this.destroyNote(this.notes[n].id);
		instantsoup.cleanup();
		delete this;
	},
	
	/**
	*	merge the passed-in options into notesoup
	*	@param {object} opts options to merge into notesoup
	*/
	set: function(opts) {
		for (var o in opts) this[o] = opts[o];
	},


	/** The working array of notes synchronized from the current folder */
	notes: {},

	/** The name of the current folder */
	foldername: '',
	
	lastupdate: 0,
	commandid: 0,
	commandsPending: 0,
	notificationCount: 0,

	// Server sync interval, 0 to disable
	synctimeremaining: 0,
	syncCount: 0,
	in1HzCallback: false,
	
	// AJAX performance timers
	rttlast: 0,
	rtttotal: 0,
	rttaverage: 0,
	rttstack: [],
	bytesSent: [],
	bytesSentTotal: 0,
	bytesReceived: [],
	bytesReceivedTotal: 0,
	serverTimeDiffStack: [],
	
	// UI performance timers
	uiUpdateTimerLast: 0,
	uiUpdateTimerTotal: 0,
	uiUpdateTimerStack: [],

	/**
	*	prompt for user input - overriden at startup with ui-specific dialog
	*	@param {string} prompstr The prompt to display
	*	@param {string} defaultvalue The value to offer the user
	*/
	// Overridable prompt method
	prompt: function(promptstr, defaultvalue) {
		return prompt(promptstr, defaultvalue);
	},

	/**
	*	display a message box and wait for a click
	*	@param {string} alertstr The string to display
	*/
	// Overridable alert method
	alert: function(alertstr) {
		return alert(alertstr);
	},

	/**
	*	log a string to the debug console, if enabled
	*	@see setDebug
	*	@param {string} debugstr The string to log
	*/
	// Overridable debug method
	debug: function(debugstr) {
		if (this.debugmode) {
			if (this.sayDebug) this.say(debugstr);
			if (this.stderr) {
				this.stderr.document.write(debugstr);
				this.stderr.document.write('<br/>\n');
			}
		}
	},

	/**
	*	set the debug level (0..9) and open a debug window if needed
	*	@param {int} level The debug level.  Zero is 'off'.  Three is nice.  Nine is insane.
	*/
	setDebug: function(level) {

		if ((level > 0) && (level <= 9)) {
			this.debugmode = level;
			if (!this.stderr) {
				this.stderr = window.open('','notesoup debug output', 'resizable=yes,scrollbars=yes,width=600,height=400');
			}
			if (!this.stderr) alert('oops setdebug');
			//	this.debug('<link rel="stylesheet" type="text/css" href="css/debug.css"/>note soup debug log ' + new Date());
			this.debug('<link rel="stylesheet" type="text/css" href="/css/notesoup.css"/>note soup debug log ' + new Date());
		} 
		else {
			this.debugmode = 0;
			if (this.stderr) {
				this.stderr.document.close();
				delete this.stderr;
			}
		}
		this.say('Debug level: ' + this.debugmode);
	},
	
	/**
	*	Print the args to the debug window
	*/
	print: function() {
		if (!this.stdout) {
			this.stdout = window.open('','notesoup output window', 'resizable=yes,scrollbars=yes,width=600,height=400');
			if (!this.stdout) alert('oops cant print');
			this.print('<link rel="stylesheet" type="text/css" href="/css/notesoup.css"/>note soup output log ' + new Date());
		}
		for (var i = 0; i < arguments.length; i++) this.stdout.document.write(arguments[i]);
		this.stdout.document.write('<br/>\n');
	},

	/**
	*	return a time stamp string in selected format
	*	@param {float} [t] A Javascript time (Unix * 1000), or null to mean "now"
	*	@param {string} [format] A format selector from ['ms-elapsed', 'time']
	*/
	timeStamp: function(t, format) {
	
		if ((typeof(t) == null) || (t == '')) t = new Date();
		else if (typeof(t) == 'number') t = new Date(t);
		else if (typeof(t) == 'string') t = new Date(parseFloat(t));
	
		if ((typeof(format) == null) || (format == '') || (format == 'ms-elapsed')) {
			return '' + Math.floor(t - notesoup.startuptime);
		}
		if (format == 'time') {
			var timestamp = '';
			if (t.getHours() < 10) timestamp = +'0';
			timestamp += '' + t.getHours() + ':';
			if (t.getMinutes() < 10) timestamp += '0';
			timestamp += '' + t.getMinutes() + ':';
			if (t.getSeconds() < 10) timestamp += '0';
			timestamp += '' + t.getSeconds();
			return timestamp;
		}
		else {
			var timestring = t.toString();
			//debug('TIME: ' + timestring);
			return timestring;
		}
	},

	/**
	*	returns the session elapsed time, stringified
	*/
	sessionTime: function() {
		return this.timeStamp('','');
	},
	

	/**
	*	return a string representation of an object suitable for dumping
	*	@param {object} obj the object to dump
	*/
	dump: function(obj) {
		return Ext.util.JSON.encode(obj);
	},


	/** note position generator location */
	nextx: 200,
	nexty: 50,
	
	/**
	*	return a good place to put the next new note
	*	@params {string} mode choose the selection method from ['random', 'switch', and 'tile']
	*/
	getNewNotePosition: function(mode) {

		// Random: messy, but supports large piles well
		// Drop new notes randomly into a [300x300] box at [nextx,nexty]
		if ((mode == 'random') || ((mode == 'switch') && (this.countNotes() > 10)))
			return {
				//x: this.nextx + Math.floor(Math.random() * 300),
				//y: this.nexty + Math.floor(Math.random() * 300)
				x: Math.max(6, Math.floor(Math.random() * Ext.lib.Dom.getViewWidth() - notesoup.defaultNoteWidth)),
				y: Math.max(30, Math.floor(Math.random() * Ext.lib.Dom.getViewHeight() - notesoup.defaultNoteHeight))
			};

		// Deterministic: pretty, but crawls off screen for large piles
		var newpos = {
			x: this.nextx,
			y: this.nexty
		};
		if (mode != 'vstack') this.nextx += 25;
		this.nexty += 25;
		return newpos;
	},

	/**
	*	return a count of notes in the current folder
	*/
	countNotes: function() {
		var count = 0;
		for (var n in this.notes) count++;
		return count;
	},

	forceInt: function(v) {
		if (typeof(v) == 'number') return v;
		if (typeof(v) == 'string') {
			//notesoup.say("Converting string " + v);
			return parseFloat(v);
		}
		return 0;
	},

	/**
	*	Update Note
	*	
	*	Command from server to populate a note with new data
	*	Creates the note if it doesn't exist
	*	@param {object} thenote
	*/
	updateNote: function(theupdate) {

		if (this.debugmode > 4)
			this.debug('updatenote in: theupdate=' + notesoup.dump(theupdate));

		//this.say('updatenote in: thenote=' + notesoup.dump(theupdate), 'tell');

		// TEMPORARY hack to fix [{}] notes
		if (typeof(theupdate[0]) != 'undefined') theupdate = theupdate[0];

		// It's an error to send an update without an id
		var noteid = theupdate.id;
		if (!noteid) {
			this.say('Error: ' + typeof(theupdate) + ' update without note id: ' + notesoup.dump(theupdate), 'error');
			return;
		}

		// silently discard deletion tombstones
		if ('deleted' in theupdate) return;
		if ('syncme' in theupdate) delete theupdate.syncme;

		var eventHandler = 'onupdate';
		var refreshUI = true;
		var changeCount = 0;
		if (noteid in this.notes) {		// note exists - this is an update

/***** TODO: fix mtime handling
			// decline an update to a younger version
			if (theupdate.mtime == undefined) notesoup.say('upd: incoming no mtime: ' + this.dump(theupdate));
			if (this.notes[noteid].mtime == undefined) notesoup.say('upd: [] no mtime: ' + this.dump(this.notes[noteid]));

			if (theupdate.mtime < this.notes[noteid].mtime) {
				//notesoup.say('dropping spurious younger update: ' + noteid + ' ' + theupdate.mtime + ' ' + this.notes[noteid].mtime, 'warning');
				return;
			}
			else if (theupdate.mtime == this.notes[noteid].mtime) {
				//notesoup.say('passing apparently spurious same-age update: ' + noteid + ' ' + thenote.mtime, 'warning');
				//return;
			}
*****/

			// Check for case where an update arrives on a note being edited
			// TODO: this is the place where better conflict handling should go
			if (this.notes[noteid].editing) {
				delete this.notes[noteid].syncme;	// else it will complain endlessly
				return;		// silently ignore for now
			}

			//// Did anything really change?
			//for (var o in thenote) {
			//	if (thenote[o] != notesoup.notes[noteid][o]) {
			//		changeCount++;
			//		if (this.debugmode > 3)
			//			notesoup.say('Server update: ' + changeCount + ' ' + noteid + '.' + o + '=' + thenote[o] + ' was=' + notesoup.notes[noteid][o]);
			//	}
			//}
			//if (changeCount == 0) refreshUI = false;

			// Play in the updates and set the updated flag
			this.notes[noteid].set(theupdate);
		}
		else {		// doesn't exist? new note		
			this.notes[noteid] = new soupnote(theupdate);

			// set up to call onload handler
			eventHandler = 'onload';
		}

		var thenote = this.notes[noteid];

		thenote['xPos'] = this.forceInt(thenote['xPos']);
		thenote['yPos'] = this.forceInt(thenote['yPos']);
		thenote['width'] = this.forceInt(thenote['width']);
		thenote['height'] = this.forceInt(thenote['height']);
		thenote['zIndex'] = this.forceInt(thenote['zIndex']);

		if (!((thenote.xPos > 0) && (thenote.yPos > 0))) {
			var newpos = this.getNewNotePosition(this.newNotePositionMode);
			thenote.set({'xPos':newpos.x,'yPos':newpos.y});
		}

		if (!(thenote.height > 0)) thenote.height = this.defaultNoteHeight;
		if (!(thenote.width > 0)) thenote.width = this.defaultNoteWidth;
		//if (!('bgcolor' in thenote)) thenote.bgcolor = notesoup.ui.defaultNoteColor || '#fff8b6';

		// more resize bug
		//if (('width' in theupdate) || ('height' in theupdate)) 
		//	thenote.resizeTo(thenote.width, thenote.height);

		// Clear the syncme bit if it's set
		if (thenote.syncme) {
			delete thenote.syncme;
			if (this.notes[noteid].syncme) {
				notesoup.say('oops syncme', 'tell');
			}
		}

		// We aren't editing now
		delete thenote.editing;

		// Here's where we load the widget into the note
		if (thenote.imports) {
			if (notesoup.debugmode > 2)
				notesoup.say("updatenote: applying imports:" + thenote.imports + ' ' + eventHandler);
			if ((eventHandler == 'onload') && thenote.imports && thenote.applyImports) {
				thenote.applyImports();
			}
		}

		// Call the onload or onupdate handler
		thenote.calleventhandler(eventHandler);

		if (this.debugmode > 4)
			this.debug('updatenote out: thenote=' + thenote.toString());

		// Force a UI update if we're running in quick-UI-sync mode
		// ...but only if something changed
		if (refreshUI) {
			if (this.syncUIOnUpdates) {
				//notesoup.say('updatenote: showing the note');
				thenote.show();
			}
			else thenote.set({showme: true});
		}
		//else notesoup.say('Skipped UI refresh...');
	},


	/**
	*	notify the UI of any updated notes we received from sync
	*	fired on a timer, kicked on arrival of updates.
	*/
	syncUI: function() {

		for (var n in this.notes) {
			this.notes[n].syncHeight();
			if ('showme' in this.notes[n]) 
				if ('show' in this.notes[n])
					if (typeof(this.notes[n].show) == 'function')
						this.notes[n].show();
		}

		if (this.uiUpdateTimerStart) {
			this.uiUpdateTimerLast = new Date().getTime() - this.uiUpdateTimerStart;
			this.uiUpdateTimerTotal += this.uiUpdateTimerLast;
			this.uiUpdateTimerStack.push(this.uiUpdateTimerLast);
			this.debug('UI update time=' + this.uiUpdateTimerLast + ' ms - run to completion');
			delete this.uiUpdateTimerStart;
		}
	},


	/**
	*	saveNoteList: Save a list of notes to the server
	*/
	saveNoteList: function(notelist) {
		this.postRequest({
			method:"savenote",
			params:{
				note:notelist,			// special case for list
				tofolder: this.foldername,
				notifyfolder:this.foldername
			}
			},{
				requestMessage: 'Saving ' + notelist.length + ' updated notes...',
				successMessage: 'Saved.',
				failureMessage: 'Could not save notes.'
			});
	},


	/**
	*	syncToServer: Send updated notes (flagged 'syncme') to the server.
	*/
	syncToServer: function() {

		var notelist = [];
		for (var n in this.notes) {
			if (!this.notes[n].nosave && !this.notes[n].isGuest && ('syncme' in this.notes[n]) && this.notes[n].syncme) {
				delete this.notes[n].syncme;
				notelist.push(this.notes[n]);
				this.notes[n].syncme = true;
			}
		}

		// Notes to sync back?  Build and post a request
		if (notelist.length > 0) {
			//notesoup.say('Unsaved notes: ' + notelist);
			this.saveNoteList(notelist);
		}

		// Send a sync, but only if we didn't send a sendNote, since that does an implicit sync
		else this.sendSync();

		// Reset the timer to x seconds from now
		this.setSyncTimer();
	},


	/**
	*	notesoup client-server api library
	*/

	//	Login
	/*
	*	login
	*	@param {string} username the username to log in
	*	@param {string} password that user's password
	*/
	login: function(username, password) {

//		if (!username) {
//			if (this.username) username = this.username;
//		}
		if (!username) {
			username = this.prompt('Enter username:', '');
			if (!username) return;
		}
		this.username = username;
		if (password) this.password = password;
		else delete this.password;

		// Send off a knock-knock request; login is completed below once we have the nonce
		this.postRequest({
			method:'knockknock',
			params:{
				clientversion:this.clientVersion
			}
		},{
			requestMessage: 'Connecting...',
			successMessage: 'Connected.',
			failureMessage: 'Could not connect to server.'
		});
	},


	/**
	*	Handle second phase of two-phase login.  Not for users to call, generally - 
	*	processed automatically on server 'whosthere' command
	*	which is returned in response to the login command (see above)
	*	@param {string} nonce the nonce sent by the server
	*/	
	completeLogin: function(nonce) {

//		if (!this.username) {
//			this.username = this.prompt('Enter username:', this.username);
//			if (this.username == null) return;
//		}
		if (!this.password) {
			this.password = this.prompt('Enter password for user ' + this.username + ':', '');
		}
		if (!this.password) return;
		var passwordhash = hex_sha1(this.password);
		delete this.password;

		this.postRequest({
			method:'login',
			params:{
				username:this.username,
				passwordhash:hex_sha1(passwordhash + nonce)
			}
		},{
			requestMessage: 'Logging in as ' + this.username + '...',
			successMessage: 'Login succeeded...',
			failureMessage: 'Login failure.  No soup for you.'
		});
		passwordhash = '';
	},


	/**
	*	end this login session and navigate to the welcome page
	*/
	logout: function() {
		this.postRequest({
			method:'logout',
			params:{}
		},{
			requestMessage: 'Logging out...',
			successMessage: 'Logged out...',
			// This is a huh? case... can't log out
			failureMessage: 'I\'m sorry, Dave, I can\'t let you do that.'
		});
	},


	/**
	*	saveNote: save a note to the server
	*	@param {object} thenote the note to save.  if no 'id' is present a new note is created.
	*	@param {string} [tofolder] the folder in which to save the note; if not supplied the current folder (notesoup.foldername) is used
	*/
	saveNote: function(thenote, tofolder) {

		if (this.readonly) return;
		if (thenote.nosave) {
			delete thenote.syncme;
			return;
		}

		if (thenote.isGuest) {
			notesoup.say('Ignoring an attempt by a Guest to move in via save(): ' + thenote.id + ' ' + thenote.notename, 'warning');
			return;
		}

		this.debug('saveNote: thenote=' + thenote.toString());

		tofolder = tofolder || this.foldername;

		var name = ('notename' in thenote) ? thenote.notename : thenote.id;
		delete thenote.syncme;

		this.postRequest({
			method:"savenote",
			params:{
				note:thenote,
				tofolder: tofolder,
				notifyfolder:this.foldername
			}
			},{
				// these are very noisy - removed to damp out the UI gerklunking
				//requestMessage: 'Saving ' + name + '...',
				//successMessage: 'Saved.',
				failureMessage: 'Could not save note ' + name
			});

		// ensure the sync bit is set so if this save fails the periodic sync will
		// pick it up (updateNote clears syncme to prevent a spurious save)
		thenote.syncme = true;
	},

	
	/**
	*	appendToNote: append text to a note's text field
	*	=this.appendToNote('another line', 'test22');
	*	@param {string} thetext the text to append to the note body
	*	@param {string} thenoteid the note in question
	*	@param {string} [tofolder] the folder, required if not the current folder
	*/
	appendToNote: function(thetext, thenoteid, tofolder) {

		if (this.readonly) return;

		this.debug('appendToNote: thenoteid=' + thenoteid + ' ' + thetext);

		tofolder = tofolder || this.foldername;

		this.postRequest({
			method:"appendtonote",
			params:{
				text:thetext,
				noteid:thenoteid,
				tofolder: tofolder,
				notifyfolder:this.foldername
			}
			},{
				requestMessage: 'Updating ' + thenoteid,		// this.notes[thenoteid].notename,
				successMessage: 'Updated.',
				failureMessage: 'Could not update note ' + thenoteid	//this.notes[thenoteid].notename
			});
	},
	
	/**
	*	Send a note
	*
	*	Use cases:
	*	1. Note->Delete (send this note to this user's trash)
	*	2. Note->Send to user... (send this note to another user's inbox)
	*	3. Note->Send to notesoup... (send this note to another folder for this user)
	*	4. Creating a new note from a system or user template; this is send without deleteoriginal
	*	@param {string} thenoteid the id of the note to send
	*	@param {string} fromfolder the origin folder, where the note had better be right now
	*	@param {string} tofolder the destination folder, where the note will end up after the send
	* 	@param {boolean} deleteoriginal if true the original note will be deleted from the fromfolder
	*/
	sendNote: function(thenoteid, fromfolder, tofolder, deleteoriginal) {

		if (deleteoriginal === undefined) deleteoriginal = true;

		var thename = "note";
		//var thename = thenoteid;
		//if ((fromfolder == this.foldername) && ('notename' in notesoup.notes[thenoteid]))
		//	thename = notesoup.notes[thenoteid].notename;

		this.postRequest({
			method:"sendnote",
			params:{
				noteid: thenoteid,
				fromfolder: fromfolder,
				tofolder: tofolder,
				notifyfolder: this.foldername,
				deleteoriginal: deleteoriginal
			}
			},{
				requestMessage: 'Sending ' + thename + ' to ' + tofolder,
				successMessage: 'Sent.',
				failureMessage: 'Could not send note.'
			});
	},


	/**
	*	sendNoteToUser: UI sugar function to send a note
	*	@param {string} thenoteid the id of the note to send
	*	@param {string} tofolder the destination folder, where the note will end up after the send
	* 	@param {boolean} deleteoriginal if true the original note will be deleted from the fromfolder
	*/
	sendNoteToUser: function(thenoteid, tofolder, deleteoriginal) {

		if (!tofolder) tofolder = prompt('Send to:', '');
		if (!tofolder) return;
		
		// If destination is a bare foldername (does not have a folder spec), tack on '/inbox'
		if (tofolder.search('/') < 0) tofolder = tofolder + '/inbox';

		this.sendNote(thenoteid, notesoup.foldername, tofolder, deleteoriginal);
	},


	/**
	*	destroyNote
	*	Called by the server after a note-send operation to delete a note 
	*	from the client's local store and remove it from the UI.
	*	For example, after a deleteNote moves a note to the trash folder,
	*	the server commands a destroyNote to make it disappear.
	*	Not to be confused with {@see deleteNote} which moves a note to the trash.
	*	@param {string} thenoteid the id of the note to be eliminated
	*/
	destroyNote: function(thenoteid) {

		if (thenoteid in this.notes) {

			// Delete from the DOM
			this.ui.deleteDOMNote(this.notes[thenoteid]);

			// release its ephemeral storage
			notesoup.notes[thenoteid].clearEphemeral();
	
			// Remove from the note array
			delete this.notes[thenoteid];

		}
	},


	/**
	*	Delete note
	*
	*	Shorthand: Send the note to the user's trash folder
	*	This is a user command not to be confused with {@see destroynote} above.
	*	@param {string} thenoteid the id of the note to send to the trash
	*/
	deleteNote: function(thenoteid) {

		// Forestall a lot of bugs: if the note itself is passed in, instead of the id, make the substitution
		//if (typeof(thenoteid) == 'object') thenoteid = thenoteid.id;

		if (this.readonly) return;
		this.sendNote(thenoteid, this.foldername, this.getUserFromFolderPath(this.foldername) + '/trash');
	},


	/**
	*	erase all the notes in this folder by sending them to the trash (after user confirmation)
	*/
	erase: function() {
		if (this.prompt("Really, really send everything to the trash?", 'no') == 'yes') {
			var notelist = [];
			for (var n in this.notes) notelist.push(this.notes[n].id);
			this.deleteNote(notelist);
		}
	},


	/**
	*	Folder functions
	*/

	/**
	*	return the first path component, i.e., 'user' from 'user/folder'
	*	@param {string} folderpath the path whose user component you wish to extract
	*/
	getUserFromFolderPath: function(folderpath) {
		return folderpath.split('/')[0];
	},



	/**
	*	getFolderList: get the current user's folder list structure
	*
	*	The UI work is done in the callback at notesoup.ui.showFolderList.
	*/
	getFolderList: function() {
		this.postRequest({
			method:"getfolderlist",
			params:{			
				user: notesoup.username
			}
		},{
			//requestMessage: 'Fetching folder list... ',
			//successMessage: 'Done.',
			failureMessage: 'Failure fetching folder list.'
		});
	},


	/**
	*	openFolder: set current folder
	*	
	*	The current implementation triggers a navigation/reload on the new uri
	*	@param {string} tofolder the folder to open
	*/
	openFolder: function(fromfolder) {

		// Fast folder switching
		// Issues: URL is not fixed up.
		// OPPTYS: cache the notes for true multi folder sync
		if (this.useFastFolderSwitching && (this.getUserFromFolderPath(fromfolder) == this.username)) {

			// Validate the destination folder against the folder list
			//if ($(tofolder + '_folder') == undefined) {
			//	this.say('Folder not found.');
			//	return;
			//}

			this.say("Switching to " + fromfolder);

			// Cache the notes from this folder before we leave
			this.foldercache[this.foldername] = {
				notes: {},
				lastupdate: this.lastupdate
			};
			for (var n in this.notes) this.foldercache[this.foldername]['notes'][n] = this.notes[n];

			// Clear the deck by nuking all the current notes
			for (var n in this.notes) this.destroyNote(this.notes[n].id);
			this.lastupdate = 0;

			// Reset local state to point to the new workspace
			this.foldername = fromfolder;
			document.title = 'Note Soup :: ' + this.foldername;

			// Retrieve our notes from the cache if they are there
			if (this.foldername in this.foldercache) {
				this.say('Cache hit! Restoring...', 'warning');
				for (var n in this.foldercache[this.foldername]['notes']) {
					this.notes[n] = this.foldercache[this.foldername]['notes'][n];
					this.notes[n]['showme'] = true;
				}
				this.lastupdate = this.foldercache[this.foldername]['lastupdate'];

				this.say('Restored ' + this.countNotes() + ' notes ' + this.lastupdate);
			}

			// Refresh the folder list (on the cheap)
			//notesoup.ui.initFolderList();

			// Force an immediate sync
			this.sendSync(this.foldername);

			// Skip the reload
			return;
		}

		if ((fromfolder == null) || (fromfolder == '')) 
			fromfolder = prompt('Enter the name of the folder to open:', fromfolder);

		if ((fromfolder != null) && (fromfolder != '')) {

			notesoup.removeAvatar();

			// the old way:
			//document.location.href = '/folder/' + this.username + '/' + foldername;
			this.postRequest({
				method:"openfolder",
				params:{
					fromfolder:fromfolder
				}
			},{
				requestMessage: 'Connecting to ' + fromfolder + '...',
				successMessage: 'Connected...',
				failureMessage: 'Could not open folder.'
			});
		}
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



	/**
	*	createFolder: Make a new folder
	*	@param {string} [tofolder] the folder to create; will prompt the user if this is omitted
	*/
	createFolder: function(tofolder, stayhere) {

		if ((tofolder == null) || (tofolder == '')) {
			//tofolder = prompt('Enter the name of the folder to create:', this.randomName(32));
			tofolder = prompt('Enter the name of the folder to create:', this.username + '/newfolder');
		}

		var parts = tofolder.split('/').length;
		if (parts == 1) tofolder = notesoup.username + '/' + tofolder;
		else if (parts != 2) {
			notesoup.say('A legal folder name is of the form: user/folder');
			return;
		}

		if ((tofolder != null) && (tofolder != '')) {

			this.postRequest({
				method:"createfolder",
				params:{
					tofolder:tofolder,
					stayhere: stayhere ? true : false
				}
			},{
				requestMessage: 'Creating ' + tofolder + '...',
				successMessage: 'Created.',
				failureMessage: 'Could not create folder.'
			});
		}
	},


	/**
	*	set the password on a folder
	*	=this.setFolderPassword(notesoup.foldername, 'foo')
	*	@param {string} folder the folder whose password you wish to set
	*	@param {string} password the new password for the folder
	*/
	setFolderPassword: function(folder, password) {

		if (folder == null || !folder.length) {
			folder = this.prompt('Enter folder name:', notesoup.foldername);
			if (folder == null) return;
		}
		if (password == null || !password.length) {
			// TODO: allow null password -> reset to no password
			password = this.prompt('Enter new password:', this.randomName(8));
		}

		// Send off a request
		this.postRequest({
			method:'setfolderpassword',
			params:{
				tofolder: folder,
				password: password
			}
		},{
			requestMessage: 'Setting password for ' + folder + '...',
			successMessage: 'Password set.',
			failureMessage: 'Could not set password.'
		});
	},


	/**
	*	send duplicates of all the notes in one folder into another
	*	@param {string} fromfolder the folder whose notes are to be copied
	*	@param {string} tofolder the destination of the copy
	*/
	copyFolder: function(fromfolder, tofolder) {

		if (fromfolder == null) fromfolder = this.prompt('Copy everything from which folder:', '');
		
		if (tofolder == null) tofolder = this.prompt('Copy everything from ' + fromfolder + ' to folder named:', '');

		if ((tofolder != null) && (tofolder != '')) {

			// Build the request
			this.postRequest({
				method:"copyfolder",
				params:{
					fromfolder: fromfolder,
					tofolder: tofolder
				}
			},{
				requestMessage: 'Copying to ' + tofolder + '...',
				successMessage: 'Copied.',
				failureMessage: 'Copy failed.'
			});
		}
	},


	/**
	*	rename a folder.  not supported on S3
	*	@param {string} fromfolder the old name
	*	@param {string} tofolder the new name
	*/
	renameFolder: function(fromfolder, tofolder) {

		if ((fromfolder == null) || (fromfolder == '')) fromfolder = this.foldername;

		if ((tofolder == null) || (tofolder == '')) {
			tofolder = this.prompt('Rename folder "' + fromfolder + ' "to:', '');
		}

		if ((tofolder != null) && (tofolder != '')) {

			// Build the request
			this.postRequest({
				method:"renamefolder",
				params:{
					fromfolder:fromfolder,
					tofolder:tofolder
				}
			},{
				requestMessage: 'Renaming ' + fromfolder + ' to ' + tofolder + '...',
				successMessage: 'Renamed.',
				failureMessage: 'Rename failed.'
			});
		}
	},


	/**
	*	delete a folder
	*/
	deleteFolder: function(fromfolder) {
		fromfolder = fromfolder || notesoup.foldername;
		if (this.prompt("REALLY, REALLY DELETE THIS FOLDER AND EVERYTHING IN IT???", 'no') == 'yes') {

			this.postRequest({
				method:"deletefolder",
				params:{
					fromfolder:fromfolder
				}
			},{
				requestMessage: 'Deleting folder ' + fromfolder + '...',
				successMessage: 'Deleted.',
				failureMessage: 'Delete failed.'
			});
		}
	},
	
	
	/**
	*	empty the trash folder of the requestor; the notes are permanently deleted
	*/
	emptyTrash: function() {

		this.postRequest({
			method:"emptytrash",
			params:{}
			},{
				requestMessage: 'Emptying the trash...',
				//successMessage: 'The trash is empty.',
				failureMessage: 'Failed.'
			});
	},


	/**
		Folder access control

		Owner access is required to set permissions on a folder.
		Today this means only the folder's owner or systemuser can set permissions on it.

		accessmode = ['readers','editors','senders']
		accesslist = list of usernames separated by commas; *=all, -=none
		@param {string} tofolder the folder whose permissions to set
		@param {string} accessmode the access mode being configured: [senders, readers, editors]
		@param {string} accesslist the new access list to set on the folder
	*/
	getFolderACL: function(tofolder, handler, scope) {

		if (handler) {
			this.folderaclCallback = handler;
			this.folderaclCallbackScope = scope;
		}
		else {
			delete this.folderaclCallback;
			delete this.folderaclCallbackScope;
		}
		tofolder = tofolder || notesoup.foldername;

		notesoup.postRequest({
			method:"getfolderacl",
			params:{
				tofolder: tofolder
			}},{
			requestMessage: 'Fetching access lists for ' + tofolder + '...',
			successMessage: 'Access lists retreived.',
			failureMessage: 'Could not fetch access lists.'
		});
	},

	/**
	*	Set the ACL on a folder.
	*	@param {string} tofolder the folder in question
	*	@param {object} aclobject a structure containing acl strings for readers, editors, and senders.
	*/
	setFolderACL: function(tofolder, aclobj) {

		tofolder = tofolder || notesoup.foldername;
		var request = {
			method:"setfolderacl",
			params:{
				tofolder:tofolder
			}
		};
		if ('readers' in aclobj) request.params['readers'] = aclobj.readers;
		if ('editors' in aclobj) request.params['editors'] = aclobj.editors;
		if ('senders' in aclobj) request.params['senders'] = aclobj.senders;
		
		this.postRequest(request, {
			requestMessage: 'Setting access list for ' + tofolder + '...',
			successMessage: 'Access list updated.',
			failureMessage: 'Could not update access list.'
		});
	},

	/**
	*	shorthand to set readers to '*'
	*	@param {string} tofolder
	*/
	makeFolderPublic: function(tofolder) {
		tofolder = tofolder || this.foldername;
		this.setFolderACL(tofolder, {'readers': '*'});
	},

	/**
	*	shorthand to set readers to ''
	*	@param {string} tofolder
	*/
	makeFolderPrivate: function(tofolder) {
		tofolder = tofolder || this.foldername;
		this.setFolderACL(tofolder, {'readers': ''});
	},
	
	/**
	*	shorthand to set reader list
	*	@param {string} tofolder
	*/
	setReaderList: function(tofolder) {
		var readers = this.prompt('Allow these users to read this folder (enter names separated by commas, or * for all):', this.readers);
		if ((readers != null) && (readers != '')) {
			this.setFolderACL(tofolder, {'readers': readers});
		}
	},
	
	/**
	*	shorthand to set editor list
	*	@param {string} tofolder
	*/
	setEditorList: function(tofolder) {
		var editors = this.prompt('Allow these users to edit this folder (enter names separated by commas, or * for all):', this.editors);
		if ((editors != null) && (editors != '')) {
			this.setFolderACL(tofolder, {'editors':editors});
		}
	},
	
	/**
	*	shorthand to set sender list
	*	@param {string} tofolder
	*/
	setSenderList: function(tofolder) {
		var senders = this.prompt('Allow these users to send notes to this folder (enter names separated by commas, or * for all):', this.editors);
		if ((senders != null) && (senders != '')) {
			this.setFolderACL(tofolder, {'senders': senders});
		}
	},


	/*
	*	create a new user account and configure it for operation
	*	@param {string} username the new username; an account with this name must not exist
	*	@param {string} password the new password for the account (plain text)
	*/
	createUser: function(username, password) {

		if (!username) {
			username = prompt('Enter name for new user:', '');
			if (!username) return;
		}
		
		if (!password) {
			password = prompt('Enter password for new user:', '');
			if (!password) return;
		}

		var passwordhash = hex_sha1(password);
		password = '';

		// Create a new user
		notesoup.postRequest({
			method:"createuser",
			params:{
				username:username,
				password:passwordhash
			}
		},{
			requestMessage: 'Creating user ' + username + '...',
			successMessage: 'New user created.',
			failureMessage: 'Could not create user.'
		});
	},

	/*
	*	create a new user account and configure it for operation
	*	@param {string} username the new username; an account with this name must not exist
	*	@param {string} password the new password for the account (plain text)
	*/
	setPassword: function(username, password) {

		if (!username) {
			username = prompt('Change password for user:', '');
			if (!username) return;
		}
		
		if (!password) {
			password = prompt('Enter new password:', '');
			if (!password) return;
		}

		var passwordhash = hex_sha1(password);
		password = '';

		// Create a new user
		notesoup.postRequest({
			method:"setpassword",
			params:{
				username:username,
				password:passwordhash
			}
		},{
			requestMessage: 'Setting password for ' + username + '...',
			successMessage: 'Password updated.',
			failureMessage: 'Could not update password.'
		});
	},



	//	Notesoup timer chain management

	//

	/**
	*	oneHertzCallback: We get a 1Hz callback, and meter out callouts here
	*/
	oneHertzCallback: function() {

		if (this.in1HzCallback) {

			// We must be busy since the clock ticked while we were in here
			// This happens frequently, e.g., at initial load
			if (notesoup.debugmode > 7)
				this.say('System error - 1 Hz tick underflow', 'error');
		}
		//else try {
		else {
			this.in1HzCallback = true;

			// Run any notes with 'ontick' handlers
			this.ontick();
	
			// Sync the UI 
			this.syncUI();
		
			// Is it time to sync with the server?
			if (this.syncInterval > 0) {
				if (--this.synctimeremaining <= 0) {
					this.syncToServer();
				}
			}

			// it is to sigh.
			notesoup.checkFixImages();

			this.in1HzCallback = false;
		} 
		// catch (e) { this.say('System error - 1 Hz tick exception:' + this.dump(e), 'error'); }

		// Requeue ourselves so we get the next tick
		window.setTimeout('notesoup.oneHertzCallback();', 1000);
	},
	
	
	/**
	*	ontick: Scripting hook: run the 'ontick' hooks in any notes that have them
	*/
	ontick: function() {

		if (!notesoup.runScripts) return;
	
		//var t1 = new Date().getTime();
	
		for (var n in this.notes) {
		
			// Don't run the ontick handler for a note we're editing - it blows the edit off
			if (!this.notes[n]['editing'])
				this.notes[n].calleventhandler('ontick');
		}

		//var t2 = new Date().getTime();
		//var telapsed = Math.floor(t1 - t1);
		//if (notesoup.debugmode > 2)
		//	notesoup.debug('ontick handlers ran in ' + telapsed + 'ms');
	},


	/**
	*	Reset the sync timer to its countdown value
	*	It is checked at most 1Hz in the oneHertzCallback
	*/
	setSyncTimer: function() {
		this.synctimeremaining = this.syncInterval;
	},


	/**
	*	send a sync request to the server
	*	@params {string} [fromfolder] the folder to sync from
	*	@see lastupdate
	*/
	sendSync: function(fromfolder) {

		if (fromfolder == null) fromfolder = this.foldername;

		// Build the request
		this.postRequest({
			method:"sync",
			params:{
				"fromfolder": fromfolder,
				"count":''+this.syncCount++
			}
		},{
			// these are pretty noisy.
			//requestMessage: 'Syncing with ' + this.foldername,
			//successMessage: 'Sync complete.',
			failureMessage: 'Could not sync with the server.'
		});
	},

	/**
	*	set the sync interval
	*/
	setRefreshInterval: function() {
		var seconds = this.prompt('Enter number of seconds between updates or 0 to turn off updates', this.syncInterval);
		if ((seconds != null) && (seconds != '')) {
			this.syncInterval = seconds;
			this.setSyncTimer();
		}
	},
	


	/*
		Notesoup AJAX interface

		Post a request to the server:
		Start with the callbacks
	*/
	onSuccess: function(response, opts) {
		//try {
			notesoup.processServerResponse(response, opts);
		//} catch (e) {
		//	// FWIW, Safari traps here on server not found
		//	notesoup.onFailure(t);
		//	return;
		//}

		// call the client success proc if there is one
		// this fails horribly in Safari and Firefox if done synchronously here
		// since we are deep in the event handler for the onreadystate change for
		// the response to an ajax request.
		// so we queue it for 20 ms from now.  sue me.
		//if (opts.successProc) window.setTimeout(opts.successProc, 20);

		if (opts.successProc) {
			opts.successProc.defer(20, opts.successProcScope, [response, opts]);
		}

	},
	onException: function(err) {
		// FWIW, Firefox traps here on server not found
		notesoup.say('Transport exception.', 'error');
	},
	onFailure: function(response, opts) {
		// Handle transport error here.  Application errors are handled below in ProcessServerResponse
		notesoup.say('The server has failed to respond.','error');
		if (opts.failureMessage) notesoup.say(opts.failureMessage, 'error');
		if (opts.failureProc) window.setTimeout(opts.failureProc, 20);
	},

	/*
		The main entry point to post a request
	*/
	postRequest: function(request, options) {

		if (this.debugmode) {
			this.debug('> ' + request['method']);
		}

		// Insert the request ID
		request['id'] = this.commandid++;

		// Insert the last update time as a parameter; this implicitly requests
		// a sync on every command.
		// this predicate could be improved if we had a loggedin flag
		if ((request.method != 'login') && (request.method != 'logout')) {
			request.params['lastupdate'] = '' + this.lastupdate;
		}
		
		// Because of the above, we can defer the next sync
		this.setSyncTimer();

		try {
			var jsonrequest = Ext.util.JSON.encode(request);
		} catch(e) {
			this.alert('postRequest: error stringifying request: ' + e.message + ' id=', request['id']);
			return false;
		}

		if (this.debugmode > 2) {
			this.debug(jsonrequest);
		}
		
		// Save bytes-sent
		var tlen = jsonrequest.length;
		this.bytesSent.push(tlen);
		this.bytesSentTotal += tlen;

		/*
			Ext Ajax.Request handler
		*/
		var opt = {
			//url: this.apiuri + request.method,
			url: this.apiuri,
			method: 'POST',
			params: jsonrequest,
			success: this.onSuccess,
			//onException: this.onException,
			failure: this.onFailure
		};
		
		for (var o in options) opt[o] = options[o];
		if (options.requestMessage) this.say(options.requestMessage);
		opt.starttime = new Date().getTime();

		if (this.frombookmarklet) {
			request.params['method'] = request.method;
			request.params['id'] = request.id;
			if ('note' in request.params) {
				request.params['note'] = Ext.util.JSON.encode(request.params['note']);
			}
			var p = Ext.urlEncode(request.params);
			//var q = 'http://localhost/~bill/stikiwiki/notesoup.php?' + p;
			//var q = 'http://sandbox.notesoup.net/notesoup.php?' + p;
			//var q = this.baseuri + 'notesoup.php?' + p;
			var q = this.baseuri + 'getapi/?' + p;
			this.loadScript(q);
			return true;
		}

		// NODE patch: set correct Content-Type for json ajax request body
		Ext.lib.Ajax.defaultPostHeader = 'application/json';

		var a = Ext.Ajax.request(opt);

		// Update the activity indicator
		++this.commandsPending;
		this.updateActivityIndicator('sync', true);

		if (notesoup.notify) notesoup.notify(request.method, '');
	
		return true;
	},
	
	
	/*
		Process the server response, which may include commands to execute
	*/
	processServerResponse: function(response, opts) {

		// Memorialize this moment as the server to UI update timer handoff
		notesoup.uiUpdateTimerStart = new Date().getTime();

		// Calculate AJAX roundtrip time
		var roundtriptime = notesoup.uiUpdateTimerStart - opts.starttime;

		// Save bytes-received $$$
		var tlen = response.responseText.length;
		this.bytesReceived.push(tlen);
		this.bytesReceivedTotal += tlen;

		if (this.debugmode > 2) {
			this.debug('< ' + roundtriptime + ' ' + response.responseText);
		}

		var t1, t1start, t1end;
		try {
			var t1start = new Date().getTime();
			response = Ext.util.JSON.decode(response.responseText);	// more conservative to parse'n'barf
			var t1end = new Date().getTime();
			var t1 = Math.floor(t1end - t1start);
		} catch(e) {
			notesoup.say('Error parsing response body: ' + e.message + ' at ' +
				e.at + ':' + response.responseText, 'error');
			return;
		}

		// server may send us a time update
		if (response.time) {
			this.lastServerTimeDiff = Math.floor(notesoup.uiUpdateTimerStart - (1000 * response.time));
			this.serverTimeDiffStack.push(this.lastServerTimeDiff);
			//notesoup.say('response.time: ' + response.time + '/' + typeof(response.time) + ' ' + this.lastServerTimeDiff);
			if (this.serverTimeOffset) {
				var prev = this.serverTimeOffset;
				this.serverTimeOffset += (this.lastServerTimeDiff - this.serverTimeOffset) * 0.9;
				this.serverTimeOffset = Math.floor(this.serverTimeOffset);
				//notesoup.say('Adjusted server time offset from ' + prev + ' to ' +
				//	this.serverTimeOffset + '(' + this.lastServerTimeDiff + ')', 'whisper');
			}
			else {
				this.serverTimeOffset = this.lastServerTimeDiff;
				//notesoup.say('Set server time offset to ' + this.lastServerTimeDiff, 'whisper');
			}
		}

		this.processServerResponseObject(response, roundtriptime, opts.successMessage, opts.failureMessage);
	},

	/**
	*	returns the estimated zulu time on the server, as a number with unix timestamp semantics
	* 	(multiply by 1000 for a javascript timestamp)
	*/
	getServerTime: function() {
		return (new Date().getTime() + (this.serverTimeOffset || 0.0)) / 1000;
	},


	processServerResponseObject: function(response, roundtriptime, successMessage, failureMessage) {

		// We just got a response from the server; postpone our next
		// sync until a full sync interval from now
		this.setSyncTimer();

		// Handle application error from server here
		if (response['error']) {
			this.say('Server says, "' + response['error'] + '"', 'error');
			if (failureMessage != null) this.say(failureMessage, 'error');
			return;
		}
		else if (successMessage) this.say(successMessage);

		// Process command list in the server package
		var cmdarray;
		try {
			cmdarray = response['command'];
		} catch (e) {
			this.alert('Command array anomaly: ' + e);
		}
	
		var cmd, arg, logarg;
		if (cmdarray) {

			try {
				for (i = 0;  i < cmdarray.length; i++) {
					cmd = cmdarray[i][0];
					arg = cmdarray[i][1];
					logarg = '';
	
					switch (cmd) {
		
						case 'beginupdate':
							break;

						case 'endupdate':
							if (!notesoup.initialLoadComplete) {
								notesoup.initialLoadComplete = true;
								if (!notesoup.countNotes()) notesoup.say('There are no notes here.');
							}
							notesoup.ui.populateFolderList();
							break;
		
						case 'updatenote':
							logarg = arg['id'];
							this.updateNote(arg);
							break;
		
						case 'deletenote':
							logarg = arg;
							this.destroyNote(arg);
							break;
		
						case 'setupdatetime': 
							logarg = arg;
							this.lastupdate = arg;
							break;
	
						case 'navigateto':
							// client is advised to navigate to a new location
							// sent by the server on login to a new user, for example
							// many potential other uses.  is this a security risk?
							logarg = arg;
							document.location.href = arg;
							break;
		
						case 'readonlysession':
							// turning this off for testing
							notesoup.say('Ignoring readonly command.', 'error');
							//this.readonly = 1;
							break;
							
						case 'whosthere':
							logarg = arg;
							this.completeLogin(arg);
							break;
							
						case 'say':
							logarg = arg;
							if (arg.search('!') >= 0) this.frontstage.flash(arg);
							else this.say(arg);
							break;

						case 'show':
							logarg = arg;
							notesoup.ui.flashCenteredText(arg);
							break;

						case 'sync':
							logarg = 'server initiated sync';
							this.sendSync();
							break;

						case 'folderlist':
							logarg = 'folderlist';
							if ('ui' in notesoup) {
								if ('updateFolderListMenu' in notesoup.ui) {
									this.ui.updateFolderListMenu(arg);
								}
							}
							break;
						
						case 'templatelist':
							logarg = 'templatelist';
							break;		// all the action is in the successProc
						
						case 'folderacl':
							logarg = 'folderacl';
							this.folderacl = arg;
							if (this.folderaclCallback) {
								if (this.folderaclCallbackScope)
									this.folderaclCallback.call(this.folderaclCallbackScope, arg);
								else this.folderaclCallback(arg);
							}
							break;
							
						case 'getnote':
							logarg = 'getnote';
							break;		// all the action is in the successProc

						case 'notes':
							logarg = 'note';
							break;		// all the action is in the successProc
		
						default:
							this.alert('Unrecognized server command: ' + cmd);
							break;
					}
	
					if (this.debugmode) {
						this.debug('< ' + cmd + ' ' + logarg);
					}
					if (this.notify) this.notify(cmd, logarg);
				}
			} catch (e) {
				this.alert('Error processing ' + cmd + ' ' + logarg + ': ' + e);
			}
		}
		
		this.syncUI();		// kick a UI update if needed
		
		//// Tally the statistics on the time taken for the request
		if (roundtriptime) {
			this.rttlast = roundtriptime;
			this.rttstack.push(roundtriptime);
			this.rtttotal = this.rtttotal + roundtriptime;
			this.rttaverage = Math.floor(this.rtttotal / this.commandid); 	// approximate average
			//this.rttaverage = this.rtttotal / this.commandid; 	// approximate average

			// optionally, display them
			this.debug('AJAX transport: roundtrip last=' + this.rttlast + 'ms average=' + this.rttaverage + 'ms count=' + this.commandid);
		}

		// Update the activity indicator
		--this.commandsPending;
		this.updateActivityIndicator('sync', false);
	},
	
	updateActivityIndicator: function(indicatorType, set) {
		var elt = $('activityindicator');
		if (!elt) return;
		if (set) {
			if (indicatorType == 'ontick') elt.src = this.imageHost + 'images/famfamfam.com/lightning.png';
			else if (indicatorType == 'sync') elt.src =  this.imageHost + 'images/ajax-busy.gif';
		} 

		// this leaves dangling swirlies
		//else if (this.commandsPending > 0) elt.src = '/images/ajax-busy.gif';

		else if (this.push && this.push.connected) elt.src =  this.imageHost + 'images/famfamfam.com/status_online.png';
		else elt.src =  this.imageHost + 'images/famfamfam.com/status_offline.png';

		// Debug display...
		if ((this.debugmode> 4) && (this.commandsPending > 1) && (indicatorType == 'sync')) {
			this.debug("Commands in flight: " + this.commandsPending);
		}
	},


	/**
	*	get a list of notes ordered by some attribute
	*	=this.getNotesOrderedBy('notename', true, 'notename')
	*	@param {string} attr the attribute to sort on
	*	@param {boolean} ascending sort ascending (false for descending)
	*	@param {string} returnattr the attribute to return in the list, usually 'id'
	*/
	getNotesOrderedBy: function(attr, ascending, returnattr) {

		function attrcmpgt(x, y) {
			return ((x.attr < y.attr) ? -1 : ((x.attr > y.attr) ? 1 : 0));
		}
		function attrcmplt(x, y) {
			return ((x.attr > y.attr) ? -1 : ((x.attr < y.attr) ? 1 : 0));
		}

		var attrmap = [];
		for (var n in notesoup.notes) attrmap.push({'id':n, 'attr': (attr in notesoup.notes[n] ? notesoup.notes[n][attr] : 0)});

		attrmap.sort(ascending ? attrcmpgt : attrcmplt);

		var notelist = [];
		if (returnattr == undefined) returnattr = 'id';
		for (var n= 0; n < attrmap.length; n++) {
			notelist.push(notesoup.notes[attrmap[n].id][returnattr]);
		}
		return notelist;
	},
	

	/**
	*	return the number of notes in the active folder
	*/
	getNoteCount: function() {
		var i=0;
		for (var n in notesoup.notes) i++;
		return i;
	},

	getRandomNote: function() {
		return notesoup.notes[this.getNotesOrderedBy('yPos')[Math.floor(Math.random() * this.getNoteCount())]];
	},

	/**
	*	Return a duration in milliseconds given a "fuzzy user input string"
	*
	* Formats:
	*	x seconds, minutes, hours, days, weeks, fortnights, months, years, [decades, centuries, millenia]
	*
	*	@param {string} s fuzzy duration string input (like '2 weeks')
	*/
	getDuration: function(s) {
	
		var parts = s.split(' ');
		switch (parts.length) {
			case 1: return parseFloat(parts[0]);
			case 2:
				var deltat = parseFloat(parts[0]);
				var unitfactor = this.getConversionToMilliseconds(parts[1].toLowerCase());
				if ((deltat >= 0) && (unitfactor > 0)) return Math.floor(deltat * unitfactor);
				// else fall through to default case: message/return 0
	
			default:
				notesoup.say("Sorry, I don't recognize this duration: " + s);
				return 0;
		}
	
	},
	
	getConversionToMilliseconds: function(unit) {

		// handle singular units by stuffing an s on the end
		if (unit.substring(unit.length-1) != 's') unit += 's';

		switch (unit) {
			case 'ms':
			case 'milliseconds':	return 1;
			case 'seconds':			return 1000;
			case 'minutes':		 	return 1000*60;
			case 'hours': 			return 1000*60*60;
			case 'days':			return 1000*60*60*24;
			case 'weeks':			return 1000*60*60*24*7;
			case 'fortnights':		return 1000*60*60*24*7*2;
			case 'months':			return 1000*60*60*24*30;		// caution: approximation
			case 'years':			return 1000*60*60*24*365;		// caution: approximation

			default:		notesoup.say("Sorry, I don't recognize this unit of time: " + unit);
							return 0;
		}
	},


	/**
	*	convert a time difference into a user-friendly string representation
	*	@param {float} diff the time difference
	*/
	stringifyTimeDiff: function(diff) {
		var mspersecond = 1000;
		var msperminute = mspersecond * 60;
		var msperhour = msperminute * 60;
		var msperday = msperhour * 24;
		var s = '';
		if (diff < 0) {
			s += '-';
			diff = -diff;
		}
		if (diff > msperday) {
			s += Math.floor(diff/msperday) + ' days ';
			diff %= msperday;
		};
		if (diff > msperhour) {
			s += Math.floor(diff/msperhour) + ' hours ';
			diff %= msperhour;
		}
		if (diff > msperminute) {
			s += Math.floor(diff/msperminute) + ' minutes ';
			diff %= msperminute;
		}
		s += Math.floor(diff/1000) + ' seconds ';
		return s;
	},


	/**
	*	Load an external resource to simulate markup of the form:
	*	[script type='text/javascript' src='someurl']
	*	=this.loadScript('http://pingdog.net/har.js');
	*
	*	@param {string} scripturl the url from which to load the script
	*	@param {object} parentelement optional element in which to insert script; defaults to doc.head
	*	@param {object} onload optional function to call when the script load is complete
	*/	
	loadScript: function(scripturl, parentelement, onload) {

		parentelement = parentelement || document.getElementsByTagName('head')[0];
		try {
			var scriptelement = document.createElement('script');
			scriptelement.type = 'text/javascript';
			scriptelement.src = scripturl;
			if (onload) scriptelement.onload = onload;
			else scriptelement.onload = notesoup.loadScriptHandler;
			if (this.debugLevel > 3) this.say('Loading external script: ' + scripturl);
			parentelement.appendChild(scriptelement);
			if (this.debugLevel > 3) this.say('Loaded.');
		} catch (e) {
			this.say('Exception loading: ' + scripturl, 'error');
			dump(e);
		}
	},
	
	loadScriptHandler: function() {
		notesoup.say('Script load complete.');
	},

	
	/**
	*	Load an external resource to simulate markup of the form:
	*	[link rel='stylesheet' type='text/css' href='someuri']
	*	=this.loadStyle('/css/italics.css');
	*
	*	@param {string} cssurl the url from which to load the css
	*/
	loadStyle: function(cssurl) {
		var parentelement = document.getElementsByTagName('head')[0];
		try {
			var linkelement = document.createElement('link');
			linkelement.type = 'text/css';
			linkelement.rel = 'stylesheet';
			linkelement.href = cssurl;
			this.say('Loading external style: ' + cssurl);
			parentelement.appendChild(linkelement);
			this.say('Loaded.');
		} catch (e) {
			this.say('Exception loading: ' + cssurl, 'error');
			dump(e);
		}
	},


	stopScripts: function() {
		return;
		//this.runScripts = false;
		//this.say('Scripts are disabled.', 'warning');
		//this.updateRunScriptsIndicator();
	},

	toggleRunScripts: function() {
		this.runScripts = !this.runScripts;
		this.updateRunScriptsIndicator();
		if (this.runScripts) this.say('Scripts are enabled.');
		else this.say('Scripts are disabled.', 'warning');
	},
	
	updateRunScriptsIndicator: function() {
		this.ui.setRunScriptsCookie(this.runScripts ? 'enable' : 'disable');
		var elt = $('scriptstatus');
		if (elt) elt.src = this.runScripts ? this.imageHost + 'images/famfamfam.com/plugin.png' : this.imageHost + 'images/famfamfam.com/plugin_disabled.png';
	},
	
	allSay: function(f, duration) {
		for (var n in notesoup.notes) {
			if (typeof(f) == 'string') notesoup.notes[n].think(f, duration);
			else if (typeof(f) == 'function') notesoup.notes[n].think(f.apply(notesoup.notes[n]), duration);
			else notesoup.say('allSay what?', 'error');
		}
	},
	
	resetz: function() {
		notesoup.allSay(function() {
			this.think(''+this.zIndex);
			this.zIndex = 0;
			this.save();
		}, 10000);
	},
	
	hexdump0: function(str) {
		var hex = '0123456789abcdef';
		var o = [];
		for (var i=0; i < str.length; i++) {
			var c = str.charCodeAt(i);
			if (i%4 == 0) o.push('&nbsp;');
			if (i%8 == 0) o.push('<br/>');	
			o.push(hex[Math.floor(c/16)]);
			o.push(hex[c%16]);
			o.push('&nbsp;');
		}
		return o.join('');
	},

	hexdump: function(str) {
		var hex = '0123456789abcdef';
		var o = [];
		o.push('<pre><br/>');
		for (var i=0; i < str.length; i+=8) {
		
			o.push(''+i, ':&nbsp;');
			for (var j=i; j<i+8; j++) {
				var c = (j < str.length) ? str.charCodeAt(j) : 0;
				if (j%4 == 0) o.push('&nbsp;');
				o.push(hex[Math.floor(c/16)]);
				o.push(hex[c%16]);
				o.push('&nbsp;');
			}
			o.push('&nbsp;');
			for (var j=i; j<i+8; j++) {
				var c = (j < str.length) ? str.charAt(j) : ' ';
				if ((c < ' ') || (c > '~')) c = '#';
				if (c == '<') c = '&lt;';
				//o.push('&nbsp;');
				if (j%4 == 0) o.push('&nbsp;');
				o.push(c);
			}
			o.push('<br/>');
		}
		o.push('<br/></pre>');
		return o.join('');
	},


	/**
	*	just say no
	*/
	no: function() { return false; },

	/**
	*	Force images to delegate their dragging to their parent note
	*	TODO: ie. (yi yi.)
	*/
	fixImages: function() {
		//var t1 = new Date().getTime();
		Ext.DomQuery.select('img').forEach(function(v, i, a) {
			if (notesoup.debugmode > 9) notesoup.say('Fixing image: ' + v.id);
			//v.ondragstart = notesoup.no;	// safari is happy with this
			v.onmousedown = notesoup.no;	// this makes dragging happy but causes target to pop up after mouseup (due to template)
			//v.onmouseup = notesoup.no;		// this does nothing
		}, notesoup);
		this.resetFixImageCounter();
		//notesoup.say('Fix img: ' + (new Date().getTime() - t1) + ' ms');
	},

	/*
	*	Image fixing timer chain.  Sheesh.
	*/
	fixImageInterval: 2,
	fixImageCountdownTimer: 2,
	resetFixImageCounter: function() { this.fixImageCountdownTimer = this.fixImageInterval; },
	checkFixImages: function() {
		if (--this.fixImageCountdownTimer < 0) this.fixImages();
	}

};

// end of notesoup.js
