/*
	Notesoup Ext.js 1.1 glue

	Copyright (c) 2007, Bill Roy
	This file is licensed under the Note Soup License
	See the file LICENSE that comes with this distribution
*/


notesoup.ui = {

	initialize: function() {

		//notesoup.prompt = function(promptStr, defaultValue) {
		//	return Ext.MessageBox.prompt('Note Soup', promptStr, defaultValue);
		//};

		notesoup.alert = function(msg) {
            Ext.MessageBox.show({
                title : 'Note Soup says:',
                msg : msg,
                buttons: Ext.MessageBox.OK,
                //width: 350,
                width: 800,
                height:600,
                scope : notesoup
            });
            return this;
        },
		//	return Ext.MessageBox.alert('Note Soup says:', promptStr, defaultValue);
 		//};


		this.backgroundColorMenu = new Ext.menu.ColorMenu({
			id: 'backgroundColorMenu',
			handler : function(cm, color) {
				document.body.style.background = '#' + color;
			}
		});

		this.pageMenu = new Ext.menu.Menu({
			id: 'pageMenu',
			items: [
				{text: 'Show Folder Tree', handler: notesoup.ui.initFolderTree},
				{text: 'Show Grid View', handler: notesoup.ui.gridview},
				{text: 'Show Debug Console', handler: function() {Ext.log('debugger here...');}},
				'-',
				{text: 'Erase all notes(!)', handler: function() {notesoup.erase()}},
				'-',
				{text: 'Arrange/Tile', handler: function() {notesoup.ui.arrangeNotes('tile');}},
				{text: 'Arrange/Cascade', handler: function() {notesoup.ui.arrangeNotes('cascade');}},
				{text: 'Arrange/Random', handler: function() {notesoup.ui.arrangeNotes('random');}},
				'-',
				{text: 'Bookmarklet/Instant Soup', handler: function() {notesoup.makeBootBookmarkletNote();}},
				{text: 'Bookmarklet/Instant Note', handler: function() {notesoup.makeQuickNoteBookmarkletNote();}},
				'-',
				{text: 'Set desktop color', menu: this.backgroundColorMenu, icon: notesoup.imageHost + 'images/famfamfam.com/color_wheel.png'}
			]
		});

		this.colorMenu = new Ext.menu.ColorMenu({
			id: 'colorMenu',
			handler : function(cm, color) {
				notesoup.ui.handleColorMenuPick(color);
			}
		});


		this.noteMenu = new Ext.menu.Menu({
			id: 'noteMenu',
			items: [
				{text: 'Edit Note', handler: function(e) {
					notesoup.ui.getTargetNote().toFront();
					notesoup.ui.getTargetNote().setRenderFunc(soupnote.prototype.htmleditor);
				}, icon: notesoup.imageHost + 'images/famfamfam.com/note_edit.png'},
				{text: 'Edit Note as Text', handler: function(e) {
					notesoup.ui.getTargetNote().toFront();
					notesoup.ui.getTargetNote().setRenderFunc(soupnote.prototype.plaintexteditor);
				}, icon: notesoup.imageHost + 'images/famfamfam.com/note_edit.png'},
				{text: 'Edit Title', handler: function() {notesoup.ui.editTitle(notesoup.ui.getTargetNote());}, icon: notesoup.imageHost + 'images/famfamfam.com/tag_blue_edit.png'},
				{text: 'Edit Note Fields', handler: function() {
					notesoup.ui.getTargetNote().setRenderFunc(soupnote.prototype.fieldeditor);
				}, icon: notesoup.imageHost + 'images/famfamfam.com/tag_blue_edit.png'},
				'-',
				{text: 'Set Background', menu: this.colorMenu, icon: notesoup.imageHost + 'images/famfamfam.com/color_wheel.png'},
				'-',
				{text: 'Duplicate Note', handler: function() {
					notesoup.sendNote(notesoup.targetNote, notesoup.foldername, notesoup.foldername, false);
				}, icon: notesoup.imageHost + 'images/famfamfam.com/note_add.png'},
				'-',
				//{text: 'Send to User...', handler: function() {notesoup.sendNoteToUser(notesoup.targetNote);}, icon: notesoup.imageHost + 'images/famfamfam.com/user_go.png'},
				{text: 'Send as email...', handler: function() {
					var thebody = notesoup.notes[notesoup.targetNote].text || '';
					thebody = thebody.replace(/<br\/>/g, '');
					document.location.href = 'mailto:?' + Ext.urlEncode({
							subject: notesoup.notes[notesoup.targetNote].notename || '',
							body: thebody
						});
				}, icon: notesoup.imageHost + 'images/famfamfam.com/user_go.png'},
				'-',
				{text: 'Run as Script', handler: function() {notesoup.notes[notesoup.targetNote].run();}, icon: notesoup.imageHost + 'images/famfamfam.com/application_go.png'},
				'-',
				{text: 'Send to Trash', handler: function() {notesoup.deleteNote(notesoup.targetNote);}, icon: notesoup.imageHost + 'images/famfamfam.com/note_delete.png'}
			]
		});

		this.showNoteMenu = function(e) {
			e.stopEvent();
			var node = e.target;
			while (node != document.body) {
				//notesoup.say('node: ' + node.id + ' [' + node.className + ']');
				if (node.className == 'note') {
					//notesoup.say('notemenu for: ' + node.id);
					notesoup.targetNote = node.id;
					notesoup.ui.noteMenu.showAt(e.getXY());
					return;
				}
				node = node.parentNode;
			}
			//notesoup.say('docbody contextmenu id= ' + e.getTarget().id);
			notesoup.ui.pageMenu.showAt(e.getXY());
		};
		Ext.get(document.body).on('contextmenu', notesoup.ui.showNoteMenu);


		this.newNoteMenu = new Ext.menu.Menu({
			id: 'newNoteMenu',
			tooltip: {title:'New Note Menu', text: 'Click to create a new note'},
			items: [
				{text: 'My card...', handler: function() {notesoup.sendNote('bizcard','user/templates',notesoup.foldername,false);}, icon: notesoup.imageHost + 'images/famfamfam.com/note_add.png'},
				{text: 'Clock', handler: function() {notesoup.sendNote('clock','user/templates',notesoup.foldername,false);}, icon: notesoup.imageHost + 'images/famfamfam.com/note_add.png'},
				{text: 'Timer', handler: function() {notesoup.sendNote('timer','user/templates',notesoup.foldername,false);}, icon: notesoup.imageHost + 'images/famfamfam.com/note_add.png'},
				{text: 'The Button', handler: function() {notesoup.sendNote('button','user/templates',notesoup.foldername,false);}, icon: notesoup.imageHost + 'images/famfamfam.com/note_add.png'},
				{text: 'Personalize the Workspace', handler: function() {notesoup.sendNote('workspacebackground','user/templates',notesoup.foldername,false);}, icon: notesoup.imageHost + 'images/famfamfam.com/note_add.png'},
				{text: 'Latency', handler: function() {notesoup.sendNote('latency','user/templates',notesoup.foldername,false);}, icon: notesoup.imageHost + 'images/famfamfam.com/note_add.png'}
			]
		});

		this.tbColorMenu = new Ext.menu.ColorMenu({
			handler : function(cm, color){
				if (typeof(color) == 'object') return; // handle spurious callback BUG
				notesoup.ui.defaultNoteColor = '#' + color.toString();
				notesoup.say('Default color set to: ' + notesoup.ui.defaultNoteColor);
				notesoup.ui.commandbar.getEl().dom.style.background = notesoup.ui.defaultNoteColor;
				notesoup.ui.commandbar.focus();
			}
		});

		this.commandbar = new Ext.form.TextField({width: 700, fieldClass: 'commandbar'});
		this.commandbar.setValue('Welcome to Note Soup...');

		this.filterbar = new Ext.form.TextField({width: 200, fieldClass: 'commandbar'});
		//this.filterbar.setValue('filter bar');

		this.tb = new Ext.Toolbar('toolbar', [], {
			width: 200
		});
		this.tb.add({
				text: '&nbsp;&nbsp;&nbsp;&nbsp;',
				icon: notesoup.imageHost + 'images/famfamfam.com/note_add.png',
				menu: this.newNoteMenu
			}, 
			//new Ext.Toolbar.Spacer(),
			new Ext.Toolbar.Separator(),
			{
				text: '&nbsp;&nbsp;&nbsp;&nbsp;',
				icon: notesoup.imageHost + 'images/famfamfam.com/color_wheel.png',
				menu: this.tbColorMenu
			},
			new Ext.Toolbar.Separator(),
			new Ext.Toolbar.Spacer(),
			new Ext.Toolbar.Button({
				text: '&nbsp;&nbsp;&nbsp;',
				icon: notesoup.imageHost + 'images/famfamfam.com/accept.png',
				handler: function() {
					notesoup.doCommand(notesoup.ui.commandbar.getValue());
				}
			}),
			new Ext.Toolbar.Spacer(),
			new Ext.Toolbar.Spacer(),
			this.commandbar,
			new Ext.Toolbar.Spacer(),
			new Ext.Toolbar.Spacer(),
			new Ext.Toolbar.Spacer(),
			new Ext.Toolbar.Spacer(),
			'-',
			new Ext.Toolbar.Spacer(),
			new Ext.Toolbar.Spacer(),
			'Filter:',
			this.filterbar,
			new Ext.Toolbar.Button({
				text: '&nbsp;&nbsp;&nbsp;',
				icon: notesoup.imageHost + 'images/famfamfam.com/cancel.png',
				handler: function() {
					notesoup.ui.filterNotes('');
				}
			})
		);

		this.commandbarEl = this.commandbar.getEl();
		this.commandbarEl.on('keyup', this.commandBarWatcher);
		this.commandbar.focus();

		this.filterbarEl = this.filterbar.getEl();
		this.filterbarEl.on('keyup', this.filterBarWatcher);

		if (!('folderlist' in notesoup))
			notesoup.folderlist = ['inbox', 'trash', 'wx'];
		//this.initFolderTree();

		this.folderMenu = new Ext.menu.Menu({
			id: 'folderMenu',
			items: [
				{text: 'New Folder...', handler: function() {notesoup.createFolder();},
					icon: notesoup.imageHost + 'images/famfamfam.com/folder_add.png'},
				{text: 'Open Folder', handler: function() {
						notesoup.openFolder(notesoup.targetFolder);
					},
					icon: notesoup.imageHost + 'images/famfamfam.com/folder_go.png'},
				'-',
				{text: 'Copy Folder to...', handler: function() {
					notesoup.copyFolder(notesoup.targetFolder, null);
				},
					icon: notesoup.imageHost + 'images/famfamfam.com/folder_add.png'},
				{text: 'Rename Folder...', handler: function() {notesoup.renameFolder();},
					icon: notesoup.imageHost + 'images/famfamfam.com/folder_edit.png'},
				'-',
				{text: 'Set Folder Password...', handler: function() {
						notesoup.setFolderPassword(notesoup.targetFolder);
					},
					icon: notesoup.imageHost + 'images/famfamfam.com/lock.png'},
				'-',
				{text: 'Empty the Trash', handler: function() {notesoup.emptyTrash();},
					icon: notesoup.imageHost + 'images/famfamfam.com/database_delete.png'},
				'-',
				{text: 'Logout', handler: function() {notesoup.logout();},
					icon: notesoup.imageHost + 'images/famfamfam.com/disconnect.png'},
			]
		});


		Ext.QuickTips.init();
		//Ext.dd.DragDropMgr.mode = 1;	// set INTERSECT mode for dd (breaks Ext.tree DD)

		notesoup.ui.defaultNoteColor= '#FFFF30';
		notesoup.ui.getRunScriptsCookie();
		notesoup.marquee.push('Type here and press Enter to create a note..........');
		this.noteTemplate = new Ext.Template(this.noteTemplateSource);
		// =this.noteTemplate = this.rawnoteTemplate
		this.rawnoteTemplate = new Ext.Template(this.rawnoteTemplateSource);
	},


	// <div id='foldertree' style='width:250px; border: 1px solid gray;'></div>
	//
	initFolderTree: function() {
		
		var eltid = 'foldertree';
		$(eltid).innerHTML = '<div class="commandbar"><center>my soup</center></div><hr/><div id="foldertreewindow"></div>';
		$(eltid).style.zIndex = 20000;
		$(eltid).style.background = '#fafaff';
		$(eltid).style.opacity = 0.6;

		var treeWindow = new Ext.Resizable(eltid, {
			//wrap:true,
			pinned:false,
			width: 200,
			height:400,
			minWidth:50,
			minHeight: 50,
			preserveRatio: false,
			handles: 'se',
			draggable:true,
			widthIncrement: 10,
			heightIncrement: 10,
			dynamic:true		// dynamic OR animate
		});
	
		var foldertree = new Ext.tree.TreePanel('foldertreewindow', {
			rootVisible: false,
			animate:true, 
			enableDD: true,
			enableDrop:true,
			containerScroll: true
			//ddGroup: 'soup',
			//dropConfig: {appendOnly:true},
		});
		var root = new Ext.tree.TreeNode({
			allowDrag: false,
			allowDrop: false
		});
		foldertree.setRootNode(root);

		var myFolders = root.appendChild(new Ext.tree.TreeNode({
			text: 'private folders', 
			cls: 'foldertree',
			allowDrag: false,
			allowDrop: true
		}));

		for (var i=0; i<notesoup.folderlist.length; i++) {
			var node = myFolders.appendChild(new Ext.tree.TreeNode({
				text:notesoup.folderlist[i],
				iconCls: 'a-folder', 
				leaf: true,
				allowDrag: true,
				allowDrop: true
			}));
			node.on('click', function(node, evt) {
				evt.stopEvent();
				var foldername = this.text;
				if (foldername.split('/').length < 2)
					foldername = notesoup.username + '/' + foldername;
				notesoup.openFolder(foldername);
			}, node);
		}

		var sharedFolders = root.appendChild(new Ext.tree.TreeNode({
			text: 'shared folders',
			leaf: false,
			cls: 'foldertree',
			allowDrag: false,
			allowDrop: true
		}));
		var node = sharedFolders.appendChild(new Ext.tree.TreeNode({
			text: 'shared',
			leaf: true,
			allowDrag: true,
			allowDrop: true
		}));
		var publicFolders = root.appendChild(new Ext.tree.TreeNode({
			text: 'public folders',
			leaf: false,
			cls: 'foldertree',
			allowDrag: false,
			allowDrop: true
		}));
		var node = publicFolders.appendChild(new Ext.tree.TreeNode({
			text: 'public',
			leaf: true,
			allowDrag: true,
			allowDrop: true
		}));
		var peopleFolders = root.appendChild(new Ext.tree.TreeNode({
			text: 'people',
			leaf: false,
			cls: 'foldertree',
			allowDrag: false,
			allowDrop: true
		}));
		var node = peopleFolders.appendChild(new Ext.tree.TreeNode({
			text: 'harry@seattle.net',
			leaf: true,
			allowDrag: true,
			allowDrop: true
		}));
		var node = peopleFolders.appendChild(new Ext.tree.TreeNode({
			text: 'sally@speakeasy.net',
			leaf: true,
			allowDrag: true,
			allowDrop: true
		}));

		foldertree.render();
		root.expandChildNodes(true);

		// these do not fire
		foldertree.on('dragdrop', function(tree, node, targetDD, evt) {
			notesoup.say('tree dragdrop for ' + node.text);
		});

		foldertree.on('dragenter', function() {
			notesoup.say('dragenter');
			// var n = e.dropNode;
		}, foldertree);

		foldertree.on('dragover', function() {
			notesoup.say('dragover');
			// var n = e.dropNode;
		}, foldertree);

		foldertree.on('nodedragover', function() {
			notesoup.say('tree nodedragover');
			// var n = e.dropNode;
		}, foldertree);
	
		foldertree.on('beforenodedrop', function(dropevt) {
			notesoup.say('tree beforenodedrop');
			return true;
		});
		foldertree.on('nodedrop', function(dropevt) {
			notesoup.say('tree nodedrop');
		});
		foldertree.on('contextmenu', function(node, evt) {
			notesoup.say('tree context menu for ' + node.text);
			notesoup.targetFolder = node.text;
			evt.stopEvent();
			notesoup.ui.folderMenu.showAt(evt.getXY());
		}, foldertree);
	},


	// Given a window handle (which has '-rzwrap' or some such on the end)
	// compute the associated noteid by trimming off the end
	trimTrailingString: function(id, tagstring) {
		var index = id.lastIndexOf(tagstring);
		if (index < 0) return id;				// tag not on this one
		if (index == (id.length - tagstring.length)) {
			id = id.substring(0, id.length - tagstring.length);
		}
		return(id);
	},

	divSuffix: '-rzwrap',
	contentSuffix: '_content',

	getTargetNote: function() {
		return notesoup.notes[notesoup.targetNote];
	},

	getNoteIDFromWindowID: function(id) {
		return(this.trimTrailingString(id, this.divSuffix));
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
		return($(thenote.id + this.divSuffix));
	},

	createDOMNote: function(thenote, editable) {

		if (notesoup.debugmode) notesoup.debug('createDOMnote ' + thenote.id + ' ' + thenote.zIndex);

		var item = document.createElement('div');
		item.setAttribute('id', thenote.id);
		item.className = 'note';
		item.style.left = 0;
		item.style.top = 0;
		//$('notezone').appendChild(item);
		document.body.appendChild(item);

		var custom = new Ext.Resizable(thenote.id, {
			wrap:true,
			pinned:false,
			width: thenote.width,
			height:thenote.height,
			minWidth:50,
			minHeight: 50,
			preserveRatio: false,
			handles: 'e',
			draggable:true,
			widthIncrement: 10,
			heightIncrement: 10,
			dynamic:true		// dynamic OR animate
		});
	
		var customEl = custom.getEl();
		thenote.flash('#ffff00');		// yelo helo

		//Ext.get(thenote.id).events['contextmenu'] = true;
		//Ext.get(thenote.id + notesoup.ui.divSuffix).on('contextmenu', function(e) { 
		//	notesoup.say('note contextmenu id= ' + e.target.id);
		//	e.stopEvent();
		//	notesoup.ui.noteMenu.showAt(e.getXY());
		//});

		customEl.on('dblclick', function(e) {
			var thenote = notesoup.notes[notesoup.ui.getNoteIDFromWindowID(this.id)];
			thenote.toFront();
			thenote.setRenderFunc(e.shiftKey ? soupnote.prototype.plaintexteditor : soupnote.prototype.htmleditor);
		});
		
		customEl.on('click', function(e) {
			var thenote = notesoup.notes[notesoup.ui.getNoteIDFromWindowID(this.id)];
			thenote.toFront();
			//notesoup.say('click! ' + thenote.id);
		});
	
		custom.on('resize', function(theElt, newWidth, newHeight, event) {
			//alert('resize: ' + id + ' ' + newWidth + ' ' + newHeight);
			var thenote = notesoup.notes[notesoup.ui.getNoteIDFromWindowID(this.getEl().id)];
			thenote.width = newWidth;
			thenote.height = newHeight;
			thenote.save();
			//thenote.show();
		});
	
		custom.on('beforeresize', function(theElt, event) {
			var thenote = notesoup.notes[notesoup.ui.getNoteIDFromWindowID(this.getEl().id)];
			thenote.toFront();
			return true;
		});

		custom.dd.b4StartDrag = function(e) {
			var thenote = notesoup.notes[notesoup.ui.getNoteIDFromWindowID(this._domRef.id)];
			thenote.toFront();
			notesoup.drag = {
				id: thenote.id,
				start: new Date().getTime(),
				x: this.initPageX,
				y: this.initPageY
			};
			return true;
		};

		custom.dd.addToGroup('TreeDD');

		custom.dd.onDrag = function(e) {
			var thenote = notesoup.notes[notesoup.ui.getNoteIDFromWindowID(this._domRef.id)];

			var d = notesoup.drag;
			d.end = new Date().getTime();
			d.deltat = notesoup.drag.end - notesoup.drag.start;
			d.deltax = this.lastPageX - d.x; d.x = this.lastPageX;
			d.deltay = this.lastPageY - d.y; d.y = this.lastPageY;
			d.dbar = Math.sqrt((d.deltax * d.deltax) + (d.deltay * d.deltay))
			d.velocity = d.dbar / (d.deltat/1000.0);
			//$('commandbar').value = 'drag: ' + d.velocity;

			return true;
		};


		custom.dd.onDragDrop = function(e, thedd) {
			e.stopEvent();
			var thenote = notesoup.notes[notesoup.ui.getNoteIDFromWindowID(this.getEl().id)];
			var outerDiv = Ext.get(thenote.id + notesoup.ui.divSuffix);

			var droptarget = (typeof(thedd) == 'string') ? thedd : thedd[0].handleElId + '***';
			//notesoup.say('Valid drop: Dropping ' + thenote.id + ' on ' + droptarget);

			var newLeft = parseInt(outerDiv.getLeft());
			var newTop = parseInt(outerDiv.getTop());
			//alert('Drop: '+ noteid + ' ' + newLeft + ' ' + newTop);
			thenote.xPos = newLeft;
			thenote.yPos = newTop;

			var d = notesoup.drag;
			if (e.shiftKey && d.velocity > 20) {
				if (d.velocity > 300) d.velocity = 300;
				var dx = d.velocity * (d.deltax / d.dbar);
				var dy = d.velocity * (d.deltay / d.dbar);
				thenote.xPos = Math.max(0, newLeft + dx);
				thenote.yPos = Math.max(0, newTop + dy);
				outerDiv.moveTo(thenote.xPos, thenote.yPos, true);
			}
			//thenote.save();
			thenote.set({syncme: true});
		};

		custom.dd.onInvalidDrop = function(e, thedd) {
			var thenote = notesoup.notes[notesoup.ui.getNoteIDFromWindowID(this.getEl().id)];
			var outerDiv = Ext.get(thenote.id + notesoup.ui.divSuffix);

			var droptarget = null;
			notesoup.say('Dropping ' + thenote.id + ' on ' + droptarget);

			var newLeft = parseInt(outerDiv.getLeft());
			var newTop = parseInt(outerDiv.getTop());
			//alert('Drop: '+ noteid + ' ' + newLeft + ' ' + newTop);
			thenote.xPos = newLeft;
			thenote.yPos = newTop;

			var d = notesoup.drag;
			if (d.velocity > 20) {
				if (d.velocity > 300) d.velocity = 300;
				var dx = d.velocity * (d.deltax / d.dbar);
				var dy = d.velocity * (d.deltay / d.dbar);
				thenote.xPos = Math.max(0, newLeft + dx);
				thenote.yPos = Math.max(0, newTop + dy);
				outerDiv.moveTo(thenote.xPos, thenote.yPos, true);
			}
			thenote.save();
			notesoup.ui.commandbar.focus()
			return true;
		};

		custom.dd.onDragOver =
		custom.dd.onDragEnter = function(e, ids) {
			//if (ids[0].handleElId[0] != 'n')
			//	notesoup.say('drag over ' + ids[0].handleElId);
			if (e.shiftKey) {
				var thenote = notesoup.notes[notesoup.ui.getNoteIDFromWindowID(this.getEl().id)];
				//notesoup.say('Skuffling: ' + thenote.id);
				thenote.skuffle(this.lastPageX, this.lastPageY);
			}
			return true;
		};

		custom.dd.onDragOut = function(e, ids) {
			return true;
			//var theid = ids[0]._domRef.id;
			//$('commandbar').value = 'DragOut: ' + notesoup.ui.getNoteIDFromWindowID(theid);
		};

		//this.updateDOMNote(thenote);
	},


	// The template for rendering a normal note
	noteTemplateSource: [
		'<div class="x-box-tl"><div class="x-box-tr">',
		'<div class="x-box-tc"></div>',
		'</div></div>',
		'<div class="x-box-ml"><div class="x-box-mr"><div class="x-box-mc">',
			'<div class="notetitle">{notename}',
				'<img id="{id}_menu"',
				' src="', notesoup.baseuri , 'images/famfamfam.com/bullet_arrow_down.png"',
				' style="float:right;cursor:pointer;"/>',
			'</div>',
			'<div class="notebody" id="{id}_content" ',
			'style="background:{bgcolor};">{displayText}</div>',
		'</div></div></div>',
		'<div class="x-box-bl"><div class="x-box-br" id="{id}_br"><div class="x-box-bc"></div></div></div>'
	],

		rawnoteTemplateSource: [
		//'<div class="x-box-tl"><div class="x-box-tr">',
		//'<div class="x-box-tc"></div>',
		//'</div></div>',
		//'<div class="x-box-ml"><div class="x-box-mr"><div class="x-box-mc">',
			'<div style="border: 1px solid gray;">',
				'<div class="notetitle">{notename}',
					'<img id="{id}_menu"',
					' src="images/famfamfam.com/bullet_arrow_down.png"',
					' style="float:right;cursor:pointer;"/>',
				'</div>',
				'<div class="notebody" id="{id}_content" ',
				'style="background:{bgcolor};">{displayText}</div>',
			'</div>',
		//'</div></div></div>',
		//...'<div class="x-box-bl"><div class="x-box-br" id="{id}_br"><div class="x-box-bc"></div></div></div>'
		'<div class="x-box-br" id="{id}_br"></div>'
	],


	syncAll: function() {
		for (var n in notesoup.notes) notesoup.notes[n].syncDivs();
	},


	getTopZ: function() {
		var topz = -99999;
		for (var n in notesoup.notes) {
			if (!('zIndex' in notesoup.notes[n]) || (typeof(notesoup.notes[n].zIndex) != 'number')) {
				notesoup.notes[n].zIndex = 0;	// damaged but visible
			}
			if (notesoup.notes[n].zIndex > topz) topz = notesoup.notes[n].zIndex;
		}

		if (typeof(topz) != 'number') {
			notesoup.say('OOPS! topz');
			return 10101;
		}
		return (topz < 0) ? 0 : topz+1;
	},


	deleteDOMNote: function(thenote) {
		var theElt = Ext.get(thenote.id + this.divSuffix);
		thenote.flash('#808080');
		theElt.fadeOut({remove: true, duration: 0.8});
		//$('notezone').removeChild(Ext.getDom(thenote.id + this.divSuffix));
	},


	handleColorMenuPick: function(theColor) {

		// For some reason a spurious call comes here via the event chain
		if (typeof(theColor) == 'object') return;
		//notesoup.say('color: ' + theColor.toString());

		// Change the note data and push the update to the server
		var thenote = notesoup.ui.getTargetNote();
		thenote.set({'bgcolor': '#' + theColor.toString()});
		thenote.save();
		thenote.show();
	},


	editTitle: function() {
		var thenote = notesoup.ui.getTargetNote();
        Ext.MessageBox.show({
			title: 'Edit Note Name',
			msg: 'Enter a new title for this note:',
			scope: thenote,
			value: thenote.notename,
			width: 300,
			buttons: Ext.MessageBox.OKCANCEL,
			prompt: true,
			multiline: false,
			fn: function(btn, text) {
				if (btn == 'ok') {
					this.notename = text;
					this.save();
					this.show();
				}
			}
		});
		
		//var newTitle = notesoup.prompt('Enter a new title for this note:', oldTitle);
		//if ((newTitle != null) && (newTitle != '')) {
		//	thenote.notename = newTitle;
		//	thenote.save();
		//	thenote.show();
		//}
	},


	/*
		Arrange the notes in the workspace view
	*/
	arrangeNotes : function(method, biasattr) {

		biasattr = biasattr ? biasattr :'yPos';
		var x = 10;
		var y = 40;
		var z = 1;
		//var pagesize = WindowUtilities.getPageSize(); 
		var pagesize = {
			windowWidth: Ext.lib.Dom.getViewWidth(), 
			windowHeight: Ext.lib.Dom.getViewHeight()
		};

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
				//notesoup.say('notelist: ' + notelist);

				for (var i=0; i<notelist.length; i++) {
					n = notelist[i];

					// Would this note extend offscreen to the right?
					//notesoup.say('tiling note ' + n);
					var w = 'width' in notesoup.notes[n] ? notesoup.notes[n].width : 100;
					if (typeof(w) == 'string') w = parseInt(w);
	
					if ((x + w) > pagesize.windowWidth) {
						x = 10;
						y = maxy + 10;
					}
	
					notesoup.notes[n].set({xPos:x, yPos:y, showme:true, syncme: true});
	
					var h = notesoup.notes[n].height;
					if (typeof(h) == 'string') alert('wtf');	//	h = parseInt(h);
					//var h = Ext.get($(n + '-rzwrap')).getHeight();

					if ((y + h) > maxy) maxy = y + h;
					x += (w + 10);
				}
				break;
	
			default:	// Random
				for (var n in notesoup.notes) {
					notesoup.notes[n].set({
						'xPos': Math.floor(Math.random() * (pagesize.windowWidth)),
						'yPos': Math.floor(Math.random() * (pagesize.windowHeight)),
						'zIndex': Math.floor(Math.random() * 100),
						'showme': true,
						'syncme': true
					});
				}
				break;
		}
		//notesoup.syncToServer();	// force an immediate sync of those changed notes
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
	},
	
	// Set the runScripts cookie.
	//
	// The value 'disable' turns off scripts.
	// All other values including cookie-not-present enable scripts.
	//
	setRunScriptsCookie: function(newsetting) {
		throw "up";
	}
}


