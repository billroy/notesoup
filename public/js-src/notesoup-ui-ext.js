/**
*	notesoup-ui-ext.js: Note Soup Ext.js 2.0 glue
*
*	Copyright 2007, 2008 Bill Roy
*	This file is licensed under the Note Soup Client License
*	See http://notesoup.net/js/LICENSE
*/

/** Extjs 2.0 UI integration */
notesoup.ui = {

	defaultNoteColor: '#FFFF30',		// '#ffff99' is nice too, the old color

	/**
	*	merge the passed-in options into notesoup.ui
	*	@param {object} opts options to merge into notesoup.ui
	*/
	set: function(opts) {
		for (var o in opts) this[o] = opts[o];
	},


	/**
	*	Initialize the UI.  Called once at startup.
	*/
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
        };
		//	return Ext.MessageBox.alert('Note Soup says:', promptStr, defaultValue);
 		//};

		Ext.QuickTips.init();
		Ext.dd.DragDropMgr.preventDefault = false;

		this.addWidgetMenu = new Ext.menu.Menu({
			id: 'addWidgetMenu',
			items: [
				{text: 'Clock', handler: function() {
					notesoup.saveNote({
						notename: 'Clock',
						width: 100,
						imports: 'system/widgets/@Clock'
					});
				}, icon: notesoup.imageHost + 'images/famfamfam.com/clock.png'},
				//{text: 'Deck', handler: function() {
				//	notesoup.saveNote({
				//		notename: 'Deck',
				//		width: 150,
				//		bgcolor: '#008000',
				//		imports: 'system/widgets/@Deck'
				//	});
				//}, icon: notesoup.imageHost + 'images/famfamfam.com/emoticon_grin.png'},
				{text: 'Ink', handler: function() {
					notesoup.saveNote({
						notename: 'Ink',
						color: 'black',
						imports: 'system/widgets/@Ink'
					});
				}, icon: notesoup.imageHost + 'images/famfamfam.com/paintbrush.png'},
/*****
				{text: 'Portable Hole', handler: function() {
					notesoup.saveNote({
						notename: '',
						imports: 'system/widgets/@Portable Hole'
					});
				}, icon: notesoup.imageHost + 'images/famfamfam.com/picture.png'},
*****/
/*****
				{text: 'Send a Message', handler: function() {
					notesoup.saveNote({
						notename: 'Send a Message',
						width: 330,
						imports: 'system/widgets/@Send a Message'
					});
				}, icon: notesoup.imageHost + 'images/famfamfam.com/sound.png'},
*****/
/*****
				{text: 'Sound Board', handler: function() {
					notesoup.saveNote({
						notename: 'Sound Board',
						width: 115,
						imports: 'system/widgets/@Sound Board'
					});
				}, icon: notesoup.imageHost + 'images/famfamfam.com/bell.png'},
*****/
				{text: 'Timer', handler: function() {
					notesoup.saveNote({
						notename: 'Timer',
						imports: 'system/widgets/@Timer'
					});
				}, icon: notesoup.imageHost + 'images/famfamfam.com/clock_red.png'}
			]
		});


		this.addMenu = new Ext.menu.Menu({
			id: 'addMenu',
			allowOtherMenus: true,
			items: [
				{text: 'Help!', handler: function() {
					window.open('/folder/system/help', '', '', false);
				}, icon: notesoup.imageHost + 'images/famfamfam.com/help.png'},

				{text: 'About Note Soup', handler: function() {
					window.open('/folder/system/about', '', '', false);
				}, icon: notesoup.imageHost + 'images/famfamfam.com/information.png'},

				'-',

				{text: 'Add a Note...', handler: function() {
					var notename = notesoup.prompt('Add Note: Enter a title:', 'hello world');
					if (!notename.length) return;
					var notetext = notesoup.prompt('Add Note: Enter the text of the note; separate multiple lines with "/" like line 1/line 2.  (You can fix mistakes later.)', '');
					if (!notetext.length) return;
					notesoup.saveNote({
						notename: notename, 
						text: notetext.split('/').join('<br/>')
					});
					notesoup.marquee.put('The fastest way to make a note is to type it here in the command bar......');
				}, icon: notesoup.imageHost + 'images/famfamfam.com/page_white_add.png'},

				{text: 'Add a Link...', handler: function() {
					var link = notesoup.prompt('Add Link: Enter web URL:', document.location);
					if (!link) return;
					return notesoup.createBookmark(link);
				}, icon: notesoup.imageHost + 'images/famfamfam.com/link_add.png'},

				{text: 'Add Image Link...', handler: function() {
					var link = notesoup.prompt('Add Image Link: Enter image URL:', 'http://notesoup.net/images/notesoup-color.gif');
					if (!link) return;
					return notesoup.createBookmark(link, true);
				}, icon: notesoup.imageHost + 'images/famfamfam.com/image_add.png'},

				{text: 'Add RSS Feed...', handler: function() {
					var link = notesoup.prompt('Add RSS Feed: Enter RSS feed URL:', 'http://notesoup.net');
					if (!link) return;
					return notesoup.createNoteFromFeed(link);
				}, icon: notesoup.imageHost + 'images/famfamfam.com/rss_add.png'},

				{text: 'Create a Door...', handler: function() {notesoup.ui.createDoor();},
					icon: notesoup.imageHost + 'images/famfamfam.com/door.png'},

				{text: 'Add Flickr Image Show...', handler: function() {
					var link = notesoup.prompt('Add Flickr Image Show: Enter keyword for public image search:', 'unicorn');
					if (!link) return;
					return notesoup.saveNote({
						notename: link,
						imports: '/js-src/js-widgets/flickrjson.js'
					});
				}, icon: notesoup.imageHost + 'images/famfamfam.com/photo_add.png'},

				{text: 'Make Note From Markup...', handler: function() {
					var text = notesoup.prompt('Add HTML markup, widget, object, embed, markup, sticker, badge, button: Paste some HTML markup from a third party site here:',
						[	'<center', '<a href="http://notesoup.net">',
							'<img src="', notesoup.imageHost, 'images/getnotesoup.png" />',
							'</a>', '</center>'
						].join(''));
					if (!text) return;
					var title = notesoup.prompt('Enter a title:', 'get soup');
					if (!title) return;
					notesoup.saveNote({
						notename: title,
						text: text
					});
				}, icon: notesoup.imageHost + 'images/famfamfam.com/script_code_red.png'},
				'-',
				{text: 'Add Background Image...', handler: function() {
					var link = notesoup.prompt('Add Background Image: Enter image URL:', 'http://notesoup.net/images/notesoup-color.gif');
					if (!link) return;

					notesoup.saveNote({
						notename: 'set desktop background image',
						zIndex: 0,
						//opacity: 0.5,
						text: [
							'<script type="text/javascript">',
								'document.body.style.background="white url(', link, ') no-repeat scroll center center";',
							"</script>This note sets the desktop background image."
						].join('')
					});
				}, icon: notesoup.imageHost + 'images/famfamfam.com/photo_add.png'},

				'-',
				//{text: 'Add From System Template...', handler: function() {
				//	notesoup.ui.getTemplateList(); 
				//}, icon: notesoup.imageHost + 'images/famfamfam.com/page_white_star.png'},

				{text: 'Add From My Templates...', handler: function(e) {
					notesoup.ui.getTemplateList(e.region.right, e.region.top);
					//notesoup.say('arg to menu item handler: ' + e.id);
				}, icon: notesoup.imageHost + 'images/famfamfam.com/page_white_add.png'},

				'-',
				{text: 'Add Featured Widget', 
					menu: this.addWidgetMenu, 
					icon: notesoup.imageHost + 'images/famfamfam.com/page_white_gear.png'
				},
				{text: 'Browse the Widget Library', handler: function() {
					window.open('/folder/widgets/public', '', '', false);
				}, icon: notesoup.imageHost + 'images/famfamfam.com/door_in.png'}
/*****
				,
				'-',
				{text: 'Upload Files...', handler: function() {
					//notesoup.ui.createNoteFromTemplate('File Upload');
					return notesoup.saveNote({
						notename: 'File Upload',
						imports: 'system/widgets/@File Upload'
					});
				}, icon: notesoup.imageHost + 'images/famfamfam.com/page_white_add.png'},
*****/
			]
		});

		this.arrangeMenu = new Ext.menu.Menu({
			id: 'arrangeMenu',
			items: [
				{text: 'Tile', handler: function() {notesoup.ui.arrangeNotes('tile');},
					icon: notesoup.imageHost + 'images/famfamfam.com/application_view_icons.png'},
				{text: 'Tile Tight', handler: function() {notesoup.ui.arrangeNotes('tight');},
					icon: notesoup.imageHost + 'images/famfamfam.com/application_view_icons.png'},
				{text: 'Cascade', handler: function() {notesoup.ui.arrangeNotes('cascade');},
					icon: notesoup.imageHost + 'images/famfamfam.com/application_view_icons.png'},
				{text: 'Random', handler: function() {notesoup.ui.arrangeNotes('random');},
					icon: notesoup.imageHost + 'images/famfamfam.com/application_view_icons.png'},
				{text: 'Stack', handler: function() {notesoup.ui.arrangeNotes('stack');},
					icon: notesoup.imageHost + 'images/famfamfam.com/application_view_icons.png'}
			]
		});

		this.sharingMenu = new Ext.menu.Menu({
			id: 'sharingMenu',
			items: [
				{text: 'About Sharing...', handler: function() {
					window.open('/folder/system/sharing', '', '', false);
				}, icon: notesoup.imageHost + 'images/famfamfam.com/help.png'},
				'-',				
				{text: 'Make Folder Public', handler: function() {notesoup.makeFolderPublic(notesoup.foldername);},
					icon: notesoup.imageHost + 'images/famfamfam.com/lock_open.png'},
				'-',
/***
				{text: 'Set Folder Password...', handler: function() {notesoup.setFolderPassword(notesoup.foldername);},
					icon: notesoup.imageHost + 'images/famfamfam.com/lock.png'},
***/
				{text: 'Folder Access Control', handler: function() {
					//notesoup.ui.createNoteFromTemplate('Folder Access Control');
					return notesoup.saveNote({
						notename: 'Folder Access Control',
						imports: 'system/widgets/@Folder Access Control'
					});
				},	icon: notesoup.imageHost + 'images/famfamfam.com/lock_edit.png'},
				'-',
				{text: 'Make Folder Private', handler: function() {notesoup.makeFolderPrivate(notesoup.foldername);},
					icon: notesoup.imageHost + 'images/famfamfam.com/lock.png'},
				'-',
				{text: 'Sync Now', handler: function() {
					notesoup.say('Syncing ' + notesoup.foldername + '...');
					notesoup.syncToServer();
				},	icon: notesoup.imageHost + 'images/famfamfam.com/arrow_refresh.png'}
			]
		});

		this.backgroundColorMenu = new Ext.menu.ColorMenu({
			id: 'backgroundColorMenu',
			handler : function(cm, color) {
				if (typeof(color) == 'object') return;
				//document.body.style.background = '#' + color;
				notesoup.saveNote({
					notename: 'set desktop color',
					bgcolor: '#' + color,
					zIndex: 0,
					opacity: 0.5,
					text: "<script type='text/javascript'>document.body.style.background='#" + color + "';</script>This note sets the desktop background color."
				});
			}
		});


		this.folderMenu = new Ext.menu.Menu({
			id: 'folderMenu',
			items: [
				{text: 'New Folder...', handler: function() {notesoup.createFolder();},
					icon: notesoup.imageHost + 'images/famfamfam.com/folder_add.png'},
				{text: 'Open Folder', id: 'openfoldermenu', menu: notesoup.ui.folderListMenu,
					icon: notesoup.imageHost + 'images/famfamfam.com/folder_go.png'},
				'-',
				{text: 'Copy Folder To...', handler: function() {
					notesoup.copyFolder(notesoup.foldername);
				},	icon: notesoup.imageHost + 'images/famfamfam.com/camera_add.png'},
				{text: 'Create Folder Backup', handler: function() {notesoup.ui.createFolderBackup();},
					icon: notesoup.imageHost + 'images/famfamfam.com/camera.png'},
				{text: 'Export Folder', handler: function() {notesoup.ui.exportFolder();},
					icon: notesoup.imageHost + 'images/famfamfam.com/camera_go.png'},

				//{text: 'Rename Folder...', handler: function() {notesoup.renameFolder();},
				//	icon: notesoup.imageHost + 'images/famfamfam.com/folder_edit.png'},
				'-',
				{text: 'Arrange Folder',  menu: this.arrangeMenu, icon:notesoup.imageHost + 'images/famfamfam.com/application_view_tile.png'},
				'-',
				{text: 'Set Background Color', menu: this.backgroundColorMenu, icon: notesoup.imageHost + 'images/famfamfam.com/color_swatch.png'},
				{
					text: 'Set Background Color', 
					icon: notesoup.imageHost + 'images/famfamfam.com/color_wheel.png',
					handler: function() {
						notesoup.saveNote({
							notename: 'Set Background Color',
							bgcolor: 'white',
							target: 'background',
							imports: '/js-src/js-widgets/colorpicker.js'
						});
					}
				},
				'-',
				{text: 'Sharing', menu: this.sharingMenu, icon: notesoup.imageHost + 'images/famfamfam.com/group.png'},
				'-',
				{text: 'Send All to Trash...', handler: function() {notesoup.erase();},
					icon: notesoup.imageHost + 'images/famfamfam.com/lightning.png'},
				{text: 'Delete This Folder...', handler: function() {notesoup.deleteFolder();},
					icon: notesoup.imageHost + 'images/famfamfam.com/lightning.png'},
				{text: 'Empty the Trash', handler: function() {notesoup.emptyTrash();},
					icon: notesoup.imageHost + 'images/famfamfam.com/database_delete.png'},
				'-',
				{text: 'Show Debug Console', handler: function() {Ext.log('debugger here...');},
					icon: notesoup.imageHost + 'images/famfamfam.com/bug.png'},
				'-',
				{text: 'Change Password', handler: function() {notesoup.setPassword();},
					icon: notesoup.imageHost + 'images/famfamfam.com/lock_edit.png'},
				'-',
				{text: 'Logout', handler: function() {notesoup.logout();},
					icon: notesoup.imageHost + 'images/famfamfam.com/disconnect.png'}
			]
		});

		//'-',
		//{text: 'Bookmarklet/Instant Soup', handler: function() {notesoup.makeBootBookmarkletNote();}},
		//{text: 'Bookmarklet/Instant Note', handler: function() {notesoup.makeQuickNoteBookmarkletNote();}},

		this.colorMenu = new Ext.menu.ColorMenu({});
			//id: 'colorMenu'
			//handler : function(cm, color) {
			//	if (typeof(color) == 'string')
			//		notesoup.ui.getTargetNote().setColor('#' + color);
			//	else notesoup.say('colorMenu: ' + typeof(color) + ' ' + color.toString());
			//}
		//});
		
		this.colorMenuHandler = function(cm, color) {
			if (typeof(color) == 'string')
				notesoup.ui.getTargetNote().setColor('#' + color);
			else notesoup.say('colorMenu: ' + typeof(color) + ' ' + color.toString());
		};
		//this.colorMenu.on('select', this.colorMenuHandler, this);

		this.colorMenuClickHandler = function(ci, e) {
			var color = '#' + ci.palette.value;
			notesoup.ui.getTargetNote().setColor(color);
		};
		this.colorMenu.on('click', this.colorMenuClickHandler, this);

		this.sendMenu = new Ext.menu.Menu({
			id: 'sendMenu',
			items: [
				{text: 'To Folder', id:'sendoriginalmenuitem', menu: notesoup.ui.folderListMenu,
					icon: notesoup.imageHost + 'images/famfamfam.com/folder_go.png'},
				{text: 'To User...', handler: function() {
					notesoup.sendNoteToUser(notesoup.targetNote);}, 
					icon: notesoup.imageHost + 'images/famfamfam.com/user_go.png'},
				{text: 'Reply...', handler: function() {
					notesoup.ui.getTargetNote().sendReply();}, 
					icon: notesoup.imageHost + 'images/famfamfam.com/user_go.png'},
				{text: 'To Back', handler: function() {
					notesoup.ui.getTargetNote().toBack();
					//notesoup.ui.getTargetNote().save();
				}, 
					icon: notesoup.imageHost + 'images/famfamfam.com/application_cascade.png'}
			]
		});

		this.sendCopyMenu = new Ext.menu.Menu({
			id: 'sendCopyMenu',
			items: [
				{text: 'To Folder', id:'sendcopymenuitem', menu: notesoup.ui.folderListMenu,
					icon: notesoup.imageHost + 'images/famfamfam.com/folder_go.png'},
				{text: 'To User...', handler: function() {
					notesoup.sendNoteToUser(notesoup.targetNote, null, false);}, 
					icon: notesoup.imageHost + 'images/famfamfam.com/user_go.png'}
			]
		});

		this.noteDebugMenu = new Ext.menu.Menu({
			id: 'noteDebugMenu',
			items: [
				{text: 'Show Source', handler: function(e) {
					notesoup.ui.getTargetNote().toFront();
					notesoup.ui.getTargetNote().setRenderFunc(soupnote.prototype.plaintexteditor);
				}, icon: notesoup.imageHost + 'images/famfamfam.com/page_white_edit.png'},
				{text: 'Show Fields', handler: function() {
					notesoup.ui.getTargetNote().setRenderFunc(soupnote.prototype.fieldeditor);
				}, icon: notesoup.imageHost + 'images/famfamfam.com/table_edit.png'},
				{text: 'Get Info...', handler: function() { alert(notesoup.dump(notesoup.notes[notesoup.targetNote])); },
					icon: notesoup.imageHost + 'images/famfamfam.com/information.png'},
				'-',
				{text: 'Run as Script', handler: function() {notesoup.notes[notesoup.targetNote].run();}, 
					icon: notesoup.imageHost + 'images/famfamfam.com/application_go.png'},
				'-',
				{text: 'Enable Logging', handler: function() { notesoup.setDebug(4); },
					icon: notesoup.imageHost + 'images/famfamfam.com/zoom.png'},
				{text: 'Disable Logging', handler: function() { notesoup.setDebug(0); },
					icon: notesoup.imageHost + 'images/famfamfam.com/zoom_out.png'},
				'-',
				{text: 'Show Debug Console', handler: function() {Ext.log('debugger here...');},
					icon: notesoup.imageHost + 'images/famfamfam.com/bug.png'}
			]
		});

		this.noteMenu = new Ext.menu.Menu({
			id: 'noteMenu',
			items: [
				{text: 'Edit Text', handler: function(e) {
					notesoup.ui.getTargetNote().toFront();
					notesoup.ui.getTargetNote().setRenderFunc(soupnote.prototype.htmleditor);
				}, icon: notesoup.imageHost + 'images/famfamfam.com/page_edit.png'},
				{text: 'Edit Title', handler: function() {notesoup.ui.getTargetNote().editTitle();}, 
					icon: notesoup.imageHost + 'images/famfamfam.com/table_edit.png'},
				'-',
				{text: 'Set Note Color', menu: this.colorMenu, icon: notesoup.imageHost + 'images/famfamfam.com/color_swatch.png'},
				{
					text: 'Set Note Color', 
					icon: notesoup.imageHost + 'images/famfamfam.com/color_wheel.png',
					handler: function() {
						notesoup.saveNote({
							notename: 'Set Note Color',
							bgcolor: 'white',
							target: 'note',
							targetnoteid: notesoup.ui.getTargetNote().id,
							imports: '/js-src/js-widgets/colorpicker.js'
						});
					}
				},
				'-',
				{text: 'Duplicate Note', handler: function() {
					notesoup.sendNote(notesoup.targetNote, notesoup.foldername, notesoup.foldername, false);
					notesoup.notes[notesoup.targetNote].bump(25, 25);
				}, icon: notesoup.imageHost + 'images/famfamfam.com/page_copy.png'},
				'-',
				{text: 'Tinker', menu: this.noteDebugMenu, icon: notesoup.imageHost + 'images/famfamfam.com/wand.png'},
				'-',
				{text: 'Send', menu: notesoup.ui.sendMenu,
					icon: notesoup.imageHost + 'images/famfamfam.com/page_go.png'},
				{text: 'Send a Copy', menu: notesoup.ui.sendCopyMenu,
					icon: notesoup.imageHost + 'images/famfamfam.com/page_add.png'},
				{text: 'Send As Email...', handler: function() {
					var thebody = notesoup.notes[notesoup.targetNote].text || '';
					thebody = thebody.replace(/<br\/>/g, '');
					document.location.href = 'mailto:?' + Ext.urlEncode({
							subject: notesoup.notes[notesoup.targetNote].notename || '',
							body: thebody
						});
				}, icon: notesoup.imageHost + 'images/famfamfam.com/email_go.png'},
				'-',
				{text: 'Send to Trash', handler: function() {notesoup.deleteNote(notesoup.targetNote);}, 
					icon: notesoup.imageHost + 'images/famfamfam.com/page_delete.png'}
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
			notesoup.ui.folderMenu.showAt(e.getXY());
		};
		Ext.get(document.body).on('contextmenu', notesoup.ui.showNoteMenu);

		this.tbColorMenu = new Ext.menu.ColorMenu({
			handler : function(cm, color) {
				if (typeof(color) == 'object') return; // handle spurious callback BUG
				notesoup.ui.defaultNoteColor = '#' + color.toString();
				notesoup.say('Default color set to: ' + notesoup.ui.defaultNoteColor);
				notesoup.ui.commandbar.getEl().dom.style.background = notesoup.ui.defaultNoteColor;
				notesoup.ui.commandbar.focus();
			}
		});
/***
		this.tbColorPicker = function() {
			Ext.get('colorpicker').show();
			notesoup.say('Pick a color...');
			ColorPicker(
				document.getElementById('slide'),
				document.getElementById('picker'),
				function(hex, hsv, rgb) {
					console.log(hsv.h, hsv.s, hsv.v);
					console.log(rgb.r, rgb.g, rgb.b);
					//document.body.style.backgroundColor = hex;
					notesoup.ui.defaultNoteColor = hex;
					notesoup.say('Default color set to: ' + notesoup.ui.defaultNoteColor);
					notesoup.ui.commandbar.getEl().dom.style.background = notesoup.ui.defaultNoteColor;
					notesoup.ui.commandbar.focus();

					//Ext.get('colorpicker').hide();
				});
		};

		this.tbColorPicker.on('select', function(field, color) {
			notesoup.say('color: ' + notesoup.dump(color));
			notesoup.ui.defaultNoteColor = '#' + color.toString();
			notesoup.say('Default color set to: ' + notesoup.ui.defaultNoteColor);
			notesoup.ui.commandbar.getEl().dom.style.background = notesoup.ui.defaultNoteColor;
			notesoup.ui.commandbar.focus();
		});
*/
		this.commandbar = new Ext.form.TextField({
		//this.commandbar = new Ext.form.TextArea({
			//height: 20,
			//grow: true,
			//growMin: 22,
			//emptyText: 'type here to create a note',
			width: 500, 
			tooltip: {text:'type here to create a note: for example, shoppling list/milk/bread', title:'Command Bar'},
			fieldClass: 'commandbar'});
		this.commandbar.setValue('Welcome to Note Soup...');

		this.filterbar = new Ext.form.TextField({
			width: 100, 
			tooltip: {text:'type here to find notes matching what you type', title:'Filter Bar'},
			fieldClass: 'commandbar'});
		//this.filterbar.setValue('filter bar');


		this.tb = new Ext.Toolbar();
		this.tb.render('toolbar');
		this.tb.add(
			new Ext.Toolbar.Spacer(),
			{
				cls:"x-btn-text-icon",
				icon: notesoup.imageHost + 'images/famfamfam.com/page_white_add.png',
				tooltip: {text:'click to add stuff to this folder', title:'Add Menu'},
				menu: this.addMenu
				//tooltip: {text:'click to create a new note from a template', title:'New Note Menu'},
				//handler: function() { notesoup.ui.getTemplateList(); }
			}, 
			new Ext.Toolbar.Separator(),
			new Ext.Toolbar.Button({
				cls:"x-btn-text-icon",
				icon: notesoup.imageHost + 'images/famfamfam.com/folder.png',
				tooltip: {text:'click to manage your folders', title:'Folder Menu'},
				menu: this.folderMenu
			}),
/*****
			new Ext.Toolbar.Separator(),
			{
				text: '&nbsp;&nbsp;&nbsp;&nbsp;',
				icon: notesoup.imageHost + 'images/notesoup-avatoon-black.png',
				tooltip: {text:'click to deploy your avatar into this folder', title:'My Avatar'},
				handler: function() { 
					if (notesoup.avatarID) notesoup.removeAvatar();
					else {
						notesoup.say('Loading avatar...');
						notesoup.insertAvatar(); 
					}
				}
			}, 
*****/
			new Ext.Toolbar.Separator(),
			{
				text: '&nbsp;&nbsp;&nbsp;&nbsp;',
				icon: notesoup.imageHost + 'images/famfamfam.com/color_swatch.png',
				tooltip: {text:'click to select a color for new notes', title:'New Note Color'},
				menu: this.tbColorMenu
			},
			new Ext.Toolbar.Separator(),
			{
				text: '&nbsp;&nbsp;&nbsp;&nbsp;',
				icon: notesoup.imageHost + 'images/famfamfam.com/color_wheel.png',
				tooltip: {text:'click to select a color for new notes', title:'New Note Color'},
				handler: function() {
					notesoup.saveNote({
						notename: 'New Note Color',
						bgcolor: 'white',
						target: 'newnotes',
						imports: '/js-src/js-widgets/colorpicker.js'
					});
				}
			},
			new Ext.Toolbar.Separator(),
			new Ext.Toolbar.Spacer(),		// iPhone
			new Ext.Toolbar.Button({
				cls:"x-btn-text-icon",
				icon: notesoup.imageHost + 'images/famfamfam.com/accept.png',
				tooltip: {text:'create a note from the command bar, or execute the command', title:'Go'},
				handler: function() {
					notesoup.doCommand(notesoup.ui.commandbar.getValue());
				}
			}),
			new Ext.Toolbar.Spacer(),		// iPhone
			new Ext.Toolbar.Spacer(),		// iPhone
			'cmd:',
			this.commandbar,
			new Ext.Toolbar.Spacer(),
			new Ext.Toolbar.Separator(),
			
			'filter:',
			this.filterbar,
			new Ext.Toolbar.Spacer(),

			//new Ext.Toolbar.Separator(),
			//new Ext.Toolbar.Button({
			//	text: 'rss',
			//	tooltip: {text:'click here to go to the RSS feed for this folder', title:'RSS Feed'},
			//	handler: function() {document.location = '/rss/' + notesoup.foldername;}
			//}),

			new Ext.Toolbar.Separator(),
			new Ext.Toolbar.Button({
				text: 'help',
				tooltip: {text:'click here to go to the help folder', title:'HELP!'},
				handler: function() {notesoup.openFolder('system/help');}
			}),

			new Ext.Toolbar.Separator(),
			new Ext.Toolbar.Button({
				text: 'about',
				tooltip: {text:'what is this thing?', title:'About Note Soup'},
				handler: function() {notesoup.openFolder('system/about');}
			}),

			new Ext.Toolbar.Separator(),
			new Ext.Toolbar.Button({
				text: 'legal',
				tooltip: {text:'things the legal eagles would have you know', title:'Legal Stuff'},
				handler: function() {notesoup.openFolder('system/legal');}
			}),

			new Ext.Toolbar.Separator(),
			new Ext.Toolbar.Button({
				text: notesoup.loggedin ? 'logout ' + notesoup.username : 'login',
				tooltip: notesoup.loggedin ? {text:'end your session', title:'Log Out'}
										   : {text:'log in', title:'Log In'},
				handler: function() {
					if (notesoup.loggedin) notesoup.logout();
					else notesoup.login();
				}
			}),
			
			new Ext.Toolbar.Separator(),
			new Ext.Toolbar.Button({
				text: 'new account',
				tooltip: {text:'create a new user account', title:'Create User'},
				handler: function() {notesoup.createUser();}
			}),

			new Ext.Toolbar.Separator(),
			new Ext.Toolbar.Button({
				//text: 'get soup',
				text: '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;',
				cls:"x-btn-text-icon",
				icon: notesoup.imageHost + 'images/getnotesoup.png',
				tooltip: {text:'visit the welcome page to sign up for an account', title:'Get Soup'},
				handler: function() {notesoup.openFolder('system/welcome');}
			})
		);
		new Ext.dd.DD('toolbar');	// make the toolbar draggable

		this.commandbarEl = this.commandbar.getEl();
		this.commandbarEl.on('keyup', this.commandBarWatcher);
		this.commandbar.focus();

		this.filterbarEl = this.filterbar.getEl();
		this.filterbarEl.on('keyup', this.filterBarWatcher);

		//Ext.dd.DragDropMgr.mode = 1;	// set INTERSECT mode for dd (breaks Ext.tree DD)
		//notesoup.ui.defaultNoteColor = '#FFFF99';
		notesoup.ui.defaultEffectsDuration = 0.3;

		//notesoup.ui.getRunScriptsCookie();
		//notesoup.marquee.push('Type here and press Enter to create a note..........');
		this.commandbar.setValue('');

		this.noteTemplate = new Ext.Template(this.noteTemplateSource);
		// =this.noteTemplate = this.rawnoteTemplate
		this.rawnoteTemplate = new Ext.Template(this.rawnoteTemplateSource);
		this.imageTemplate = new Ext.Template(this.imageTemplateSource);

		this.loadingText = Ext.UpdateManager.defaults.indicatorText;

	},


	/**
	*	Return the note which putatively contains elt.
	*	@param {object} elt the element from which to start the upward search.



	*/
	getEnclosingNote: function(elt) {
		var e = Ext.get(elt);
		if (!e) {
			notesoup.say('oops gen 1');
			return null;
		}
		var note = e.findParentNode('div.note');
		if (note) {
			if (note.id in notesoup.notes) {
				if (notesoup.debugmode) notesoup.say('$gn: ' + note.id);
				return notesoup.notes[note.id];
			}
			else {
				notesoup.say('oops gen not found');
				return null;
			}
		}
		notesoup.say('oops gen no parent');
		return null;
	},
	
	getEnclosingNote2: function(ielt) {
		notesoup.say('gen0: ' + ielt.id);
		elt = Ext.get(ielt);
		while (elt && (elt.dom != document.body)) {
			notesoup.say('gen: ' + elt.id);
			if (elt.hasClass('note')) {
				if (elt.id in notesoup.notes) {
					var name = notesoup.notes[elt.id].notename || 'untitled';
					//notesoup.say('Enclosing note is: ' + elt.id + ' ' + name);
					return notesoup.notes[elt.id];
				}
				else {
					notesoup.say('Enclosing note not registered in notesoup.notes: ' + elt.id, 'error');
				}
			}
			elt = Ext.get(elt.dom.parentNode);
		}
		notesoup.say('oops: cannot get enclosing note', 'error');
		return null;
	},


	getEnclosingNote4: function(elt) {
		var count = 20;
		while ((elt != document.body) && (--count > 0)) {
			notesoup.say('$gn: ' + (elt.id || 'no.id'));
			elt = elt.parentNode;
		}
	},


	/**
	*	Worker to peel off a trailing string from a string:  
	*	given a window handle (which has '-rzwrap' or some such on the end), compute the associated noteid by trimming off the end
	*	@param {string} id the string to fix
	*	@param {string} tagstring the trailing string to be pruned
	*/
	trimTrailingString: function(id, tagstring) {
		var index = id.lastIndexOf(tagstring);
		if (index < 0) return id;				// tag not on this one
		if (index == (id.length - tagstring.length)) {
			id = id.substring(0, id.length - tagstring.length);
		}
		return(id);
	},

	/** The suffix used by extjs on divs that auto-wrap the note. */
	divSuffix: '-rzwrap',

	/** The suffix used in our templates to specify the note content div. */
	contentSuffix: '_content',


	/**
	*	Return the global target note set by the menu system.
	*/
	getTargetNote: function() {
		return notesoup.notes[notesoup.targetNote];
	},


	/**
	*	Compute the noteid associated with an outer wrapping div element identifier.
	*/
	getNoteIDFromWindowID: function(id) {
		return(this.trimTrailingString(id, this.divSuffix));
	},
	

	/**
	*	Have we created this one in the DOM already?
	*	@param {object} thenote the note in question.
	*/
	existsDOMNote: function(thenote) {
		//return($(thenote.id + this.divSuffix));
		return($(thenote.id));
	},


	/**
	*	Create the DOM representation of the note.  Done once, the first time we see a note.  Content is rendendered later, in soupnote.onrender.
	*	@param {object} note the note in question.
	*/
	createDOMNote: function(thenote) {

		if (notesoup.debugmode) notesoup.debug('createDOMnote ' + thenote.id + ' ' + thenote.zIndex);

		var item = document.createElement('div');
		item.setAttribute('id', thenote.id);
		item.className = 'note';
		item.style.left = 0;
		item.style.top = 0;

		var draggable = true;
		if ('draggable' in thenote) draggable = thenote.draggable;
		
		if (thenote.homediv) {
			draggable = false;
			if ($(thenote.homediv)) $(thenote.homediv).appendChild(item);
			else {
				notesoup.say('Create note: could not find homediv.', 'error');
				//document.body.appendChild(item);
				return;
			}
		}
		else document.body.appendChild(item);

		var custom = new Ext.Resizable(thenote.id, {
			wrap:true,
			pinned:false,
			id: thenote.id + '_extresizer',
			width: thenote.width,
			height:thenote.height,
			minWidth:20,
			minHeight: 20,
			preserveRatio: false,
			handles: 'e',
			draggable:draggable,
			widthIncrement: 10,
			heightIncrement: 10,
			dynamic:true		// dynamic OR animate
		});
		thenote.setEphemeral('extResizer', custom);
	
		var customEl = custom.getEl();
		if (!thenote.isGuest)
			thenote.flash('#ffff00');		// yelo helo

		//Ext.get(thenote.id).events['contextmenu'] = true;
		//Ext.get(thenote.id + notesoup.ui.divSuffix).on('contextmenu', function(e) { 
		//	notesoup.say('note contextmenu id= ' + e.target.id);
		//	e.stopEvent();
		//	notesoup.ui.noteMenu.showAt(e.getXY());
		//});

		//customEl.on('dblclick', function(e) {
		//	var thenote = notesoup.notes[notesoup.ui.getNoteIDFromWindowID(this.id)];
		//	thenote.toFront();
		//	thenote.setRenderFunc(e.shiftKey ? soupnote.prototype.plaintexteditor : soupnote.prototype.htmleditor);
		//	return true;
		//});
		
		//customEl.on('click', function(e) {
		//	var thenote = notesoup.notes[notesoup.ui.getNoteIDFromWindowID(this.id)];
		//	thenote.toFront();
		//	notesoup.say('click! ' + thenote.id);
		//	return true;
		//});
	
		custom.on('resize', function(theElt, newWidth, newHeight, event) {
			//alert('resize: ' + id + ' ' + newWidth + ' ' + newHeight);
			var thenote = notesoup.notes[notesoup.ui.getNoteIDFromWindowID(this.getEl().id)];
			thenote.width = newWidth;
			thenote.height = newHeight;
			if (!thenote.editing) thenote.save();
			//thenote.think('' + newWidth + ',' + newHeight);
			//thenote.show();
		});
	
		custom.on('beforeresize', function(theElt, event) {
			var thenote = notesoup.notes[notesoup.ui.getNoteIDFromWindowID(this.getEl().id)];
			thenote.toFront();
			return true;
		});

		if (draggable) {

			custom.dd.b4StartDrag = function(e) {
				var thenote = notesoup.notes[notesoup.ui.getNoteIDFromWindowID(this._domRef.id)];
				thenote.toFront();

				// a note can declare itself not-draggable
				if ((('draggable' in thenote) && (!thenote['draggable'])) ||
					(('editing' in thenote) && (thenote['editing']))) {
					//notesoup.say('This note cannot be dragged.');
					//this.lock();
					return false;
				}
				
				// call onbeforedrag handler in the note
				if (typeof(thenote.onbeforedrag) == 'function') {
					if (!thenote.onbeforedrag(e)) return false;
				}

				notesoup.drag = {
					id: thenote.id,
					start: new Date().getTime(),
					x: this.initPageX,
					y: this.initPageY
				};
				return true;
			};
	
			//custom.dd.addToGroup('TreeDD');
	
			custom.dd.onDrag = function(e) {
				var thenote = notesoup.notes[notesoup.ui.getNoteIDFromWindowID(this._domRef.id)];

				// a note can declare itself not-draggable
				if ((('draggable' in thenote) && (!thenote['draggable'])) ||
					(('editing' in thenote) && (thenote['editing']))) {
					//notesoup.say('This note cannot be dragged..');
					return false;
				}

				// live multi-user drag with incremental field-level update
				var outerDiv = Ext.get(thenote.id + notesoup.ui.divSuffix);
				var newLeft = parseInt(outerDiv.getLeft());
				var newTop = parseInt(outerDiv.getTop());
				thenote.xPos = newLeft;
				thenote.yPos = newTop;
				thenote.mtime = notesoup.getServerTime();
				notesoup.postEvent('/folder/' + notesoup.foldername, 'updatenote', {
					id: thenote.id,
					xPos: newLeft,
					yPos: newTop,
					zIndex: thenote.zIndex,
					mtime: thenote.mtime
				});
				//notesoup.postEvent('/folder/' + notesoup.foldername, 'say', 'Dragging ' + thenote.id);
	
				var d = notesoup.drag;
				if (d) {
					d.end = new Date().getTime();
					d.deltat = notesoup.drag.end - notesoup.drag.start;
					d.deltax = this.lastPageX - d.x; d.x = this.lastPageX;
					d.deltay = this.lastPageY - d.y; d.y = this.lastPageY;
					d.dbar = Math.sqrt((d.deltax * d.deltax) + (d.deltay * d.deltay));
					d.velocity = d.dbar / (d.deltat/1000.0);
					//$('commandbar').value = 'drag: ' + d.velocity;
				}	
				return true;
			};
	
	
			custom.dd.onDragDrop = function(e, thedd) {
				//e.stopEvent();
				var thenote = notesoup.notes[notesoup.ui.getNoteIDFromWindowID(this.getEl().id)];
				var outerDiv = Ext.get(thenote.id + notesoup.ui.divSuffix);
	
				var droptarget = (typeof(thedd) == 'string') ? thedd : thedd[0].handleElId + '***';
				//notesoup.say('Valid drop: Dropping ' + thenote.id + ' on ' + droptarget + (e.shiftKey ? ' Shift' : ''));
	
				var newLeft = parseInt(outerDiv.getLeft());
				var newTop = parseInt(outerDiv.getTop());
				//alert('Drop: '+ noteid + ' ' + newLeft + ' ' + newTop);
				thenote.xPos = newLeft;
				thenote.yPos = newTop;
	
				var d = notesoup.drag;
				if (d && e.shiftKey && d.velocity > 20) {
					if (d.velocity > 300) d.velocity = 300;
					var dx = d.velocity * (d.deltax / d.dbar);
					var dy = d.velocity * (d.deltay / d.dbar);
					thenote.xPos = Math.max(0, newLeft + dx);
					thenote.yPos = Math.max(0, newTop + dy);
					outerDiv.moveTo(thenote.xPos, thenote.yPos, {duration: notesoup.ui.defaultEffectsDuration});
				}
				thenote.save();
				//thenote.think('' + thenote.xPos + ',' + thenote.yPos);
				if (notesoup.summonAvatar) notesoup.summonAvatar(thenote);
				//notesoup.ui.commandbar.focus();
			};
	
			custom.dd.onInvalidDrop = function(e, thedd) {
				var thenote = notesoup.notes[notesoup.ui.getNoteIDFromWindowID(this.getEl().id)];
				var outerDiv = Ext.get(thenote.id + notesoup.ui.divSuffix);
	
				var droptarget = null;
				//notesoup.say('Dropping ' + thenote.id + ' on ' + droptarget);
	
				var newLeft = parseInt(outerDiv.getLeft());
				var newTop = parseInt(outerDiv.getTop());
				//alert('Drop: '+ noteid + ' ' + newLeft + ' ' + newTop);
				thenote.xPos = newLeft;
				thenote.yPos = newTop;
	
				var d = notesoup.drag;
				if (d && d.velocity > 20) {
					if (d.velocity > 300) d.velocity = 300;
					var dx = d.velocity * (d.deltax / d.dbar);
					var dy = d.velocity * (d.deltay / d.dbar);
					thenote.xPos = Math.max(0, newLeft + dx);
					thenote.yPos = Math.max(0, newTop + dy);
					outerDiv.moveTo(thenote.xPos, thenote.yPos, notesoup.ui.defaultEffectsDuration);
				}
				thenote.save();
				if (notesoup.summonAvatar) notesoup.summonAvatar(thenote);
				//notesoup.ui.commandbar.focus();
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
		}
		//this.updateDOMNote(thenote);
	},


	/** The template for rendering a normal note. */
	noteTemplateSource: [
		'<div class="x-box-tl"><div class="x-box-tr">',
		'<div class="x-box-tc"></div>',
		'</div></div>',
		'<div class="x-box-ml"><div class="x-box-mr"><div class="x-box-mc">',
			'<div id="{id}_title" class="notetitle">{notename}',
				'<img id="{id}_menu"',
				' src="', 
				notesoup.imageHost, 
				'images/famfamfam.com/bullet_arrow_down.png"',
				' style="display:none;float:right;cursor:pointer"/>',
			'</div>',
			'<div class="notebody" id="{id}_content" ',
			'style="background:{displaybg}">{displayText}</div>',
		'</div></div></div>',
		'<div class="x-box-bl"><div class="x-box-br" id="{id}_br"><div class="x-box-bc"></div></div></div>'
	],

	/** An experimental template to render a note with less frame. */
	rawnoteTemplateSource: [
		//'<div class="x-box-tl"><div class="x-box-tr">',
		//'<div class="x-box-tc"></div>',
		//'</div></div>',
		//'<div class="x-box-ml"><div class="x-box-mr"><div class="x-box-mc">',
			'<div style="border: 1px solid gray;">',
				'<div id="{id}_title" class="notetitle">{notename}',
					'<img id="{id}_menu"',
				' src="', 
					notesoup.imageHost , 
					'images/famfamfam.com/bullet_arrow_down.png"',
					' style="float:right;cursor:pointer"/>',
				'</div>',
				'<div class="notebody" id="{id}_content" ',
				'style="background:{displaybg}">{displayText}</div>',
			'</div>',
		//'</div></div></div>',
		//...'<div class="x-box-bl"><div class="x-box-br" id="{id}_br"><div class="x-box-bc"></div></div></div>'
		'<div class="x-box-br" id="{id}_br"></div>'
	],

	/** An experimental template to render an image with no frame. */
	imageTemplateSource: [
		//'<div class="x-box-tl"><div class="x-box-tr">',
		//'<div class="x-box-tc"></div>',
		//'</div></div>',
		//'<div class="x-box-ml"><div class="x-box-mr"><div class="x-box-mc">',
			'<div style="border: 1px solid gray">',
				//'<div id="{id}_title" class="notetitle">{notename}',
				//	'<img id="{id}_menu"',
				//' src="', 
				//	notesoup.imageHost , 
				//	'images/famfamfam.com/bullet_arrow_downnnyy.png"',
				//	' style="float:right;cursor:pointer"/>',
				//'</div>',
				'<div class="notebody" id="{id}_content" ',
				'style="background:{displaybg}"',
				'>{displayText}</div>',
			'</div>',
		//'</div></div></div>',
		//...'<div class="x-box-bl"><div class="x-box-br" id="{id}_br"><div class="x-box-bc"></div></div></div>'
		'<div class="x-box-br" id="{id}_br"></div>'
	],


	/** Synchronize the height of all notes to their content. */
	syncAll: function() {
		for (var n in notesoup.notes) notesoup.notes[n].syncDivs();
	},

	/** Return the topmost note's zIndex */
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

	/** 
	*	Remove a note's representation from the DOM.  This is normally only called during sync to remove deleted notes.
	*	Not to be confused with deleteNote and destroyNote, which are probably what you want.
	*/
	deleteDOMNote: function(thenote) {
		var theElt = Ext.get(thenote.id + this.divSuffix);
		if (theElt) {
			if (!thenote.isGuest) thenote.flash('#808080');
			theElt.fadeOut({remove: true, duration: notesoup.ui.defaultEffectsDuration});
			//$('notezone').removeChild(Ext.getDom(thenote.id + this.divSuffix));
		}
	},



	/**
	*	Arrange the notes in the workspace view.  Options are "tile", "cascade", and "random".  The 'biasattr' can be used to force certain notes to the top.
	*	@param	{string} method the arranging method: tile, cascade, random
	*	@param	{string} biasattr optional attribute to use to sort notes to the top.  Default value is 'yPos'.
	*/
	arrangeNotes : function(method, biasattr) {

		biasattr = biasattr ? biasattr :'yPos';
		var x = 12;
		var y = 36;
		var z = 1;
		var xinc = 12;
		var yinc = 60;
		var tight = false;

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

			case 'stack':
				var notelist = notesoup.getNotesOrderedBy(biasattr, true, 'id');
				for (var i=0; i<notelist.length; i++) {
					notesoup.notes[notelist[i]].set({'xPos':x, 'yPos':y, 'zIndex':z, 'showme':true, 'syncme':true});
					z += 1;
				}
				break;
	
			case 'tight':
				tight = true;	// and fall through
				// fall thru
	
			case 'tile':
				var maxy = 0;

				var notelist = notesoup.getNotesOrderedBy(biasattr, true, 'id');
				for (var i=0; i<notelist.length; i++) {
					n = notelist[i];

					// Would this note extend offscreen to the right?
					//notesoup.say('tiling note ' + n);
					var w = 'width' in notesoup.notes[n] ? notesoup.notes[n].width : 100;
					if (typeof(w) == 'string') w = parseInt(w);
	
					if ((x + w) > pagesize.windowWidth) {
						x = xinc;
						if (tight) y += yinc;
						else y = (maxy + yinc);
					}
	
					notesoup.notes[n].set({xPos:x, yPos:y, zIndex:z++, showme:true, syncme: true});

					var h = notesoup.notes[n].height;
					if (typeof(h) == 'string') alert('oops tile');	//	h = parseInt(h);
					//var h = Ext.get($(n + '-rzwrap')).getHeight();

					if ((y + h) > maxy) maxy = y + h;
					x += (w + xinc);
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


	/**
	*	Return true if the file seems to be an image.
	*	@param {string} filename the file to take a flying guess at.
	*/
	isImageFile: function(filename) {

		if (filename == undefined) return false;

		// handle data: urls too
		if (filename.substr(0, 5)  == 'data:') return true;

		var imageExtensions = ['.png$','.jpg$','.gif$','.tif$','.jpeg$','.tiff$'];
		for (var i = 0; i < imageExtensions.length; i++) {
			var t = new RegExp(imageExtensions[i]);
			if (t.test(filename.toLowerCase())) return true;
		}


		return false;
	},

	/**
	*	Return true if the file seems to be an MP3.
	*	@param {string} filename the file to take a flying guess at.
	*/
	isMP3File: function(filename) {

		if (filename == undefined) return false;

		var audioExtensions = ['.mp3$'];
		for (var i = 0; i < audioExtensions.length; i++) {
			var t = new RegExp(audioExtensions[i]);
			if (t.test(filename.toLowerCase())) return true;
		}
		return false;
	},





	/**
	*	See if we have a runScripts cookie and honor it if so
	*/
	getRunScriptsCookie: function() {
		// MISO: not in miso.  there's no button to reset it.
		notesoup.runScripts = true;
		return;
	},

	/**
	*	Set the runScripts cookie.  The value 'disable' turns off scripts.  All other values including cookie-not-present enable scripts.
	*/
	setRunScriptsCookie: function(newsetting) {
		throw "up";
	}
};


/** Growl-like Notification window stack */
notesoup.notificationCount = 0;
notesoup.notificationLife = 5000;	// ms the message stays visible


/**
*	Freeze a notification when it's clicked.
*/
notesoup.ui.onClickNotification = function(e) {
	var item = Ext.get(e.target);
	if (item.dom.tagName == 'IMG') item = Ext.get(item.dom.parentNode);

	//notesoup.say('item clicked ' + item.id);
	if (item.dom.className.indexOf('frozen') < 0) {
		item.addClass('frozen');
	}
	else {
		var thediv = $('notificationwindow');
		if (thediv) thediv.removeChild(item.dom);
	}
};


/**
*	Remove an expired notification.
*/
notesoup.ui.onNotificationTimeout = function(id) {
	var div = $(id);
	if (div) {
		if (div.className.indexOf('frozen') < 0) { 
			var thediv = $('notificationwindow');
			if (thediv) thediv.removeChild(div);
		}
	}
};


/**
*	Display a notification.
*	@param {string} s the string to display
*	@param {string} level optional urgency level: whisper, tell, warning, error
*/
notesoup.say = function(s, level) {

	level = level || 'info';

	// Set the status bar display	
	if (level == 'whisper') {
		window.status = s;
		return;
	}

	// create the div with id/class
	var item = document.createElement("div");
	var id = 'notification' + notesoup.notificationCount++;
	item.setAttribute('id', id);
	item.className = 'notificationitem';
	//item.innerHTML = "<img src='images/famfamfam.com/bullet_black.png'/>" + s;

	switch (level) {
		case 'warning':	item.style.background = '#ffff00'; break;
		case 'error': 	item.style.background = '#ff0000'; break;
		case 'tell':	item.style.background = '#aaaaff'; 
						s = '<img src="' + notesoup.imageHost + 'images/famfamfam.com/cancel.png" />&nbsp;' + s;
						item.className = 'notificationitem frozen';
						break;
		default: break;	// catch 'info' case here; post the naked string without markup
	}
	item.innerHTML = s;

	var thediv = $('notificationwindow');
	if (!thediv) return;
	thediv.appendChild(item);

	Ext.get(item).on('click', function(e) {
		notesoup.ui.onClickNotification(e);
	});

	// schedule its demise
	window.setTimeout('notesoup.ui.onNotificationTimeout("' + id + '");', notesoup.notificationLife);
};


/**
*	sigh.
*/
function $(element) {
  if (typeof element == 'string')
    element = document.getElementById(element);
  return element;
}


/**
*	Experimental grid view of the folder.
*/
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
		{header: "Title", dataIndex: 'notename', width: 100, sortable: true,
           editor: new Ext.grid.GridEditor(new Ext.form.TextField({
               allowBlank: false
           }))
		},
		{header: "ID / Filename", dataIndex: 'id', width: 100, sortable: true},
		{header: "Color", dataIndex: 'bgcolor', width: 75, sortable: true},
		{header: "xPos", dataIndex: 'xPos', width: 50, sortable: true},
		{header: "yPos", dataIndex: 'yPos', width: 50, sortable: true},
		{header: "zIndex", dataIndex: 'zIndex', width: 100, sortable: true,
			editor: new Ext.grid.GridEditor(new Ext.form.NumberField({
				allowBlank: false,
				allowNegative: false,
				maxValue: 10
			}))
		},
		{header: "width", dataIndex: 'width', width: 100, sortable: true},
		{header: "height", dataIndex: 'height', width: 100, sortable: true},
		{header: "text", dataIndex: 'text', width: 200, sortable: true, multiline: true},
		{header: "proxyfor", dataIndex: 'proxyfor', width: 100, sortable: true},
		{header: "editing", dataIndex: 'editing', width: 10, sortable: true},
		{header: "syncme", dataIndex: 'syncme', width: 10, sortable: true},
		{header: "showme", dataIndex: 'showme', width: 10, sortable: true}
	]);

	var gridView = new Ext.FormPanel({
		bodyStyle: 'background:' + (this.bgcolor || notesoup.ui.defaultNoteColor),
		border: false,
		bodyBorder: false,
		items: [{
			xtype: 'editorgrid',	 
			ds: ds,
			cm: cm,
			minColumnWidth: 15,
			autoSizeColumns: true,
			autoSizeHeaders: true,
			enableColumnMove: true, 
			stripeRows: true,
			enableColLock:false
		}]
    });
    gridView.render('notegrid');

	 $('notegrid').style.zIndex = 65535;
	 $('notegrid').style.opacity = 0.9;
	 $('notegrid').style.background = '#f8f8ff';
};


