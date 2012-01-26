/**
*	notesoup-commandbar.js - command bar management
*	
*	Copyright 2007, 2008 Bill Roy
*	This file is licensed under the Note Soup Client License
*	See http://notesoup.net/js/LICENSE
*/

/**
*	Command bar key event handler.  
*	Fires the command parser on Enter.
*	Manages Alt+Up to recall last command.
*	@param {object} event
*/
notesoup.ui.set({

	commandBarWatcher: function(event) {

		if (event.keyCode == 13) {
			var thecmd = notesoup.ui.commandbar.getValue();
			notesoup.ui.commandbar.setValue('');
			if (thecmd.length > 0) {
				notesoup.ui.lastCommand = thecmd;
				notesoup.doCommand(thecmd);
			}
		}
		else if ((event.keyCode == 38) && ((event.ctrlKey) || (event.altKey))) {
			notesoup.ui.commandbar.setValue(notesoup.ui.lastCommand);
		}
		else if ((event.keyCode == 27) && notesoup.frombookmarklet) {
			notesoup.destroy();
		}
	}
});


notesoup.set({

	/**
	*	Put a value into the command bar.
	*/
	setCommandBar: function(str) {
		if (str == undefined) str = this.getTip();
		notesoup.ui.commandbar.setValue(str);
	},


	/**
	*	Parse and execute a command string.
	*	@param {string} cmd the command to execute.
	*/
	doCommand: function(cmd) {
		try {
			this.doCommandWorker(cmd);
		} catch (e) {
			this.say("Sorry, there was a problem: " + this.dump(e) + ' in ' + cmd, 'error');
		}
	},
	
	
	/**
	*	Does the actual work of command parsing and execution.
	*/
	doCommandWorker: function(cmd) {
	
		for (var i = 0; i < notesoup.registeredCommands.length; i++) {
	
			var ctab = notesoup.registeredCommands[i];
			var cmdhead = ctab[0];
			var cmdhelp = ctab[1];
			var cmdfunc = ctab[2];
	
			//this.say('t:' + i + ' ' + cmdhead + ' ' + cmdhelp.length);
	
			// search registered commands with non-null heads for a head match
			// null heads can be used to infiltrate help into the command table
			if (cmdhead.length && (cmd.substring(0, cmdhead.length) == cmdhead)) {
	
				//notesoup.say('docommand: match ' + cmdhead + ' ... ' + cmdhelp + ' ... ' + cmdfunc);
	
				// Call the handler, passing the full string as an argument
				// slash commands get special handling: the command part is peeled off
				// so that ordinary functions expecting a single string argument can be called
				// directly from the command table
				if (cmd[0] == '/') {
					var arg = cmd.substring(cmdhead.length, cmd.length);
					if (arg[0] == ' ') arg = arg.substring(1, arg.length);
					return (cmdfunc.apply)(notesoup, [arg]);
				}
				else return (cmdfunc.apply)(notesoup, [cmd]);
			}
		}
	
		// fall through on no match: this is where create-note-by-typing happens
		return notesoup.createNoteFromSlashDelimitedLines(cmd);	
	},
	
	
	/**
	*	Display a list of commands available from the command line.
	*/
	cmdShowHelp: function(cmd) {
		var cmdtab = notesoup.registeredCommands;
		var theheader = '<h3><b><center>Cheat Sheet: Things You Can Do In The Command Bar</center></b></h3>';
		theheader += '<span style="font-size:0.6em;"><center>(click on this to make it stay visible)</center></span>';
	
		var thetext = '<table style="font-size:0.8em;">';
		for (var i = 0; i < cmdtab.length; i++) {
			thetext += '<tr><td style="width:20%"><b>' + cmdtab[i][0] + '</b></td><td><i>' + cmdtab[i][1] + '</i></td></tr>';
		}
		thetext += '</table>';
		if (false) notesoup.say(theheader + '<hr/>' + thetext);
		else {
			theheader = '<h2><b><center>Things You Can Do<br>In The Command Bar</center></b></h2>';
			this.saveNote({
				notename: 'Cheat Sheet',
				text: theheader + '<hr/>' + thetext,
				bgcolor: '#aaffaa',
				width: '350'
			}, notesoup.foldername);
		}
	},
	
	
	
	/**
	*	Handler for non-recognized commands.
	*/
	cmdNotRecognized: function(cmd) {
		this.say('No command handler for: ' + cmd);
		if (!$n('Cheat Sheet')) this.cmdShowHelp(cmd);
	},
	

	/**
	*	Evaluate a javascript expression.
	*/
	evaljs: function(cmd) {
		//notesoup.say('evaljs: ' + this);
		try {
			notesoup.say('Evaluating: ' + cmd.substring(1));
			var result = eval(cmd.substring(1));
			if (result != undefined) notesoup.say(result);
		} catch(e) {
			notesoup.say("Script error: " + e + ' in:' + cmd.substring(1), 'error');
			return false;
		}
		return true;
	},
	

	/**
	*	Make a bookmark
	*/
	createBookmark: function(cmd, forceimage) {
	
		// Frame up a new note
		var thenote = {
			//bgcolor: notesoup.ui.defaultNoteColor,
			width: 250,
			height: 100
		};
		if (forceimage) thenote.isimage = true;
	
		// make a proxy note
		thenote.notename = notesoup.prompt('Enter a title:', cmd);
		thenote.notetype = 'proxy';
		thenote.proxyfor = cmd || notesoup.prompt('Enter the URL:', cmd);
		notesoup.saveNote(thenote, notesoup.foldername);
		return true;
	},

	/**
	*	Handle '>>notename/line1/line2/...' as append-to-text request.
	*/
	cmdAppendText: function(cmd) {
	
		var lines = cmd.split('/');
		lines[0] = lines[0].substring(2, lines[0].length);	// skip the >> to get notename
		var thenotename = lines[0];
		var note = $n(thenotename);		// is the note already in the soup?
		if (note) {
			notesoup.say('Updating ' + thenotename + '...');
			var thetext = '';
			for (var i = 1; i < lines.length; i++) {
				thetext += lines[i] + '\n';
			}
	
			// bring to front
			$(note.id + notesoup.ui.divSuffix).style.zIndex = notesoup.ui.getTopZ();
			notesoup.appendToNote(thetext + '<br>\n', note.id, notesoup.foldername);
			notesoup.setCommandBar('>>' + thenotename + '/');
			notesoup.ui.commandbar.focus();		
			return true;
		}
		else return notesoup.createNoteFromSlashDelimitedLines(cmd);
	},
	

	cmdTell: function(cmd) {
		var delim = cmd.search(' ');
		if (delim <= 0) {
			notesoup.say('huh?');
			return;
		}
		var touser = cmd.substr(0, delim);
		var msg = cmd.substr(delim+1);
		//notesoup.say('TELL: [' + touser + '] [' + msg + ']');
		notesoup.tell(touser, msg);
		notesoup.say('Sent message to ' + touser + ': "' + msg + '".');
	},


	/**
	*	Create a note from slash-delimited lines.
	*/
	createNoteFromSlashDelimitedLines: function(cmd) {
		// Frame up a new note
		var thenote = {
			'bgcolor':notesoup.ui.defaultNoteColor,
			'width':'250',
			'height':'100'
		};
	
		var lines = cmd.split('/');
		thenote.notename = lines[0];
		thenote.text = '';
		for (var i = 1; i < lines.length; i++) {
			thenote.text += lines[i] + '<br/>\n';
		}
		
		if (notesoup.debugmode > 2)
			notesoup.debug('doCommand: thenote=' + thenote.toString());
		
		notesoup.saveNote(thenote, notesoup.foldername);
		return true;
	},
	

	/**
	*	Create a note from an alleged feed url.
	*/
	createNoteFromFeed: function(cmd) {

		cmd = 'http' + cmd.substr(4);	// convert feed: to http:
	
		// Frame up a new note
		var thenote = {
			//'bgcolor':notesoup.ui.defaultNoteColor,
			'width':'250',
			'height':'100',
			'feedurl': cmd,
			'onload': 'this.getFeed(this.feedurl);'
		};
		notesoup.saveNote(thenote, notesoup.foldername);
		return true;
	},
	
	
	// tip system
	tips: [
		'Type title/line 1/line 2/... to create a note.',
		"Eat your soup.  It's good for you."
	],
	
	getTip: function() {
		return 'Tip: ' + this.tips[Math.floor(Math.random()*this.tips.length)];
	}
});



