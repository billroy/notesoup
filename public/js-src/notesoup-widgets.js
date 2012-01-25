/**
*	Note Soup widget loader
*
*	Copyright 2007, 2008 Bill Roy
*	This file is licensed under the Note Soup Client License
*	See http://notesoup.net/js/LICENSE
*/

/**
*	get a widget.  returns the widget, or these signals:
*	< 0		temporarily unavailable, please retry
*	null	hard fail
*	@param	{string} widgetid	the widgetid to load.
*/
notesoup.getImport = function(importname) {
	
	var folder = '';
	var notename = '';
	var searchNotename = false;

	var parts = importname.split('/');
	switch (parts.length) {
		case 3:
			folder = parts[0] + '/' + parts[1];
			notename = parts[2];
			break;
	
		case 1: 
			folder = this.foldername;
			notename = importname;
			break;

		default: 
			return null;
	}
	if (notename.charAt(0) == '@') {
		searchNotename = true;
		//notesoup.say('Searching notename.');
		notename = notename.substr(1, notename.length-1);
	}
	if (notesoup.debugmode > 3)
		notesoup.say('getImport: f,n=' + folder + ' ' + notename + ' ' + notename.length);

	// look for local widget first
	if (folder == notesoup.foldername) {
		//notesoup.say('Local ref: [' + notename + '] ' + notesoup.notes[notename] + ' ' + $n(notename));
		if (notesoup.sessionTime() < 2000) return -1;	// need the notes to load, first
		if (searchNotename) {
			//notesoup.say('Search notename: [' + notename + ']' + $n(notename));
			return $n(notename);
		}
		if (notename in notesoup.notes) return notesoup.notes[notename];
		return null;
	}

	// check the folder cache
	var f = this.foldercache[folder];
	if (!f) {
		this.getNotes(folder);
		return -1;
	}
	if (f.status == 'loading') return -1;
	if (f.status == 'error') return null;
	if (f.status != 'ok') return -2;	// huh?
	if (!f.notes) return null;
	if (searchNotename) {
		for (var n in f.notes) {
			if (f.notes[n].notename == notename)
				return f.notes[n];
		}
		return null;
	}
	if (notename in f.notes) return f.notes[notename];
	return null;
};


soupnote.prototype.getAppliedImports = function() {
	return this.getEphemeral('appliedimports') || [];
};


soupnote.prototype.addAppliedImport = function(importname) {
	var importlist = this.getAppliedImports();
	importlist.push(importname);
	this.setEphemeral('appliedimports', importlist);
};


soupnote.prototype.reapplyImports = function(msdelay) {
	//notesoup.say('Waiting for imports: ' + this.imports, 'tell');
	this.applyImports.defer(msdelay, this);
};

soupnote.prototype.applyImports = function() {

	if (this.imports in this.getEphemeral('appliedimports', [])) {
		notesoup.say('Import already applied: ' + this.imports + ' ' + this.id);
		return;
	}
	//notesoup.say('Applying import ' + this.imports + ' to note ' + this.id);

	// handle imports: url 
	if ((this.imports.substring(0, 5) == 'http:') || (this.imports.substring(0, 6) == 'https:')
			|| (this.imports.charAt(0) == '/')) {
		this.addAppliedImport(this.imports);
		this.geturl(this.imports);
		return;
	}

	var importNote = notesoup.getImport(this.imports);
	if (notesoup.debugmode) notesoup.say('Import=' + notesoup.dump(importNote));
	if (importNote < 0) {
		if (notesoup.debugmode) notesoup.say('Import spin...');
		this.reapplyImports(200);
	}
	else if (!importNote) notesoup.say('Import cannot be found: ' + this.imports, 'error');
	else {
		var elt = Ext.get(this.id + notesoup.ui.contentSuffix);
		if (elt) {
			this.addAppliedImport(this.imports);

			//notesoup.say("Merging widget DNA");
			
			// if the widget has an imports:, that's all we're interested in
			if (importNote.imports) {
				if (notesoup.debugmode) notesoup.say("Merging imports: " + importNote.imports);
				this.imports = importNote.imports;
				this.reapplyImports(20);	// now apply what we got
				this.save();
				return;
			}
			
			// merge in widget attributes for un-set values only
			for (var k in importNote) {
				//notesoup.say('Considering ' + k);
				if (k in ['id', 'text']) continue;
				if (k in this) continue;
				//notesoup.say('Merging ' + k);
				this[k] = importNote[k];
			}
			elt.update(importNote.text, true);	// true to load scripts
		}
		else {
			notesoup.say("Import no elt.");
			this.reapplyImports(20);
		}
	}
};


/**
*	SENDSELF: Horizontal multicast widget event notification fabric:
*
*	Send a method call with arguments to all instances of this note
*	running in other browsers pointed at this folder.
*
*	This is how a widget broadcasts state sync updates to its comrades running elsewhere.
*
*	Example: Ink uses sendself to broadcast pendown ink dribble updates.
*
* 	How to use: Instead of:
*		this.drawline(this.lastx, this.lasty, x, y);
*
*	Just use this:
*		this.sendself('drawline', this.lastx, this.lasty, x, y);
*
*	Your handler is the same either way:
*
*		drawline: function(x1, y1, x2, y2) {...}
*
*	The event fabric will deliver your function call to you and to all the others watching.
*
*/
soupnote.prototype.sendself = function() {
	var data = {
		noteid: this.id,
		args:Array.prototype.slice.call(arguments)
	};
	
	// flight recorder
	if (this.logging) {
		if (!this.log) this.log = [];
		this.log.push([data.args]);
	}
	
	notesoup.postEvent('/folder/' + notesoup.foldername, 'sendself', data);

	// if we're not on the bus, echo the call locally
	if (!notesoup.push.connected) this.onsendself.apply(this, arguments);
};


/**
*	Dispatch a 'sendself' message to the local note,
*	passing the arguments given to the original caller.
*/
soupnote.prototype.onsendself = function() {
	if (typeof(this[arguments[0]]) == 'function') {
		var args = Array.prototype.slice.call(arguments);
		var func = args[0];
		args.shift();
		this[func].apply(this, args);
	}
};