/**
*	Create a note containing a folder invitation.
*	@params {string} folder the folder for the invitation.
*/
notesoup.ui.createDoor = function(folder) {
	if (!folder) {
		folder = prompt("Create Door to another folder: Enter destination user/folder:", notesoup.foldername);
		if (!folder) return;
	}
	var thenote = {
		notename: notesoup.ui.pluckName(folder),
		notetype: 'proxy',
		proxyfor: '/folder/' + folder,
		width: 80,
		noframe: true
	};
	notesoup.saveNote(thenote);
};


/*****
	var thenote = {
		notename: notesoup.ui.pluckName(folder),
		notetype: 'proxy',
		proxyfor: notesoup.imageHost + 'images/UII_Icons/80x80/exit.png',
		width: 80,
		text: invitetext,
		noframe: true,
		template: [
			"<div style='background:{bgcolor}'><center>",
				"<img src='{proxyfor}' onclick='notesoup.openFolder(\"", folder, "\");'/><br/>",
				"{notename}<br/>",
				"<div id='", this.avatarID, '_content', "'></div>",
			"</center></div>"
		].join(''),
	};
	notesoup.saveNote(thenote);

	var thenote = {
		'notename': notesoup.ui.pluckName(folder),
		'bgcolor': '#fefefe',
		'width': 120,
		'text': ['<br/><a href="/folder/', folder, '">',
				'<center>',
				'<img src="' + notesoup.imageHost + 'images/UII_Icons/80x80/exit.png"/>',
				'</center></a>',
				invitetext ? '<hr/>' + invitetext : '',
			].join('')
	};
	notesoup.saveNote(thenote);
*****/


