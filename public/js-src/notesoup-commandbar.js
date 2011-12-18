/*
	notesoup-commandbar.js - command bar management
	
	Copyright (c) 2007, Bill Roy
	This file is licensed under the Note Soup License
	See the file LICENSE that comes with this distribution
*/

/*
	Execute a command from the command bar
*/
notesoup.ui.commandBarWatcher = function(event, cmd) {

	if (event.keyCode == 13) {
		var thecmd = $('commandbar').value;
		$('commandbar').value = '';
		if (thecmd.length > 0) {
			notesoup.ui.lastCommand = thecmd;
			notesoup.doCommand(thecmd);
		}
	}
	else if ((event.keyCode == 38) && ((event.ctrlKey) || (event.altKey))) {
		$('commandbar').value = notesoup.ui.lastCommand;
		Event.stop(event);
	}
};

// doCommand
//
// this has to be under the notesoup object so 'this' is set correctly
// in the eval-script handler
notesoup.doCommand = function(cmd) {
	//try {
		this.doCommandWorker(cmd);
	//} catch (e) {
	//	this.say("Sorry, there was a problem: " + this.dump(e) + ' in ' + cmd, 'error');
	//}
};


notesoup.doCommandWorker = function(cmd) {

	for (var i = 0; i < this.registeredCommands.length; i++) {

		var ctab = this.registeredCommands[i];
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
};


// show command help
notesoup.cmdShowHelp = function(cmd) {
	var cmdtab = notesoup.registeredCommands;
	var theheader = '<h3><b><center>Cheat Sheet: Things You Can Do In The Command Bar</center></b></h3>';
	theheader += '<span style="font-size:0.6em;"><center>(click on this to make it stay visible)</center></span>';

	var thetext = '<table style="font-size:0.8em;">';
	for (var i = 0; i < cmdtab.length; i++) {
		thetext += '<tr><td style="width:20%"><b>' + cmdtab[i][0] + '</b></td><td><i>' + cmdtab[i][1] + '</i></td></tr>';
	}
	thetext += '</table>';
	if (notesoup.readonly) notesoup.say(theheader + '<hr/>' + thetext);
	else {
		theheader = '<h2><b><center>Things You Can Do<br>In The Command Bar</center></b></h2>';
		this.saveNote({
			'notename': '<b><center>Cheat Sheet</center></b>',
			'text': theheader + '<hr/>' + thetext,
			'bgcolor': '#aaffaa',
			'width': '350'
		}, notesoup.foldername);
	}
};

notesoup.cmdNotRecognized = function(cmd) {
	this.say('No command handler for: ' + cmd);
	this.cmdShowHelp(cmd);
};


// evaluate a javascript expression
notesoup.evaljs = function(cmd) {
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
};

// make a bookmark
notesoup.createBookmark = function(cmd) {

	// Frame up a new note
	var thenote = {
		'bgcolor':notesoup.ui.defaultNoteColor,
		'width':'250',
		'height':'100'
	};

	// make a proxy note
	thenote.notename = notesoup.prompt('Enter a title for this bookmark:', cmd);
	thenote.notetype = 'proxy';
	thenote.proxyfor = cmd;
	notesoup.saveNote(thenote, notesoup.foldername);
	return true;
};


// Handle '>>notename/line1/line2/...' as append-to-text request
// which appends the lines to the note titled notename
notesoup.cmdAppendText = function(cmd) {

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
		var win = Windows.getWindow(note.id + '_win');
		win.toFront();
		notesoup.appendToNote(thetext + '\n', note.id, notesoup.foldername);
		return true;
	}
	else return notesoup.createNoteFromSlashDelimitedLines(cmd);
};


// Create a note from slash-delimited lines
notesoup.createNoteFromSlashDelimitedLines = function(cmd) {
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
		thenote.text += lines[i] + '\n';
	}
	
	if (notesoup.debugmode > 2)
		notesoup.debug('doCommand: thenote=' + thenote.toString());
	
	notesoup.saveNote(thenote, notesoup.foldername);
	return true;
};



notesoup.registeredCommands = [
	['', '<b>To create a note type:<br>title/line 1/line 2... then press Enter.</b>', ''],
	['=', 'Evaluate javascript expression', notesoup.evaljs],
	['??', 'Open a wikipedia search window', function(cmd) {
		window.open('http://en.wikipedia.org/wiki/Special:Search?go=Go&search=' + cmd.substring(2), 'Search', '', false);
		return true;
	}],
	['?', 'Open a google search window', function(cmd) {
		window.open('http://www.google.com/search?q=' + cmd.substring(1), 'Search', '', false);
		return true;
	}],
	['>>', '>>note/text appends text to note', notesoup.cmdAppendText],

	['http://', 'Create a bookmark (paste a URL and press Enter)', notesoup.createBookmark],
	['https://', 'Create a bookmark', notesoup.createBookmark]
];



// Command bar color picker
notesoup.ui.doDefaultColorMenu = function(event) {
	TCPopup(0,1, function(c) { notesoup.ui.setDefaultNoteColor(c); });
	$('commandbar').focus();
};

notesoup.ui.setDefaultNoteColor = function(theColor) {
	theColor = '#' + theColor;
	notesoup.ui.defaultNoteColor = theColor;
	$('commandbarwindow').style.background = theColor;
	$('commandbar').focus();
};

// tip system
notesoup.tips = [
	'Type title/line 1/line 2/... to create a note.',
	'To edit a note, click the little gray triangle.',
	'Try clicking on the little gray triangles.',
	'Click the "?" icon for help on commands.',
	'Type /help for help on commands.',
	'Hover the mouse over any icon for help.',
	'The little gray triangles are menus.  Click on them.',
	'The green messages will stay put if you click on them.',
	'When finished editing a note, press Alt+S to save your changes!',
	"Eat your soup.  It's good for you."
];

notesoup.getTip = function() {
	return 'Tip: ' + this.tips[Math.floor(Math.random()*this.tips.length)];
};

notesoup.setCommandBar = function(str) {
	if (str == undefined) str = this.getTip();
	$('commandbar').value = str;
	//$('commandbar').focus();

	// IE doesn't have setSelectionRange
	if ($('commandbar').setSelectionRange)
		$('commandbar').setSelectionRange(0, $('commandbar').value.length);
};

