/*
	notesoup.js

	Copyright (c) 2007, Bill Roy
	This file is licensed under the Note Soup License
	See the file LICENSE that comes with this distribution
*/
var notesoup = {

	clientVersion: 'notesoup-miso-ext 0.597d',

	debugmode: 0,					// 0..9 for debugging log spew
	sayDebug: false,				// echo debug log to notification stack?
	newNotePositionMode: 'cascade',	// make a mess with 'random' or use 'cascade' 
	apiuri: 'notesoup.php',				// the mother ship's default code point for us
	runScripts: true,				// true to run ontick, onload, run, and eval() handlers

	// Sync controls
	syncInterval: 600,				// seconds between syncs; 0 to disable auto sync
	syncUIOnUpdates: true,			// update immediately and reset update timer

	// Miscellaneous configurable options
	defaultNoteWidth: 250,
	defaultNoteHeight: 100,
	defaultAccessoryZIndex: 10000,	// but note also css files

	useFastFolderSwitching: false,	// living on the edge...
	cache: {},	// folder cache...

	imageHost: '',					// prefix for static image hosting

	initialize: function(opts) {

		this['startuptime'] = new Date().getTime();

		// Set passed-in options so they are available for the rest of init
		opts = opts || {};
		for (var o in opts) {
			notesoup[o] = opts[o];
		};
		
		if (!this.baseuri) {
			this.baseuri = document.location;
			//this.baseuri = this.baseuri.replace('#','');
		}

		// Establish the folder name
		// TODO: for nested folders this needs to respect more than two uriparts
		if (!this.foldername.length) {
			var uriparts = ('' + document.location).split('/');
			var numparts = uriparts.length;
			if (numparts > 1) {
				this.foldername = uriparts[numparts-2] + '/' + uriparts[numparts-1];
			}
		}

		// MISO: Create an ad-hoc folder for ?folder=newadhocfoldername
		var uriparts = ('' + document.location).split('?');
		if (uriparts.length == 2) { 	// have one query part
			var queryparts = uriparts[1].split('&');
			for (var i=0; i<queryparts.length; i++) {
				var attrpair = queryparts[i].split('=');
				if (attrpair.length == 2) {
					if (attrpair[0] == 'user') {
						this.username = attrpair[1];
						this.foldername = this.username + '/inbox';
					}
					else if (attrpair[0] == 'folder') {
						this.foldername = this.username + '/' + attrpair[1];
					}
				}
			}
		}

		document.title = 'Note Soup';
		this.ui.initialize();
		if (navigator.userAgent.search('iPhone') >= 0)
			this.say('Welcome iPhone user!');
		this.say('Opening folder ' + notesoup.foldername + '...');
		this.oneHertzCallback();	// call this late; it triggers sync
		this.initialized = true;
		return true;
	},
	
	destroy: function() {
		this.initialized = false;
		delete this.processServerResponse;
		delete this.postRequest;
		delete this.oneHertzCallback;
		for (var n in this.notes) this.destroyNote(this.notes[n].id);
		instantsoup.cleanup();
		delete this;
	},

	notes: {},
	username: '',
	foldername: '',
	
	editors: '',
	readers: '',
	senders: '',

	readonly: 0,
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
	
	// UI performance timers
	uiUpdateTimerLast: 0,
	uiUpdateTimerTotal: 0,
	uiUpdateTimerStack: [],

	// Overridable prompt method
	prompt: function(promptstr, defaultvalue) {
		return prompt(promptstr, defaultvalue);
	},

	// Overridable alert method
	alert: function(alertstr) {
		return alert(alertstr);
	},

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

	setDebug: function(d) {

		if (d) this.debugmode = d;
		else this.debugmode = 3;

		if ((this.debugmode > 0) && (this.debugmode <= 9)) {
			if (!this.stderr) {
				this.stderr = window.open('','notesoup debug output', 'resizable=1,scrollable=1,width=600,height=400');
			}
			if (!this.stderr) alert('oops print');
			this.debug('<link rel="stylesheet" type="text/css" href="css/debug.css"/>note soup debug log ' + new Date());
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
	
	sessionTime: function() {
		return this.timeStamp('','');	
	},

	dump: function(obj) {
		return Ext.util.JSON.encode(obj);
	},


	// Note position generator
	nextx: 200,
	nexty: 50,
	getNewNotePosition: function(mode) {

		// Random: messy, but supports large piles well
		// Drop new notes randomly into a [300x300] box at [nextx,nexty]
		if ((mode == 'random') || ((mode == 'switch') && (this.countNotes() > 10)))
			return {
				x: this.nextx + Math.floor(Math.random() * 300),
				y: this.nexty + Math.floor(Math.random() * 300)
			};

		// Deterministic: pretty, but crawls off screen for large piles
		var newpos = {
			x: this.nextx,
			y: this.nexty
		}
		this.nextx += 25;
		this.nexty += 25;
		return newpos;
	},

	// return a count of notes in the current folder
	countNotes: function() {
		var count = 0;
		for (var n in this.notes) count++;
		return count;
	},


	/*
		Update Note
		
		Command from server to populate a note with new data
		Creates the note if it doesn't exist
	*/
	updateNote: function(thenote) {

		if (this.debugmode > 4)
			this.debug('updatenote in: thenote=' + thenote.toString());

		// It's an error to send an update without an id
		var noteid = thenote.id;
		if (!noteid) {
			this.say('Error: update without note id: ' + thenote.toString(), 'error');
			return;
		}
		
		// silently discard deletion tombstones
		if ('deleted' in thenote) return;

		var eventHandler = 'onupdate';
		var refreshUI = true;
		var changeCount = 0;
		if (noteid in this.notes) {		// note exists - this is an update

			// Check for case where an update arrives on a note being edited
			// TODO: this is the place where better conflict handling should go
			if (this.notes[noteid].editing) {
				delete this.notes[noteid].syncme;	// else it will complain endlessly
				return;		// silently ignore for now
			}

			// Did anything really change?
			for (var o in thenote) {
				if (thenote[o] != notesoup.notes[noteid][o]) {
					changeCount++;
					if (this.debugmode > 3)
						notesoup.say('Server update: ' + changeCount + ' ' + noteid + '.' + o + '=' + thenote[o] + ' was=' + notesoup.notes[noteid][o]);
				}
			}
			if (changeCount == 0) refreshUI = false;

			// Play in the updates and set the updated flag
			this.notes[noteid].set(thenote);
		} 
		else {		// doesn't exist? new note
			this.notes[noteid] = new soupnote(thenote);

			// set up to call onload handler
			eventHandler = 'onload';
		}

		var thenote = this.notes[noteid];

		if (!((thenote.xPos > 0) && (thenote.yPos > 0))) {
			var newpos = this.getNewNotePosition(this.newNotePositionMode);
			thenote.set({'xPos':newpos.x,'yPos':newpos.y});
		}

		if (!(thenote.height > 0)) thenote.height = this.defaultNoteHeight;
		if (!(thenote.width > 0)) thenote.width = this.defaultNoteWidth;
		if (!('bgcolor' in thenote)) thenote.bgcolor = '#fff8b6';

		// Clear the syncme bit if it's set
		delete thenote.syncme; 

		// We aren't editing now
		delete thenote.editing;

		// Call the onload or onupdate handler
		thenote.calleventhandler(eventHandler);

		if (this.debugmode > 4)
			this.debug('updatenote out: thenote=' + thenote.toString());

		// Force a UI update if we're running in quick-UI-sync mode
		// ...but only if something changed
		if (refreshUI) {
			if (this.syncUIOnUpdates) thenote.show();
			else thenote.set({showme: true});
		}
		//else notesoup.say('Skipped UI refresh...');
	},


	// SyncUI: Notify the UI of any updated notes
	//
	//	Fired on a timer, kicked on arrival of updates.
	//
	syncUI: function() {

		for (var n in this.notes) {
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


	// syncToServer: Send updated notes (flagged 'syncme') to the server.
	//
	syncToServer: function() {

		var notelist = [];
		for (var n in this.notes) {
			if (('syncme' in this.notes[n]) && this.notes[n].syncme) {
				delete this.notes[n].syncme;
				notelist.push(this.notes[n]);
				this.notes[n].syncme = true;
			}
		}

		// Notes to sync back?  Build and post a request
		if (notelist.length > 0) {

			//notesoup.say('Unsaved notes: ' + notelist);

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
		}

		// Send a sync, but only if we didn't send a sendNote, since that does an implicit sync
		else this.sendSync();

		// Reset the timer to x seconds from now
		this.setSyncTimer();
	},


	//********************
	//	Notesoup client-server API
	//********************

	//	Login
	login: function(username, password) {

		if (username == null || username.length == 0) {
			username = this.prompt('Enter username:', username);
			if (username == null) return;
		}
		if (password == null || password.length == 0) {
			password = this.prompt('Enter password:', password);
			if (password == null) return;
		}
		this.newloginusername = username;
		this.newloginpasswordhash = hex_sha1(password);
		password = '';

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


	// completeLogin: Handle second phase of two-phase login
	// not for users to call, generally - 
	// processed automatically on server 'whosthere' command
	// which is returned in response to the login command (see above)
	//
	completeLogin: function(nonce) {
		if (this.newloginpasswordhash) {
			this.postRequest({
				method:'login',
				params:{
					username:this.newloginusername,
					passwordhash:hex_sha1(this.newloginpasswordhash + nonce)
				}
			},{
				requestMessage: 'Logging in as ' + this.newloginusername + '...',
				successMessage: 'Login succeeded...',
				failureMessage: 'Login failure.  No soup for you.'
			});
			delete this.newloginusername;
			delete this.newloginpasswordhash;
		}
		else {
			this.alert('Login phase error.', 'warning');
		}
	},


	//	Logout
	logout: function() {
		this.postRequest({
			method:'logout',
			params:{}
		},{
			requestMessage: 'Logging out...',
			successMessage: 'Logged out...',
			// This is a wtf case... can't log out
			failureMessage: 'I\'m sorry, Dave, I can\'t let you do that.'
		});
	},


	/*
		saveNote: save a note to the server
	*/
	saveNote: function(thenote, tofolder) {

		if (this.readonly) return;

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
				requestMessage: 'Saving ' + name + '...',
				successMessage: 'Saved.',
				failureMessage: 'Could not save note ' + name
			});

		// ensure the sync bit is set so if this save fails the periodic sync will
		// pick it up (updateNote clears syncme to prevent a spurious save)
		thenote.syncme = true;
	},

	
	/*
		appendToNote: append text to a note's text field
		
		=this.appendToNote('another line', 'test22');
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
	
	/* 
		Send a note

		Use cases:
		1. Note->Delete (send this note to this user's trash)
		2. Note->Send to user... (send this note to another user's inbox)
		3. Note->Send to notesoup... (send this note to another folder for this user)
		4. Creating a new note from a system or user template; this is send without deleteoriginal
	*/
	sendNote: function(thenoteid, fromfolder, tofolder, deleteoriginal) {

		if (deleteoriginal === undefined) deleteoriginal = true;

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
				requestMessage: 'Sending ' + thenoteid + ' to ' + tofolder,
				successMessage: 'Sent.',
				failureMessage: 'Could not send note.'
			});
	},


	/*
		sendNoteToUser: UI function to send a note
	*/
	sendNoteToUser: function(thenoteid, tofolder, deleteoriginal) {

		if (!tofolder) tofolder = prompt('Send to:', '');
		if (!tofolder) return;
		
		// If destination is a bare username (does not have a folder spec), tack on '/inbox'
		if (tofolder.search('/') < 0) tofolder = tofolder + '/inbox';

		this.sendNote(thenoteid, notesoup.foldername, tofolder, true);
	},

	
	/*
		Rename note
		
		Provides a measure of control over the (normally random, system-assigned) filename for a note
	*/
	renameNote: function(thenote, newname) {

		if (this.readonly) return;
		var oldname = thenote.id;

		if ((newname == null) || (newname == ''))
			newname = this.prompt('Enter a new filename:', oldname);

		if (newname != null && (newname != '') && (newname != oldname)) {

			// TODO: Filter user input for evil chars before the request
			this.postRequest({
				method:"renamenote",
				params:{
					fromfolder:this.foldername,
					fromname:oldname,
					toname:newname
				}
			},{
				requestMessage: 'Renaming ' + thenote.notename + ' from ' + oldname + ' to ' + newname,
				successMessage: 'Renamed.',
				failureMessage: 'Could not rename note.'
			});
		}
	},


	/*
		destroyNote

		Called by the server after a note-send operation to delete a note 
		from the client's local store and remove it from the UI.
		For example, after a deleteNote moves a note to the trash folder,
		the server commands a destroyNote to make it disappear.
	*/
	destroyNote: function(thenoteid) {

		if (thenoteid in this.notes) {

			// Delete from the DOM
			this.ui.deleteDOMNote(this.notes[thenoteid]);
	
			// Remove from the note array
			delete this.notes[thenoteid];
		}
	},


	/*
		Delete note

		Shorthand: Send the note to the user's trash folder
		This is a user command not to be confused with destroynote below
	*/
	deleteNote: function(thenoteid) {

		// Forestall a lot of bugs: if the note itself is passed in, instead of the id, make the substitution
		if (typeof(thenoteid) == 'object') thenoteid = thenoteid.id;

		if (this.readonly) return;
		this.sendNote(thenoteid, this.foldername, this.username + '/trash');
	},
	
	erase: function() {
		for (var n in this.notes) this.deleteNote(this.notes[n].id);
	},


	/*
		Folder functions
	*/


	getUserFromFolderPath: function(folderpath) {
		return folderpath.split('/')[0];
	},


	/*
		openFolder: set current folder
		
		The current implementation triggers a navigation/reload on the new uri
	*/
	openFolder: function(tofolder) {

		// Fast folder switching
		// Issues: URL is not fixed up.
		// OPPTYS: cache the notes for true multi folder sync
		if (this.useFastFolderSwitching && (this.getUserFromFolderPath(tofolder) == this.username)) {

			// Validate the destination folder against the folder list
			//if ($(tofolder + '_folder') == undefined) {
			//	this.say('Folder not found.');
			//	return;
			//}

			this.say("Switching to folder " + tofolder);

			// Cache the notes from this folder before we leave
			this.cache[this.foldername] = {
				data: {},
				lastupdate: this.lastupdate
			};
			for (var n in this.notes) this.cache[this.foldername]['data'][n] = this.notes[n];

			// Clear the deck by nuking all the current notes
			for (var n in this.notes) this.destroyNote(this.notes[n].id);
			this.lastupdate = 0;

			// Reset local state to point to the new workspace
			this.foldername = tofolder;
			document.title = 'Note Soup : ' + this.foldername + '...';

			// Retrieve our notes from the cache if they are there
			if (this.foldername in this.cache) {
				this.say('Cache hit! Restoring...', 'warning');
				for (var n in this.cache[this.foldername]['data']) {
					this.notes[n] = this.cache[this.foldername]['data'][n];
					this.notes[n]['showme'] = true;
				}
				this.lastupdate = this.cache[this.foldername]['lastupdate'];

				this.say('Restored ' + this.countNotes() + ' notes ' + this.lastupdate);
			}

			// Refresh the folder list (on the cheap)
			//notesoup.ui.initFolderList();

			// Force an immediate sync
			this.sendSync(this.foldername);

			// Skip the reload
			return;
		}

		if ((tofolder == null) || (tofolder == '')) 
			tofolder = prompt('Enter the name of the folder to open:', tofolder);

		if ((tofolder != null) && (tofolder != '')) {

			// the old way:
			//document.location.href = '/folder/' + this.username + '/' + foldername;
			this.postRequest({
				method:"openfolder",
				params:{
					tofolder:tofolder
				}
			},{
				requestMessage: 'Connecting to folder ' + tofolder + '...',
				successMessage: 'Connected...',
				failureMessage: 'Could not open folder.'
			});
		}
	},

	/*
		createFolder: Make a new folder
	*/
	createFolder: function(tofolder) {

		if ((tofolder == null) || (tofolder == '')) 
			tofolder = prompt('Enter the name of the folder to create:', tofolder);

		// If the path does not appear to have a user part, insert the current user
		// since the api requires a full folder path
		if (tofolder.indexOf('/') < 0) {
			tofolder = this.username + '/' + tofolder;
		}

		if ((tofolder != null) && (tofolder != '')) {

			this.postRequest({
				method:"createfolder",
				params:{
					tofolder:tofolder
				}
			},{
				requestMessage: 'Creating folder ' + tofolder + '...',
				successMessage: 'Created.',
				failureMessage: 'Could not create folder.'
			});
		}
	},

	
	// =this.setFolderPassword(notesoup.foldername, 'foo')
	setFolderPassword: function(folder, password) {

		if (folder == null || !folder.length) {
			folder = this.prompt('Enter folder name:', notesoup.foldername);
			if (folder == null) return;
		}
		if (password == null || !password.length) {
			// TODO: allow null password -> reset to no password
			// TODO: offer a random password here
			password = this.prompt('Enter new password:', '');
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


	/*
		Copy Folder
	*/
	copyFolder: function(fromfolder, tofolder) {

		if (fromfolder == null) tofolder = this.prompt('Copy everything from which folder:', '');
		
		if (fromfolder.split('/').length < 2) {
			fromfolder = notesoup.username + '/' + tofolder;
		}

		if (tofolder == null) tofolder = this.prompt('Copy everything from' + fromfolder + ' to folder named:', '');
		
		if (tofolder.split('/').length < 2) {
			tofolder = notesoup.username + '/' + tofolder;
		}

		if ((tofolder != null) && (tofolder != '')) {

			// Build the request
			this.postRequest({
				method:"copyfolder",
				params:{
					fromfolder:this.foldername,
					tofolder:tofolder
				}
			},{
				requestMessage: 'Copying to ' + tofolder + '...',
				successMessage: 'Copied.',
				failureMessage: 'Copy failed.'
			});
		}
	},


	/*
		Rename Folder
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
	

	/*
		Empty the trash folder
	*/
	emptyTrash: function() {

		this.postRequest({
			method:"emptytrash",
			params:{}
			},{
				requestMessage: 'Emptying the trash...',
				successMessage: 'The trash is empty.',
				failureMessage: 'Failed.'
			});
	},

	/*
		Folder access control
		
		The folder in question is always the currently open one.
		Only the folder's owner or systemuser can set permissions on it.

		accessmode = ['readers','editors','senders']
		accesslist = list of usernames separated by commas; *=all, -=none
	*/	
	setAccessList: function(tofolder, accessmode, accesslist) {

		this.postRequest({
			method:"setaccesslist",
			params:{
				tofolder:tofolder,
				accessmode:accessmode,
				accesslist:accesslist
			}
			},{
				requestMessage: 'Setting ' + accessmode + ' access list on ' + tofolder + ' to ' + accesslist,
				successMessage: 'Access list updated.',
				failureMessage: 'Could not update access list.'
			});
	},

	makeFolderPublic: function(tofolder) {
		this.readers = '*,' + this.readers;
		this.setAccessList(tofolder, 'readers', this.readers);
	},

	makeFolderPrivate: function(tofolder) {
		this.readers = '';
		this.setAccessList(tofolder, 'readers', this.readers);
	},
	
	setReaderList: function(tofolder) {
		var readers = this.prompt('Allow these users to read this folder (enter names separated by commas, or * for all):', this.readers);
		if ((readers != null) && (readers != '')) {
			this.readers = readers;
			this.setAccessList(tofolder, 'readers', this.readers);
		}
	},
	
	setEditorList: function(tofolder) {
		var editors = this.prompt('Allow these users to edit this folder (enter names separated by commas, or * for all):', this.editors);
		if ((editors != null) && (editors != '')) {
			this.editors = editors;
			this.setAccessList(tofolder, 'editors', this.editors);
		}
	},
	
	setSenderList: function(tofolder) {
		var senders = this.prompt('Allow these users to send notes to this folder (enter names separated by commas, or * for all):', this.editors);
		if ((senders != null) && (senders != '')) {
			this.senders = senders;
			this.setAccessList(tofolder, 'senders', this.senders);
		}
	},

	createUser: function(username, password, stayhere) {

		stayhere = (stayhere ? 1 : 0);

		// Create a new user
		notesoup.postRequest({
			method:"createuser",
			params:{
				username:username,
				password:password,
				stayhere:stayhere
			}
		},{
			requestMessage: 'Creating user ' + username + '...',
			successMessage: 'New user created.',
			failureMessage: 'Could not create user.'
		});
	},

	// Send an event to the notification server
	_myaflax_escape: function(str) {
		var s = str.split('<');
		if (s.length > 1) return s.join('&lt;');
		return str;
	},
	//folderFlash: function(str) { this.postEvent(this.foldername, 'flash', this._myaflax_escape(str)); },
	//folderShow: function(str) { this.postEvent(this.foldername, 'show', this._myaflax_escape(str)); },
	//folderSay: function(str) { this.postEvent(this.foldername, 'say', this._myaflax_escape(str)); },

	folderFlash: function(str) { notesoup.postEvent(notesoup.foldername, 'flash', str); },
	folderShow: function(str) { notesoup.postEvent(notesoup.foldername, 'show', str); },
	folderSay: function(str) {
		// note the time for rtt calculation
		notesoup.aflax.say_sent_time = new Date().getTime();
		notesoup.postEvent(notesoup.foldername, 'say', str); 
	},
	folderPing: function(str) { 
		notesoup.aflax.ping_sent_time = new Date().getTime();	
		notesoup.postEvent(notesoup.foldername, 'ping', str); 
		// clear this after a while to avoid spurious replies on other guys' pings
		window.setTimeout("notesoup.aflax.ping_sent_time=null;", 5000);
	},
	folderSee: function(str) {
		this.say('Opening browser window on: ' + str);
		notesoup.postEvent(notesoup.foldername, 'see', str);
	},

	postEvent: function(folder, opstring, arg) {

		notesoup.postRequest({
			method:"postevent",
			params:{
				tofolder: folder,
				op: [opstring, arg, folder]
			}
		},{
			// These are awfully noisy
			//requestMessage: 'Sending notification ' + opstring + '...',
			//successMessage: 'Sent.',
			failureMessage: 'Could not send notification.'
		});
	},
	

	//	Notesoup timer chain management
	//
	// oneHertzCallback: We get a 1Hz callback, and meter out callouts here
	//
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
			notesoup.ui.syncAll();
		
			// Is it time to sync with the server?
			if (this.syncInterval > 0) {
				if (--this.synctimeremaining <= 0) {
					this.syncToServer();
				}
			}
			this.in1HzCallback = false;
		} 
		// catch (e) { this.say('System error - 1 Hz tick exception:' + this.dump(e), 'error'); }

		// Requeue ourselves so we get the next tick
		window.setTimeout('notesoup.oneHertzCallback();', 1000);
	},
	
	// ontick: Scripting hook: run the 'ontick' hooks in any notes that have them
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


	// Reset the sync timer to its countdown value
	//
	// It is checked at most 1Hz in the oneHertzCallback
	//
	setSyncTimer: function() {
		this.synctimeremaining = this.syncInterval;
	},

	// Send the sync
	//
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
		if (opts.successProc) window.setTimeout(opts.successProc, 20);

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
			url: this.apiuri,
			method: 'POST',
			params: jsonrequest,
			success: this.onSuccess,
			//onException: this.onException,
			failure: this.onFailure
		}
		
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
			var q = this.baseuri + 'notesoup.php?' + p;
			this.loadScript(q);
			return true;
		}

		// NODE patch: set correct Content-Type for json ajax request body
		Ext.lib.Ajax.defaultPostHeader = 'application/json';

		var a = Ext.Ajax.request(opt);

		// Update the activity indicator
		++this.commandsPending;
		this.updateActivityIndicator('sync', true);
	
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
		this.processServerResponseObject(response, roundtriptime, opts.successMessage, opts.failureMessage);
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
							break;
		
						case 'updatenote':
	
							// Note from the server needs de-JSON-escaped notename and text fields
							//arg['notename'] = this.JSONunescape(arg['notename'] || '');
							//arg['text'] = this.JSONunescape(arg['text'] || '');
							logarg = arg['id'];
							this.updateNote(arg);
							break;
		
						case 'deletenote':
							// TODO: Handle update collision case where delete arrives here for a note being edited
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
							this.say(arg);
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
								if ('addFoldersToFolderList' in notesoup.ui) {
									this.folderlist = arg;
									this.ui.addFoldersToFolderList(this.folderlist);
								}
							}
							break;
		
						default:
							this.alert('Unrecognized server command: ' + cmd);
							break;
					}
	
					if (this.debugmode) {
						this.debug('< ' + cmd + ' ' + logarg);
					}
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

		else if (this.aflax && this.aflax.connection) elt.src =  this.imageHost + 'images/famfamfam.com/status_online.png';
		else elt.src =  this.imageHost + 'images/famfamfam.com/status_offline.png';

		// Debug display...
		if ((this.debugmode> 4) && (this.commandsPending > 1) && (indicatorType == 'sync')) {
			this.debug("Commands in flight: " + this.commandsPending);
		}
	},


	// =this.getNotesOrderedBy('notename', true, 'notename')
	//
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
	

	getNoteCount: function() {
		var i=0;
		for (var n in notesoup.notes) i++;
		return i;
	},


	// Z-order debugging tool
	showZ: function() {
		var n;
		var zmax = -1;
		var zmin = 99999;
		for (n in this.notes) {
			note = this.notes[n];
			debug('note: ' + note.id + ' z=' + note.zIndex + ' ' + typeof(note.zIndex));

			z = note.zIndex;
			if (typeof(z) == 'string') z = parseInt(z);
			if (z > zmax) zmax = z;
			if (z < zmin) zmin = z;
		}
		debug('min z=' + zmin + ' max z=' + zmax);
	},
	

	// Return a duration in milliseconds given a "fuzzy user input string"
	//
	// Formats:
	//	x seconds, minutes, hours, days, weeks, fortnights, months, years, [decades, centuries, millenia]
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

	stringifyTimeDiff: function(diff) {
		//var msperday = 24*60*60*1000;
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


	// loadScript
	//
	// Load an external resource to simulate markup of the form:
	//	[script type='text/javascript' src='someurl']
	//
	//	=this.loadScript('/js/wz_jsgraphics.js');
	//
	loadScript: function(scripturl) {

		var parentelement = document.getElementsByTagName('head')[0];
		try {
			var scriptelement = document.createElement('script');
			scriptelement.type = 'text/javascript';
			scriptelement.src = scripturl;
			this.say('Loading external script: ' + scripturl);
			parentelement.appendChild(scriptelement);
			this.say('Loaded.');
		} catch (e) {
			this.say('Exception loading: ' + scripturl, 'error');
			dump(e);
		}
	},

	// loadStyle
	//
	// Load an external resource to simulate markup of the form:
	//	[link rel='stylesheet' type='text/css' href='someuri']
	//
	//	=this.loadStyle('/css/italics.css');
	//
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


	// BOOKMARKLETS

	makeBootBookmarkletNote: function() {this.getBookmarkletNote(this.getBootBookmarkletLink());},

	makeQuickNoteBookmarkletNote: function() {this.getBookmarkletNote(this.getQuickNoteBookmarkletLink());},

	getBookmarkletNote: function(s) {
		return this.saveNote({
			notename: 'Bookmarklet', 
			text: 'Drag this link to the bookmark bar:<br/>' + s
		}, this.foldername);
	},

	getBootBookmarkletLink: function() {
		return '<a href="' + this.getBootBookmarklet() + '">Instant Soup Bookmarklet</a>';
	},

	getBootBookmarklet: function() {
		return this.getBootBookmarkletCode(this.baseuri, 'js/instantsoup.js');
	},
	
	getBootBookmarkletCode: function(baseuri, filepart) {
	
		var booterTemplate = [
			"javascript:function%20boot(url){",
				"var%20s=document.createElement('script');",
				"s.setAttribute('language','javascript');",
				"s.setAttribute('src',url);",
				"document.body.appendChild(s);}",
			"window.instantsoupbooturi='",baseuri,"';",
			"boot('", baseuri+filepart,"');"
		];
		return booterTemplate.join('');
	},

	getQuickNoteBookmarkletLink: function() {
		return '<a href="' + this.getQuickNoteBookmarkletCode() + '">Instant Note Bookmarklet</a>';
	},

	getQuickNoteBookmarkletCode: function() {
	
		//notesoup.php?note=%7B%22notename%22%3A%22'+newnotetext+'%22%7D&tofolder=user%2Finbox&method=savenote&id=1');
	
		var prompterTemplate = [
			"javascript:function%20boot(url){",
				"var%20s=document.createElement('script');",
			"	s.setAttribute('language','javascript');",
			"	s.setAttribute('src',url);",
			"	document.body.appendChild(s);}",
			"var%20t=prompt('Enter%20a%20short%20note','<a%20href='+document.location+'>'+document.title+'</a>');",
			"boot('", notesoup.baseuri,
			"notesoup.php?note=%7B%22notename%22%3A%22Quick%20Note%22%2C%22text%22%3A%22'+encodeURIComponent(t.replace(/^\s*|\s*$/g,''))+'%22%7D&tofolder=user%2Finbox&method=savenote&id=1');"
		];
		return prompterTemplate.join('');
	}
};

// end of notesoup.js