/**
*	Keystroke handler for the filter bar.
*/
notesoup.ui.filterBarWatcher = function(event) {
	//if (event.keyCode == 13) 
	notesoup.ui.filterNotes(notesoup.ui.filterbar.getValue());
};


/**
*	Filter the notes to highlight notes matching the filterstring.
*	@param {string} filterstring the string to filter for.
*/
notesoup.ui.filterNotes = function(filterstring) {

	var reg = new RegExp(filterstring, 'i');
	var shouldShow = (filterstring.length > 0) ?
		function(thenote) {
			return (reg.test(thenote.text) || reg.test(thenote.notename) || reg.test(thenote.toJSON()));
		} : 
		function(thenote) { return true; };

	for (var n in notesoup.notes) {
		var thenote = notesoup.notes[n];
		var elt = Ext.get(n + notesoup.ui.divSuffix);

		//notesoup.say('filtering: [' + filterstring + '] ' + thenote.id + ' ' + shouldShow(thenote));

		if (shouldShow(thenote)) {
			elt.setOpacity(('opacity' in thenote) ? thenote.opacity : 1.0);
			elt.setStyle('zIndex', thenote.zIndex);
		}
		else {
			//elt.setStyle('opacity', 0.2);
			elt.setOpacity(0.2);
			elt.setStyle('zIndex', 0);
		}
	}
};