/* 
	Growl-like Notification window stack
*/
notesoup.notificationCount = 0;
notesoup.notificationLife = 5000;	// ms the message stays visible

notesoup.ui.onClickNotification = function(e) {
	var item = Ext.get(e.target);
	//notesoup.say('item clicked ' + item.id);
	if (item.dom.className.indexOf('frozen') < 0) {
		item.addClass('frozen');
	}
	else {
		$('notificationwindow').removeChild(item.dom);
	}
};

notesoup.ui.onNotificationTimeout = function(id) {
	if ($(id).className.indexOf('frozen') < 0) { 
		$('notificationwindow').removeChild($(id));
	}
};

// say: Display a notification
//
notesoup.say = function(s, level) {

	level = level || 'info';

	// Set the status bar display	
	window.status = s;
	if (level == 'info') return;

	// create the div with id/class
	var item = document.createElement("div");
	var id = 'notification' + notesoup.notificationCount++;
	item.setAttribute('id', id);
	item.className = 'notificationitem';
	//item.innerHTML = "<img src='images/famfamfam.com/bullet_black.png'/>" + s;

	switch (level) {
		case 'warning':	item.style.background = '#ffff00'; break;
		case 'error': 	item.style.background = '#ff0000'; break;
		case 'tell':	item.style.background = '#aaaaff'; break;
		default: break;	// catch 'info' case here; post the naked string without markup
	}
	item.innerHTML = s;

	$('notificationwindow').appendChild(item);

	Ext.get(item).on('click', function(e) {
		notesoup.ui.onClickNotification(e);
	});

	// schedule its demise
	window.setTimeout('notesoup.ui.onNotificationTimeout("' + id + '");', notesoup.notificationLife);
};


