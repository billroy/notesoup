/**
*	notesoup-ui-templatelist.js
*
*	Copyright 2007, 2008 Bill Roy
*	This file is licensed under the Note Soup Client License
*	See http://notesoup.net/js/LICENSE
*/
notesoup.ui.set({
	
	/**
	*	UI calls here to start the New Note from Template thing
	*/
	getTemplateList: function(x, y) {

		if (x || y)  {
			this.templatelistx = x;
			this.templatelisty = y;
		}

		// fetch the default template list
		if (this.templatelist) {
			this.updateTemplateListMenu(this.templatelist);
			return;
		}
		return this.fetchTemplateList();
	},
		
	fetchTemplateList: function() {
	
		notesoup.postRequest({
			method:"gettemplatelist",
			params:{}
		},{
			requestMessage: 'Fetching new note templates...',
			successProc:	notesoup.ui.getTemplateListHandler,
			successProcScope: notesoup.ui,
			//successMessage: 'Fetch complete.',
			failureMessage: 'Failed.'
		});
	},
	
	
	getTemplateListHandler: function(response, options) {
		var response = Ext.util.JSON.decode(response.responseText);
	
		if (response['error']) {
			notesoup.say('Could not fetch templates.', 'error');
			return;
		}
		else this.updateTemplateListMenu(response.command[0][1]);
	},

	
	/**
	*	Command loop calls back here once server replies with a template list.
	*/
	updateTemplateListMenu: function(thelist) {
		this.templatelist = thelist;
		this.newNoteMenu = new Ext.menu.Menu({id: 'newNoteMenu', allowOtherMenus: true});
		for (var i = 0; i < thelist.length; i++) {
			var templateitem = thelist[i];
			this.newNoteMenu.add({
				text: templateitem[2],
				templatefolder: templateitem[0],
				templatenote: templateitem[1],
				handler: function(menuitem) {
					//notesoup.sendNote(menuitem.templatenote, menuitem.templatefolder, notesoup.foldername, false);
					delete menuitem.templatenote.id;
					notesoup.saveNote(menuitem.templatenote, notesoup.foldername);
				},
				icon: notesoup.imageHost + (templateitem[0] == 'system/templates' ? 
					'images/famfamfam.com/page_white_star.png' : 'images/famfamfam.com/page_white_add.png')
			});		
		}
		//if (this.tb) {
		//	this.tb.items.get('newnotemenu').menu = this.newNoteMenu;
		//}
		this.newNoteMenu.showAt([this.templatelistx || 20, this.templatelisty || 20]);
	},
	
	createNoteFromTemplate: function(templatename) {
		if (!this.templatelist) {
			this.fetchTemplateList();
			return this.createNoteFromTemplate.defer(1000, this, [templatename]);
		}
		this.newNoteMenu.hide();
		for (var i=0; i < this.templatelist.length; i++) {
			t = this.templatelist[i];
			if (t[2] == templatename) {
				notesoup.sendNote(t[1], t[0], notesoup.foldername, false);
				return true;
			}
		}
		return false;
	}
});


notesoup.set({	
	/**
	*	Get all the notes in a folder.
	*/
	getNotes: function(fromfolder, handler, handlerScope) {
	
		if (!notesoup.foldercache) notesoup.foldercache = {};
	
		if (notesoup.foldercache[fromfolder]) {
			if (notesoup.foldercache[fromfolder].status == 'loading') return -1;
			if (notesoup.foldercache[fromfolder].status == 'error') return null;
			notesoup.foldercache[fromfolder].status = 'loading';
		} else {
			notesoup.foldercache[fromfolder] = {status: 'loading'};
		}
	
		notesoup.postRequest({
			method:"getnotes",
			params:{fromfolder: fromfolder || notesoup.foldername}
		},{
			//requestMessage: 'Fetching notes...',
			successProc:	handler || notesoup.getNotesHandler,
			successProcScope: handlerScope || notesoup,
			//successMessage: 'Fetch complete.',
			//failureMessage: 'Failed.',
			fromfolder: fromfolder
		});
		return -1;
	},
	
	
	getNotesHandler: function(response, options) {
		var r = Ext.util.JSON.decode(response.responseText);
	
		if (r['error']) {
			notesoup.say('Could not fetch notes.', 'error');
			notesoup.foldercache[options.fromfolder] = {status: 'error'};
			return;
		}
		var thenotes = r.command[0][1];
		//notesoup.say('Fetched notes from ' + options.fromfolder);
		notesoup.foldercache[options.fromfolder] = {
			status: 'ok',
			notes: r.command[0][1]
		};
		//for (var n in notesoup.foldercache[options.fromfolder].notes) {
		//	notesoup.say('Note: ' + notesoup.foldercache[options.fromfolder].notes[n].notename, 'tell');
		//}
		//alert(response.responseText);
	}
});