/**
*	Produce a textual summary report for the current folder 
*	suitable for copy-paste into a text processing application.
*/
notesoup.ui.exportFolder = function() {
	delete notesoup.stdout;
	notesoup.print(['<p/>',
		'<h1>Folder Export Output for ' + notesoup.foldername + '</h1>',
		'',
		'<h2>Select All and Copy to Paste into another application.</h2>',
		'==='].join(''));
	var notelist = notesoup.getNotesOrderedBy('yPos');
	for (var i=0; i < notelist.length; i++) {
		var thenote = notesoup.notes[notelist[i]];
		if (('notename' in thenote) && (thenote.notename.length > 0))
			notesoup.print('<h2>' + thenote.notename + '</h2>');
		if (('text' in thenote)  && (thenote.text.length > 0))
			notesoup.print(thenote.text);
		if (('proxyfor' in thenote) && (thenote.proxyfor.length > 0))
			notesoup.print('url: ' + thenote.proxyfor);
		notesoup.print('===');
	}
};



/**
*	Produce a textual summary report for the current folder 
*	suitable for copy-paste into a text processing application.
*/
notesoup.ui.createFolderDigest = function() {
	var o = [];
	o.push('<p/>',
		'<h1>Folder Digest for ', notesoup.foldername, ' at ', '' + new Date(), '</h1>',
		'<hr/>');
	var notelist = notesoup.getNotesOrderedBy('yPos', true);
	for (var i=0; i < notelist.length; i++) {
		var thenote = notesoup.notes[notelist[i]];
		o.push('<div style="background:', thenote.bgcolor || '#909090', '">');
		if (('notename' in thenote) && (thenote.notename))
			o.push('<h2>', thenote.notename, '</h2>');
		o.push(thenote.getContentDiv().innerHTML);
		o.push('<hr/>');
		o.push('</div>');
	}
	notesoup.saveNote({
		notename: 'Folder Digest', 
		text: o.join(''),
		bgcolor: '#99ccff',
		width: 450
	}, notesoup.foldername);
};


