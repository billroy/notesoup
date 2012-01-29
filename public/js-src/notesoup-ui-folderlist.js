/**
*	notesoup-ui-folderlist.js
*
*	Copyright 2007, 2008 Bill Roy
*	This file is licensed under the Note Soup Client License
*	See http://notesoup.net/js/LICENSE
*/
notesoup.ui.set({

	/**
	*	Return the last path part from folder.
	*/
	pluckName: function(folder) {
		var f = folder.split('/');
		return f[f.length-1];
	},


	/**
	*	Callback to handle folder list payload.
	*/
	updateFolderListMenu: function(thelist) {
		notesoup.folderlist = thelist;
		this.folderListMenu = new Ext.menu.Menu({id: 'folderListMenu'});
		for (var i = 0; i < thelist.length; i++) {
			var folder = thelist[i];
			this.folderListMenu.add({
				text: this.pluckName(folder),
				handler: function(item) {
					notesoup.ui.handleFolderListClick(item);
				},
				folderitem: folder,
				icon: notesoup.imageHost + 'images/famfamfam.com/folder.png'
			});		
		}
		if (this.folderMenu) {
			this.folderMenu.items.get('openfoldermenu').menu = this.folderListMenu;
			this.sendMenu.items.get('sendoriginalmenuitem').menu = this.folderListMenu;
			this.sendCopyMenu.items.get('sendcopymenuitem').menu = this.folderListMenu;
		}
	},


	/**
	*	Doggedly fetch the folder list.
	*/
	populateFolderList: function() {
		if (notesoup.loggedin && !notesoup.folderlist) {
			notesoup.getFolderList();
			window.setTimeout('notesoup.ui.populateFolderList();', 3000);
		}
	},


	/**
	*	Interpret folder list click as a command in the parent menu.
	*/
	handleFolderListClick: function(menuitem) {
		var menuid = menuitem.parentMenu.parentMenu.activeItem.id;
	
		switch (menuid) {
		
			case 'sendoriginalmenuitem':
				notesoup.sendNote(notesoup.ui.getTargetNote().id, 
					notesoup.foldername, menuitem.folderitem, true);
				break;
		
			case 'sendcopymenuitem':
				notesoup.sendNote(notesoup.ui.getTargetNote().id, 
					notesoup.foldername, menuitem.folderitem, false);
				break;
	
			case 'openfoldermenu':
				notesoup.openFolder(menuitem.folderitem);
				break;
			
			default:
				notesoup.say('oops folder list click: ' + menuid, 'error');
				break;
		}
	}
});

window.setTimeout('notesoup.ui.populateFolderList();', 2000);