// sigh...
function $(element) {
  if (typeof element == 'string')
    element = document.getElementById(element);
  return element;
}

notesoup.ui.gridview = function() {

	var NoteRecord = Ext.data.Record.create([
		{name: 'notename', mapping: 'notename'},
		{name: 'id', mapping: 'id'},
		{name: 'bgcolor', mapping: 'bgcolor'},
		{name: 'xPos', mapping: 'xPos'},
		{name: 'yPos', mapping: 'yPos'},
		{name: 'zIndex', mapping: 'zIndex'},
		{name: 'width', mapping: 'width'},
		{name: 'height', mapping: 'height'},
		{name: 'text', mapping: 'text'},
		{name: 'proxyfor', mapping: 'proxyfor'},		
		{name: 'editing', mapping: 'editing'},
		{name: 'syncme', mapping: 'syncme'},
		{name: 'showme', mapping: 'showme'}
	]);
	var notelist = [];
	for (var n in notesoup.notes) notelist.push(notesoup.notes[n]);
	var ds = new Ext.data.Store({
		proxy: new Ext.data.MemoryProxy(notelist),
		reader: new Ext.data.ArrayReader({id:'id'}, NoteRecord)
	});
	ds.load();

	var cm = new Ext.grid.ColumnModel([
		{header: "Title", dataIndex: 'notename', width: 30, sortable: true,
           editor: new Ext.grid.GridEditor(new Ext.form.TextField({
               allowBlank: false
           }))
		},
		{header: "ID / Filename", dataIndex: 'id', width: 10, sortable: true},
		{header: "Color", dataIndex: 'bgcolor', width: 10, sortable: true},
		{header: "xPos", dataIndex: 'xPos', width: 10, sortable: true},
		{header: "yPos", dataIndex: 'yPos', width: 10, sortable: true},
		{header: "zIndex", dataIndex: 'zIndex', width: 10, sortable: true,
			editor: new Ext.grid.GridEditor(new Ext.form.NumberField({
				allowBlank: false,
				allowNegative: false,
				maxValue: 10
			}))
		},
		{header: "width", dataIndex: 'width', width: 10, sortable: true},
		{header: "height", dataIndex: 'height', width: 10, sortable: true},
		{header: "text", dataIndex: 'text', width: 100, sortable: true, multiline: true},
		{header: "proxyfor", dataIndex: 'proxyfor', width: 50, sortable: true},
		{header: "editing", dataIndex: 'editing', width: 10, sortable: true},
		{header: "syncme", dataIndex: 'syncme', width: 10, sortable: true},
		{header: "showme", dataIndex: 'showme', width: 10, sortable: true}
	 ]);
    var grid = new Ext.grid.EditorGrid('notegrid', {
        ds: ds,
        cm: cm,
        minColumnWidth: 15,
        autoSizeColumns: true,
        autoSizeHeaders: true,
        enableColumnMove: true, 
        stripeRows: true,
        enableColLock:false
    });
    grid.render();
	 $('notegrid').style.zIndex = 65535;
	 $('notegrid').style.opacity = 0.9;
	 $('notegrid').style.background = '#f8f8ff';
};



notesoup.ui.filterBarWatcher = function(event) {
	//if (event.keyCode == 13) 
	notesoup.ui.filterNotes(notesoup.ui.filterbar.getValue());
};


notesoup.ui.filterNotes = function(filterstring) {

	var reg = new RegExp(filterstring, 'i');
	var shouldShow = (filterstring.length > 0) ?
		function(thenote) {
			return (reg.test(thenote.text) || reg.test(thenote.notename));
		} : 
		function(thenote) { return true; };

	for (var n in notesoup.notes) {
		var thenote = notesoup.notes[n];
		var elt = Ext.get(n + notesoup.ui.divSuffix);

		if (shouldShow(thenote)) {
			elt.setOpacity(thenote.opacity);
			elt.setStyle('zIndex', thenote.zIndex);
		}
		else {
			elt.setStyle('opacity', 0.2);
			elt.setStyle('zIndex', 0);
		}
	}
};