/**
*	Return a random color from the built-in color palette
*/
notesoup.ui.getRandomColor = function() {
	var c = notesoup.ui.backgroundColorMenu.palette.colors;
	return '#' + c[Math.floor(Math.random() * c.length)];
};


notesoup.getjson = function(stripfields) {
	var notelist = [];
	for (var n in notesoup.notes) {
		var note = notesoup.notes[n].cleanNote();	// removes id, zIndex, mtime
		for (var f in stripfields) delete note[f];
		//if (striptext) delete note.text;
		delete note.feedstr;
		delete note.feeddata;
		notelist.push(note);
	}
	notesoup.print(notesoup.dump(notelist));
	return notelist;
};

/**
*	Return a portable hole containing the contents of the folder,
*	with a nice index page.
*/
notesoup.ui.createFolderBackup = function() {
	var notelist = [];
	for (var n in notesoup.notes) {
		notelist.push(notesoup.notes[n].cleanNote());
	}
	notesoup.print(notesoup.dump(notelist));
	var newnote = {
		notename: 'backup of ' + notesoup.foldername,
		text: '<center>' + new Date() + '<br/>' +
			"<input type='submit' value='click to restore' onclick='notesoup.ui.getEnclosingNote(this).calleventhandler(\"restore\");'/>" +
			'</center>',
		notelist: notelist,
		restore: '{notesoup.saveNoteList(this.notelist);}',
		bgcolor: '#8080f0'
	};
	notesoup.saveNote(newnote, notesoup.foldername);
};
