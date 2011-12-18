/*
	Notesoup PrototypeJS glue

	Copyright (c) 2007, Bill Roy
	This file is licensed under the Note Soup License
	See the file LICENSE that comes with this distribution

	Uses windows.js and prototype 1.5.0
	Dependencies must load first
*/
notesoup.ui = {

	initialize: function() {

		// Set up watchers for drag-move and drag-resize events
		var dndWatcher = {

			onEndMove: function(eventName, win) {

				// don't process non-note window events
				if (!(win.options.isnote)) return;

				var id = notesoup.ui.getNoteIDFromWindowID(win.getId());
				if (notesoup.notes[id] === undefined) notesoup.alert('FATAL: note not found in onEndMove');

				// The note may be 'doomed': held pending delete.
				// Ignore the notification if so
				if ('doomed' in notesoup.notes[id]) return;

				// Update note data, but only if something has really changed
				// parseint cha-cha is to remove the 'px' from '123px'
				var newx = '' + parseInt(win.element.style.left);
				var newy = '' + parseInt(win.element.style.top);
				var newz = '' + parseInt(win.element.style.zIndex);
				if (notesoup.debugmode) notesoup.debug('onmovenote ' + id + ' ' + newx + ' ' + newy + ' ' + newz + ' ' + typeof(newz));

				if ((newx != notesoup.notes[id].xPos) || (newy != notesoup.notes[id].yPos)) {
					notesoup.notes[id].xPos = newx;
					notesoup.notes[id].yPos = newy;
					notesoup.notes[id].zIndex = newz;

					// Send update to server
					notesoup.saveNote(notesoup.notes[id]);
				}
			},

			onEndResize: function(eventName, win) {

				// don't process non-note window events
				if (!(win.options.isnote)) return;

				var id = notesoup.ui.getNoteIDFromWindowID(win.getId());
				if (notesoup.notes[id] === undefined) notesoup.alert('FATAL: not not found in onEndResize');
				if (notesoup.debugmode) notesoup.debug('onresizenote ' + id);

				// The note may be 'doomed': held pending delete.
				// Ignore the notification if so
				if ('doomed' in notesoup.notes[id]) return;

				// Update note data, but only if something has really changed
				var sizes = win.getSize();
				if ((sizes['width'] != notesoup.notes[id].width) || (sizes['height'] != notesoup.notes[id].height)) {
					notesoup.notes[id].width = sizes['width'];
					notesoup.notes[id].height = sizes['height'];

					// Send update to server
					notesoup.saveNote(notesoup.notes[id]);
				}
			}
		};
		Windows.addObserver(dndWatcher);

		// Override the alert method to use the fancy window.js alert class
		//notesoup.alert = function(alertstr) {
		//	Dialog.alert(alertstr, {windowParameters: {}, okLabel: "ok"});
		//};

		// Init the folder list; this needs to be here instead of where the code
		// is inlined so that notesoup.foldername is set
		if (notesoup.ui.initFolderList)
			notesoup.ui.initFolderList();

		// Set up for the appropriate view type
		this.initView();

		// Start with the command bar focused
		$('commandbar').focus();

		// Float the command bars
		//new Draggable('controlicons', {});
		//new Draggable('commandbarwindow', {});
		//new Draggable('filterbar', {});

		notesoup.ui.defaultNoteColor= '#FFFF30';
		
		notesoup.ui.getRunScriptsCookie();
	},

	initView: function() {

/*
		// Set up the list view
		this.setViewType('list');	// or 'workspace'
		//Element.show($('notelist'));
		$('notelist').style.display = '';
		
*/
		// See if we have a view type cookie and honor it if so
		var viewTypeCookie = WindowUtilities.getCookie('notesoupviewtype');
		if (viewTypeCookie == 'list') {
			this.viewtype = 'list';
			$('notelist').style.display = 'block';
		} else {	// default to workspace view
			this.viewtype = 'workspace';
			notesoup.ui.defaultWindowClassName = "notesoupdefault";
		}
	},
	
	getCookie: function(cookiename) {
		return WindowUtilities.getCookie(cookiename);
	},

	setCookie: function(cookiename, newvalue) {
		WindowUtilities.setCookie(newvalue, [cookiename]);
	},
	
	// Called from the UI to switch view to the view type
	// TODO: Costs a refresh; could be smoother to tear down one and rebuild the other
	setViewType: function(newtype) {
		this.viewtype = newtype;
		var parameters = ['notesoupviewtype'];
		WindowUtilities.setCookie(newtype, parameters);
		notesoup.openFolder(notesoup.foldername);	// crude but effective; could be cheaper
	},


	// Given a window handle (which has '_win' on the end)
	// compute the associated noteid by trimming '_win' off the end
	trimTrailingString: function(id, tagstring) {
		var index = id.lastIndexOf(tagstring);
		if (index < 0) return id;				// tag not on this one
		if (index == (id.length - tagstring.length)) {
			id = id.substring(0, id.length - tagstring.length);
		}
		return(id);
	},

	getNoteIDFromWindowID: function(id) {
		return(this.trimTrailingString(id, '_win'));
	},
	
	getFolderIDFromFolderListID: function(id) {
		var folder = this.trimTrailingString(id, '_folder');

		// Tack on the username for one of our own folders (relative path)
		if (folder.split('/').length == 1)
			if (folder[0] != '/') folder = notesoup.username + '/' + folder;
		
		// KLUDGE: Strip off the initial '/' to normalize the pathname (fred/inbox)
		// TODO: fix this KLUDGE and provide true absolute/relative path handling here
		// TODO: by fixing the server side to handle it
		else folder = folder.substring(1, folder.length);

		return folder;
	},

	existsDOMNote: function(thenote) {
		return($(thenote.id + '_win'));
	},

	createDOMNote: function(thenote, editable) {
		if (this.viewtype == 'list') return this.createNoteListItem(thenote, editable);
		else return this.createFloatingNote(thenote, editable);
	},

	createFloatingNote: function(thenote, editable) {

		if (notesoup.debugmode) notesoup.debug('createDOMnote ' + thenote.id + ' ' + thenote.zIndex);

		// New note: brew up a DOM module for it
		var win = new Window(thenote.id + '_win', {
			className: notesoup.ui.defaultWindowClassName,
			//className: "alphacube",
			//className: "darkX",
			//className: "nuncio",
			//className: "theme1",
			title: thenote.notename, 
			top: thenote.yPos, left:thenote.xPos,
			height: thenote.height, width: thenote.width, 
			zIndex:thenote.zIndex,
			draggable: !notesoup.readonly,
			resizable: !notesoup.readonly, 
			showEffect: Element.show,			//Effect.Appear,
			//showEffect: Effect.Appear,
			//showEffectOptions: {'duration':.25},
			hideEffectOptions: {'duration':.25},
			menu: !notesoup.readonly,				// use our patched-in Note Menu
			draghandle: !notesoup.readonly,			// use our patched-in drag handle
			//autoheight: true,						// resize to fit
			isnote: true,
			closable: false, minimizable: false, maximizable: false
		});
		this.updateDOMNote(thenote);

		// set up the note as a drop target
		//Droppables.add($(thenote.id + '_win'),
		Droppables.add(thenote.getContentDiv(),
			{hoverclass: 'notedroptarget', onDrop: notesoup.ui.doNoteDrop});

		win.show();
	},

	doNoteDrop: function(elt, lastelt, event) {

		// This special behavior is all on the Alt key (Option on Safari)
		if (!event.altKey) return;

		// this function is a callback so we can't use 'this'
		var thenote = notesoup.notes[notesoup.ui.getNoteIDFromWindowID(elt.id)];

		//var thetarget = notesoup.notes[notesoup.ui.getNoteIDFromWindowID(lastelt.id)];
		var thetarget = notesoup.notes[notesoup.ui.getNoteIDFromWindowID(notesoup.ui.trimTrailingString(lastelt.id, '_content'))];

		if (!thenote || !thetarget) {
			Event.stop(event);
			return;
		}

		notesoup.debug('DROP: Appending note ' + thenote.notename + ' to ' + thetarget.notename + ' ' + event.altKey);

		// In Safari at least it is possible to drop a note onto itself in some cases
		if (thenote == thetarget) {
			Event.stop(event);
			return;
		}

		// Append the notename and text of the dropped note to the target's text field
		// The control key affordance is a little nicety that gives control over whether a newline is added
		var t = ('text' in thetarget) ? thetarget.text : '';
		if (!event.ctrlKey) t += '\n';
		t += ('notename' in thenote) ? thenote.notename + '\n' : '';
		t += ('text' in thenote) ? thenote.text : '';
		thetarget.set({'text':t});
		notesoup.saveNote(thetarget, notesoup.foldername);

		// TODO: Animate the note back to its starting point
		// BUG: saves in current position up in onEndMove
		// Save followed immediately by delete causes an ugly race condition
		// so we hide the window and schedule its demise for a moment later
		// TODO: fix this kludge when we have command chaining
		var win = Windows.getWindow(thenote.id + '_win');
		win.hide();
		thenote.set({'doomed':true});
		window.setTimeout('notesoup.deleteNote("' + thenote.id + '");', 1000);
		Event.stop(event);		// this one's been handled
	},

	updateDOMNote: function(thenote) {
	
		if (this.viewtype == 'list') return this.updateNoteListItem(thenote);
		else return this.updateFloatingNote(thenote);
	},

	updateFloatingNote: function(thenote) {

		if (notesoup.debugmode) notesoup.debug('updateDOMNote ' + thenote.id);

		var divmarkup = '';
		var isHardProxy = false;
		
		var thetext = '';
		if (thenote.text) thetext = thenote.text;
		if (isIE) {
			//thetext = thetext.split('/n').join('<br/>');
			thetext = '<pre>' + thetext + '</pre>';
		}
		if ((thenote.notetype == 'proxy') && !(thenote.proxysavethrough == true)) {

			isHardProxy = true;

			// Handle remote vs. local 'proxyfor' URI: local objects are mounted at /object/username/foldername/objectname
			var src = '';
			if ((thenote.proxyfor.substring(0, 5) == 'http:') || (thenote.proxyfor.substring(0, 6) == 'https:')) {
				src = thenote.proxyfor;
			}
			else src = '/object/' + thenote.proxyfor;

			// Special handling for images
			if (this.isImageFile(src)) {
				//divmarkup = "<div class='note' id='" + thenote.id + "'><img src='" + src + "' style='width:" + (thenote.width) + "; height:" + (thenote.height+10) + ";'/></div>"
				//divmarkup = "<div class='note' id='" + thenote.id + "'><a href='" + src + "' target='_blank'><img src='" + src + "' style='width:100%; height:95%'/></a></div>"
				divmarkup = "<div class='note' id='" + thenote.id + "'><a href='" + src + "' target='_blank'><img src='" + src + "' style='width:100%;'/></a>" + thetext + "</div>"
			}
			else {
				//divmarkup = "<iframe class='note' id='" + thenote.id + "' src='" + src + "'></iframe>";
				divmarkup = "<div class='note' id='" + thenote.id + "'>" + thetext + "<br><a href='" + src + "' target='_blank'>" + src + "</a></div>"
			}
		}
		else {
			divmarkup = "<div class='note' id='" + thenote.id + "'>" + thetext + "</div>";
		}

		// TODO: Review the many security issues this opens up
		var win = Windows.getWindow(thenote.id + '_win');
		var elt = win.getContent();
		elt.innerHTML = divmarkup;
		//elt.innerHTML = divmarkup.stripScripts();

		// Eval the script fragments: set up 'this' to be the note
		//setTimeout(function() {divmarkup.evalScripts()}, 25);		// makes 'this' = 'window'
		setTimeout(function() {
			divmarkup.extractScripts().map( function(script) { return thenote.eval(script); });
		}, 25);

		//var theMenuHandle = "<div style='float:right;' onclick='notesoup.ui.doNoteMenu(event, \"" + thenote.id + "\");'><img src='images/famfamfam.com/application_view_list.png'></div>";
		//var theColorMenuHandle = "<div style='float:right;' onclick='notesoup.ui.doColorMenu(event, \"" + thenote.id + "\");'><img src='images/famfamfam.com/color_wheel.png'></div>";
		//win.setTitle(thenote.notename + theColorMenuHandle + theMenuHandle);
		////win.setTitle('' + thenote.zIndex + ': ' + thenote.notename);
		win.setTitle(thenote.notename);

		win.setLocation(thenote.yPos, thenote.xPos);
		win.setSize(thenote.width, thenote.height);
		elt.style.background = thenote.bgcolor.toString();

		if (thenote['opacity'] != null)
			win.element.style.opacity = thenote['opacity'];
			//elt.style.opacity = thenote['opacity'];

		if (!(thenote.zIndex > 0)) {
			var newz = win.toFront();
			notesoup.notes[thenote.id].zIndex = newz;
		}
		else win.element.style.zIndex = thenote.zIndex;

		if (notesoup.debugdragdrop || (notesoup.debugmode > 3)) {
			win.setStatusBar(this.getNoteMetadataString(thenote));
		}

		// Set up edit-in-place module
		if (!notesoup.readonly && !isHardProxy) {
			notesoup.ui.makeEditable(thenote.id);
		}
	},


	getNoteMetadataString: function(thenote) {
		
		var n = function(x) { 
			return (x in thenote) ? thenote[x] : ''; 
		}
		
		var modtime = n('modtime');
		if (typeof(modtime) == 'string') modtime = parseFloat(modtime);
		modtime = 1000 * modtime;		// convert UNIX time to Javascript time
		
		return  n('id') + ' z=' + n('zIndex') + ' c=' + n('bgcolor') +
		' t=' + notesoup.timeStamp(modtime, 'datetime') +
		' x=' + n('xPos') + ' y=' + n('yPos') + 
		' w=' + n('width') + ' h=' + n('height');
	},


	deleteDOMNote: function(thenote) {
		if (this.viewtype == 'list') return this.deleteNoteListItem(thenote);
		else return this.deleteFloatingNote(thenote);
	},

	deleteFloatingNote: function(thenote) {

		// we could just nuke it...
		Windows.getWindow(thenote.id + '_win').destroy();

		// this looks prettier, but... ugh.
		// If this timeout becomes less than the timeout in createDOMNote
		// the note will be destroyed before the effect completes,
		// which is probably Not Good.
		//Windows.getWindow(thenote.id + '_win').hide();
		//window.setTimeout("Windows.getWindow(" + thenote.id + "+ '_win').destroy();", 500);
	},


	editDOMNote: function(thenote) {

		// Watch for command keystrokes in the edit stream
		var myeditWatchKeyboard = notesoup.ui.editWatchKeyboard.bindAsEventListener(notesoup.notes[thenote.id]);
		Event.observe($(thenote.id+'_win'), 'keypress', myeditWatchKeyboard, false);

		// TODO: fix the closure leak above
	
		var win = Windows.getWindow(thenote.id + '_win');

		var editButtons = '<span>&nbsp;';
		editButtons +=		'<input type="button" style="font-size:9px;" value="save" onclick="notesoup.ui.endEditDOMNote(notesoup.notes[\'' + thenote.id + '\'], true);"/>';
		editButtons +=		'&nbsp;';
		editButtons += 		'<input type="button" style="font-size:9px;" value="cancel" onclick="notesoup.ui.endEditDOMNote(notesoup.notes[\'' + thenote.id + '\'], false);"/>';
		editButtons += 		'&nbsp;&nbsp;</span>';
		win.setTitle('Editing: ' + thenote.notename + editButtons);

		var elt = win.getContent();

		// When you edit a window it comes to the front
		// the change gets committed when the edit is saved.
		notesoup.notes[thenote.id].zIndex = win.toFront();

		//var w = thenote.width;
		//var h = thenote.height;		
		//w = '100%'; h = '100%';
		var w = thenote.width;
		var h = Element.getDimensions(elt).height;	// capture current height for editing
		if (h < 250) h = 250;		// make sure we have enough room to edit
		
		var thetext = '';
		if (thenote.text) thetext = thenote.text;

		//var divmarkup = "<textarea wrap='virtual' class='note' id='"
		//		+ thenote.id + "' name='" + thenote.id + "_textarea' style='width:" + w
		//		+ ";height:" + h + "; background:" + thenote.bgcolor + ";'>"
		//		+ thenote.text.replace(/>/g, '&gt;').replace(/</g, '&lt;') + '</textarea>';
		var divmarkup = "<textarea wrap='virtual' class='note' id='"
				+ thenote.id + "' name='" + thenote.id + "_textarea' style='width:" + w
				+ "px; height:" + h + "px; background:" + thenote.bgcolor + ";'>"
				+ thetext.replace(/>/g, '&gt;').replace(/</g, '&lt;') + '</textarea>';
		elt.innerHTML = divmarkup;
		Field.focus(thenote.id);
		thenote['editing'] = true;

		var tip = 'Editing... Alt+S to save changes, Esc to exit.';
		notesoup.say(tip);
		//win.setStatusBar(tip);
	},
	
	endEditDOMNote: function(thenote, saveChanges) {

		if ('editing' in notesoup.notes[thenote.id]) 
			delete notesoup.notes[thenote.id]['editing'];
		else notesoup.say('Ended edit on a note we werent editing?!');

		newtext = $F(thenote.id);		// grab the edited text
		if (saveChanges) {
			notesoup.notes[thenote.id].text = newtext;
			notesoup.saveNote(thenote);
		}
		else {
			if (newtext != notesoup.notes[thenote.id].text) {
				var saveIt = notesoup.prompt('Ending edit mode.  Save changes? (yes/no/cancel)', 'cancel');
				if (saveIt == null) return;
				if (saveIt == 'cancel') return;
				if (saveIt == 'yes') {
					notesoup.notes[thenote.id].text = newtext;
					notesoup.saveNote(thenote);
				}
			}
		}
		notesoup.ui.updateDOMNote(thenote);
	},


	// Watch for a click on the note, and fire up the editor
	startEdit: function(event) {

		// notesoup.say('note clicked: ' + this.id);

		// If we're not frontmost, do that first
		var win = Windows.getWindow(this.id + '_win');
		var newz = win.toFront();
		notesoup.notes[this.id].zIndex = newz;

		// Kick the note into edit mode
		//notesoup.ui.editDOMNote(notesoup.notes[this.id]);
	},


	// Watch for command keystrokes in the edit stream
	editWatchKeyboard: function(event) {

		if (notesoup.debugmode > 3) {
			var key = String.fromCharCode(event.keyCode);
			if (event.ctrlKey) key = "Ctrl+" + key;
			if (event.altKey) key = " Alt+" + key;
			if (notesoup.debugMode > 3)
				notesoup.debug('Key: ' + key + ' ' + event.keyCode);
			if (notesoup.debugMode > 5)
				notesoup.say('Key: ' + key + ' ' + event.keyCode);
		}

		// ESC gets the terminate-edit UI
		if (event.keyCode == Event.KEY_ESC) {
			notesoup.ui.endEditDOMNote(this, false);
			Event.stop(event);
		}
		// CTRL+S saves the note
		else if ((event.keyCode == 83) && ((event.ctrlKey) || (event.altKey))) {
			notesoup.ui.endEditDOMNote(this, true);
			Event.stop(event);
		}
		// CTRL+L focuses on the command bar
		else if ((event.keyCode == 76) && ((event.ctrlKey) || (event.altKey))) {
			$('commandbar').focus();
			Event.stop(event);
		}
		// CTRL+F focuses on the filter bar
		else if ((event.keyCode == 70) && ((event.ctrlKey) || (event.altKey))) {
			$('textfilter').focus();
			Event.stop(event);
		}

		// Handle many special characters nicely thanks to bitprophet (tip o' the hat)		
		else checkTab(event);

	},


	makeEditable: function(noteid) {

		// Watch for a click on the note, and fire up the editor
		var mystartEdit = this.startEdit.bindAsEventListener(notesoup.notes[noteid]);
		Event.observe(noteid, 'click', mystartEdit, false);
		// TODO: THE ABOVE LEAKS AN OBSERVER CLOSURE PER EDIT
	},
	

	// Menu UI

	doWorkspaceMenu: function(event) {
		this.doMenu(event, 'workspacemenu');
	},

	doFolderMenu: function(event, foldername) {
		notesoup.targetFolder = foldername;
		this.doMenu(event, 'foldermenu');
	},
	
	doNoteMenu: function(event, noteid) {
		notesoup.targetNote = this.getNoteIDFromWindowID(noteid);
		this.doMenu(event, 'notemenu');
	},
	
	doNewNoteMenu: function(event) {
		this.doMenu(event, 'newnotemenu');	
	},


	doMenu: function(event, menuname) {

		var menu = $(menuname);

		if (!Event.isLeftClick(event)) {
			notesoup.say('UnLeft click on ' + menuname)
		}

		// move menu to cursor, offset so first item is highlighted
		menu.style.left = Math.max(0, Event.pointerX(event) - 5) + 'px';
		menu.style.top = Math.max(0, Event.pointerY(event) - 15) + 'px';

		// do nothing gracefully if it's already up
		if (menu.style.display != 'none') {
			Event.stop(event);
			return;
		}

		// make menu visible
		menu.style.display = '';
		//Effect.Grow(menu, {duration: 0.5});

		Event.stop(event);
		return false;
	},
	
	hideMenu: function(menuname) {
		//$(menuname).style.display = 'none';
		var menu = $(menuname);
		menu.style.display = 'none';
	},

	hideAllMenus: function() {
		//this.hideMenu('workspacemenu');
		//this.hideMenu('foldermenu');
		//this.hideMenu('notemenu');
		//this.hideMenu('newnotemenu');
		//this.hideMenu('folderlist');

//		$('workspacemenu').hide();
//		$('foldermenu').hide();
		$('notemenu').hide();
		$('newnotemenu').hide();
		//if (!notesoup.ui.showFolderlist)
		//	$('folderlist').hide();
	},

	// Tigra Color Picker integration; see picker.js for PATCH
	doColorMenu: function(event) {
		this.hideAllMenus();
		TCPopup(0,1, notesoup.ui.handleColorMenuPick);
	},
	
	handleColorMenuPick: function(theColor) {

		notesoup.ui.hideAllMenus();

		// Change the note data and push the update to the server
		notesoup.notes[notesoup.targetNote].set({'bgcolor': '#' + theColor});
		notesoup.saveNote(notesoup.notes[notesoup.targetNote]);

		// Hustle through a UI update
		var win = Windows.getWindow(notesoup.targetNote + '_win');
		var elt = win.getContent();
		elt.style.background = '#' + theColor;
	},


	editTitle: function() {

		var oldTitle = notesoup.notes[notesoup.targetNote].notename;
		var newTitle = notesoup.prompt('Enter a new title for this note:', oldTitle);
		if ((newTitle != null) && (newTitle != '')) {
			notesoup.notes[notesoup.targetNote].notename = newTitle;
			notesoup.saveNote(notesoup.notes[notesoup.targetNote]);
		}
	},


	/*
		Arrange the notes in the workspace view
	*/
	arrangeNotes : function(method, biasattr) {

		biasattr = biasattr ? biasattr :'yPos';
		var x = 10;
		var y = 40;
		var z = 1;
		var pagesize = WindowUtilities.getPageSize(); 

		switch (method.toLowerCase()) {

			case 'cascade':
				var notelist = notesoup.getNotesOrderedBy(biasattr, true, 'id');
				for (var i=0; i<notelist.length; i++) {
					notesoup.notes[notelist[i]].set({'xPos':x, 'yPos':y, 'zIndex':z, 'showme':true, 'syncme':true});
					x += 40;
					y += 40;
					z += 1;
				}
				break;
	
			case 'tile':
				var maxy = 0;
				//for (var n in notesoup.notes) {
				var notelist = notesoup.getNotesOrderedBy(biasattr, true, 'id');
				notesoup.say('notelist: ' + notelist);

				for (var i=0; i<notelist.length; i++) {
					n = notelist[i];

					// Would this note extend offscreen to the right?
					notesoup.say('tiling note ' + n);
					var w = 'width' in notesoup.notes[n] ? notesoup.notes[n].width : 100;
					if (typeof(w) == 'string') w = parseInt(w);
	
					if ((x + w) > pagesize.windowWidth) {
						x = 10;
						y = maxy - 10;
					}
	
					notesoup.notes[n].set({'xPos':x, 'yPos':y, 'showme':true, 'syncme':true});
	
					//var h = notesoup.notes[n].height;
					//if (typeof(h) == 'string') h = parseInt(h);
					var h = Element.getHeight($(n + '_win'));

					if ((y + h) > maxy) maxy = y + h;
					x += (w + 12);
				}
				break;
	
			default:	// Random
				for (var n in notesoup.notes) {
					notesoup.notes[n].set({
						'xPos': Math.floor(Math.random() * (pagesize.windowWidth - notesoup.notes[n].width)),
						'yPos': Math.floor(Math.random() * (pagesize.windowHeight - notesoup.notes[n].height)),
						'zIndex': Math.floor(Math.random() * 100),
						'showme': true,
						'syncme': true
					});
				}
				break;
		}
		notesoup.syncToServer();	// force an immediate sync of those changed notes
	},

	isImageFile: function(filename) {

		if (filename == undefined) return false;

		var imageExtensions = ['.png$','.jpg$','.gif$'];
		for (var i = 0; i < imageExtensions.length; i++) {
			var t = new RegExp(imageExtensions[i]);
			if (t.test(filename.toLowerCase())) return true;
		}
		return false;
	},

	// See if we have a runScripts cookie and honor it if so
	getRunScriptsCookie: function() {
		// MISO: not in miso.  there's no button to reset it.
		notesoup.runScripts = true;
		return;

		var runScriptsCookie = WindowUtilities.getCookie('notesouprunscripts');
		if (runScriptsCookie == 'disable') {
			notesoup.runScripts = false;
		}
		else notesoup.runScripts = true;
		notesoup.updateRunScriptsIndicator();
	},
	
	// Set the runScripts cookie.
	//
	// The value 'disable' turns off scripts.
	// All other values including cookie-not-present enable scripts.
	//
	setRunScriptsCookie: function(newsetting) {
		var parameters = ['notesouprunscripts'];
		WindowUtilities.setCookie(newsetting, parameters);
	},


	// Bumper
	// =this.ui.bumper()
	// =this.ui.bumpn(100);
	//

	bumper: function() {

		notesoup.say('Bumper 0.0');
		if (!notesoup.gfx) {
			notesoup.ui.initCanvas();
			notesoup.ui.showCanvas();
			notesoup['gfx'] = new jsGraphics('canvas');
			notesoup.say('Graphics initialized...');
			notesoup.gfx.setColor('#aa1111');
			notesoup.gfx.fillEllipse(200,200,20,40);
			notesoup.gfx.paint();
			//alert('yo zero');
		}

		var b = 12;
		var pad = 0;
		var notelist = notesoup.getNotesOrderedBy('zIndex', true, 'id');
		//notesoup.say('bumper 1');
		//notesoup.say(notelist);
		//notesoup.say(typeof(notelist));
		//notesoup.say(notelist.length);

		for (var o = 0; o < notelist.length; o++) {

			var bumps = 0;
			var thisnote = notesoup.notes[notelist[o]];
			notesoup.say('checking ' + thisnote.notename + ' ' + thisnote.zIndex);

			var tx = parseInt(thisnote.xPos);
			var ty = parseInt(thisnote.yPos);
			var tw = parseInt(thisnote.width);
			//var th = parseInt(thisnote.height);
			var th = Element.getHeight(thisnote.id + '_win')
			
			if (notesoup.gfx) {
				notesoup.gfx.setColor('#228822');			
				notesoup.gfx.drawRect(tx, ty, tw, th);
				notesoup.gfx.paint();
				//alert('yo');
			}

			for (var i = o+1; i < notelist.length; i++) {
	
				var othernote = notesoup.notes[notelist[i]];
	
				// Ignore notes below this one in the z-order
				if (othernote.zIndex <= thisnote.zIndex) continue;

				//notesoup.say('...vs... ' + othernote.notename + ' ' + othernote.zIndex);
	
				var ox = parseInt(othernote.xPos) - pad;
				var oy = parseInt(othernote.yPos) - pad;
				var ow = parseInt(othernote.width) + 2*pad;
				//var oh = parseInt(othernote.height) + 2*pad;
				var oh = Element.getHeight(othernote.id + '_win') + 2*pad;

				if (notesoup.gfx) {
					notesoup.gfx.setColor('#888822');	// orange
					notesoup.gfx.drawRect(ox, oy, ow, oh);
					notesoup.gfx.paint();
					//alert('oy');
				}

				function pointIn(tx, ty) {
				
					if (notesoup.gfx) {
						notesoup.gfx.setColor('#228888');	// yellow
						notesoup.gfx.fillEllipse(tx, ty, 10, 10);
						notesoup.gfx.paint();
					}
				
					return (
						(tx >= ox) && (tx <= (ox+ow)) &&
						(ty >= oy) && (ty <= (oy+oh))
					);
				}
				function bumpby(dx, dy) {
					var newx = parseInt(thisnote.xPos) + dx;
					var newy = parseInt(thisnote.yPos) + dy;
			
					var kmin = 50;
					if (newx < kmin) newx = kmin;
					if (newy < kmin) newy = kmin;
					thisnote.set({
						'xPos': newx,
						'yPos': newy,
						'showme': true
						//'syncme': true
					});
					notesoup.syncUI();

					if (notesoup.gfx) {
						notesoup.gfx.setColor('#882222');	// red
						notesoup.gfx.fillEllipse (newx, newy, 10, 10);
						notesoup.gfx.paint();
					}

					//notesoup.say('Moved: ' + thisnote.notename);
					thisnote.setContentDiv('STATE: Avoiding ' + othernote.notename);
					bumps++;
				}

				//var oelt = othernote.getContentDiv();
				//var oelt = $(othernote.id + '_win');
	
				// Top left covered?  Move down and right
				if (pointIn(tx, ty)) bumpby(thisnote, 0, +b);
				else if (pointIn(tx+tw, ty)) bumpby(thisnote, 0, +b);
				else if (pointIn(tx, ty+th)) bumpby(thisnote, 0, -b);
				else if (pointIn(tx+tw, ty+th)) bumpby(thisnote, 0, -b);
				else if (pointIn(tx+(tw/2), ty+(th/2))) bumpby(thisnote, +b, 0);

				if (bumps > 0) {
					//thisnote.setContentDiv('STATE: Avoiding ' + othernote.notename);
					//continue;
				}
			}
			// gravity (up)
			//if (bumps <= 0) this.bumpby(thisnote, 0, -(1));
			if (bumps <= 0) thisnote.setContentDiv('STATE: Namaste');
		}
		window.setTimeout('notesoup.ui.bumper()', 500);
	},
	
	bumpn: function(n) {
		for (var i = 0; i < n; i++) 
			notesoup.ui.bumper();
	}
};

	
notesoup.marquee = {
	payload: '',
	offset: 0,
	interval: 40,
	longinterval: 1000,
	starttime: 0,
	endtime: 0,

	push: function(someText) {
		var wasRunning = (notesoup.marquee.payload.length > 0);
		notesoup.marquee.payload += someText;
		if (!wasRunning) {
			notesoup.marquee.update();
			notesoup.marquee.starttime = new Date().getTime();
		}
	},

	update: function() {
		if (notesoup.marquee.offset >= notesoup.marquee.payload.length) {
			notesoup.marquee.payload = '';
			notesoup.marquee.offset = 0;
			$('commandbar').value = '';
			notesoup.marquee.endtime = new Date().getTime();
			notesoup.say('' + (notesoup.marquee.endtime - notesoup.marquee.starttime)/1000 + ' seconds');
			return;		// do NOT set timer for re-call
		}

		if (notesoup.marquee.payload[notesoup.marquee.offset] == '[') {
			notesoup.say('found [');
			notesoup.marquee.offset++;
			notesoup.marquee.offset++;
			notesoup.doCommand($('commandbar').value);
		}
		else if (notesoup.marquee.payload[notesoup.marquee.offset] == '\n') {
			notesoup.marquee.payload = notesoup.marquee.payload.substring(notesoup.marquee.offset+1);
			notesoup.marquee.offset = 0;
			window.setTimeout('notesoup.marquee.update();', notesoup.marquee.longinterval);
			return;
		}
		else {
			$('commandbar').value = notesoup.marquee.payload.substring(0, notesoup.marquee.offset+1);
			notesoup.marquee.offset++;
		}

		window.setTimeout('notesoup.marquee.update();', notesoup.marquee.interval);
	}
};