/**
*	The registered command list.
*/
notesoup.registeredCommands = [
	['', '<b>To create a note type:<br>title/line 1/line 2... then press Enter.</b>', ''],
	['=', 'Evaluate javascript expression', notesoup.evaljs],
	['??', 'Open a wikipedia search window', function(cmd) {
		window.open('http://en.wikipedia.org/wiki/Special:Search?go=Go&search=' + cmd.substring(2), 'Search', '', false);
		return true;
	}],
	['?i', 'Google Image Search', function(cmd) {
		window.open('http://images.google.com/images?hl=en&q=' + cmd.substring(2), 'Search', '', false);
		return true;
	}],
	['?I', 'WPClipArt.com Image Search', function(cmd) {
		window.open('http://www.wpclipart.com/cgi-bin/search.pl?p=1&lang=en&include=&exclude=&penalty=&sort=&mode=all&q=' + cmd.substring(2), 'Search', '', false);
		return true;
	}],
	['?', 'Open a Google search window', function(cmd) {
		window.open('http://www.google.com/search?q=' + cmd.substring(1), 'Search', '', false);
		return true;
	}],
	
	
	['>>', '>>title/text appends text to note', notesoup.cmdAppendText],
	['{', '{json note} saves a note from json-formatted input', function(cmd) {
		notesoup.saveNote(Ext.util.JSON.decode(cmd));
	}],
	['[', '[{json note},{json note}] saves a list of notes from json-formatted input', function(cmd) {
		notesoup.saveNote(Ext.util.JSON.decode(cmd));
	}],
	['<', '<html>...creates an html note', function(cmd) {
		notesoup.saveNote({
			text: cmd
		});
	}],
	['#', '#text creates a text-only element', function(cmd) {
		notesoup.saveNote({
			text: cmd.substring(1),
			template: '{text}'
		});
	}],
	['.', '.expr is a shortcut for =notesoup.expr', function(cmd) {
		notesoup.doCommand('=notesoup' + cmd);
		return true;
	}],

	['/say', 'Flash a message to all connected users', notesoup.folderSay],
	['/ping', 'Ping connected users', notesoup.folderPing],
	['/see', 'Pop up a browser on connected user screens', notesoup.folderSee],
	['/sync', 'Sync remote participants', notesoup.folderSync],
	['/refresh', 'Refresh workspace for all participants.', notesoup.folderRefresh],
	['/rcon', 'Send command to remote participants', notesoup.folderRcon],
	['/quiet', 'Stop with the flashing messages already.', function() {notesoup.say = function() {};}],
	['/hide', 'Hide the toolbar.', function() {Ext.get('toolbar').hide();}],
	['/tell', 'Send a private message to one user', notesoup.cmdTell],
	['/flash', 'Flash a full-screen message to all connected users', notesoup.folderFlash],
	['/help', 'Show this help on commands', notesoup.cmdShowHelp],
	['/', 'Show this help on commands', notesoup.cmdNotRecognized],


	['http://', 'Create a bookmark (paste a URL and press Enter)', notesoup.createBookmark],
	['https://', 'Create a bookmark', notesoup.createBookmark],
	['feed://', 'Create an RSS feed note', notesoup.createNoteFromFeed],
];
	
