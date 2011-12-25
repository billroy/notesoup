<script type='text/javascript'>
/**
*	folderacl.js - Note Soup folder permissions UI
*
*	Copyright 2007, 2008 Bill Roy
*	This file is licensed under the Note Soup Client License
*	See http://notesoup.net/js/LICENSE
*/
note.set({
	notename: 'Folder Access Control',
	//bgcolor: '#99ccff',

	init: function() {
		this.show();
		this.refresh();
	},

	getdata: function(key) {
		if ('folderacl' in notesoup) return notesoup.folderacl[key];
		return '';
	},

	onrender: function() {
	
		if (!notesoup.isowner) {
			this.setContentDiv([
				'<center><br/>',
				'Sorry, only the folder owner has permission to change access rights here.<br/>',
				'<br/>',
				'</center>'
			].join(''));
			return;
		}
	
		var folderACLForm = new Ext.FormPanel({
			labelWidth: 70,
			minButtonWidth: 50 ,
			bodyStyle: 'background:' + (this.bgcolor || notesoup.ui.defaultNoteColor),
			border: false,
			bodyBorder: false,
			items: [{
				xtype: 'textfield',
				fieldLabel: 'Folder',
				id: this.getFieldID('folder'),
				name: 'folder',
				value: this.getdata('folder'),
				width: this.width - 36 - 76
			},{
				xtype: 'textarea',
				fieldLabel: 'Read',
				id: this.getFieldID('readers'),
				name: 'readers',
				value: this.getdata('readers'),
				width: this.width - 36 - 76
			},{
				xtype: 'textarea',
				fieldLabel: 'Write',
				id: this.getFieldID('editors'),
				name: 'editors',
				value: this.getdata('editors'),
				width: this.width - 36 - 76
			},{
				xtype: 'textarea',
				fieldLabel: 'Append',
				id: this.getFieldID('senders'),
				name: 'senders',
				value: this.getdata('senders'),
				width: this.width - 36 - 76
			}],
			buttons: [{
				text: 'save',
				handler: this.saveACL,
				scope: this
			},{
				text: 'refresh',
				handler: this.refresh,
				scope: this
			},{
				text: 'done',
				handler: this.destroy,
				scope: this
			}]
		});

		this.setContentDiv('<br/>');
		folderACLForm.render(this.getContentDiv());
		this.setEphemeral('folderACLForm', folderACLForm);
		//this.onrender = this.renderform;
		return folderACLForm;
	},

	saveACL: function() {
		notesoup.setFolderACL(this.getField('folderACLForm', 'folder'), {
			'senders': this.getField('folderACLForm', 'senders'),
			'readers': this.getField('folderACLForm', 'readers'),
			'editors': this.getField('folderACLForm', 'editors')
		});
	},

	updateValues: function() {
		this.setField('folderACLForm', 'folder', notesoup.folderacl.folder);
		this.setField('folderACLForm', 'senders', notesoup.folderacl.senders);
		this.setField('folderACLForm', 'readers', notesoup.folderacl.readers);
		this.setField('folderACLForm', 'editors', notesoup.folderacl.editors);
	},
	
	refresh: function() {
		if (!notesoup.isowner) return;
		var folder = notesoup.foldername;
		var theForm = this.getEphemeral('folderACLForm');
		if (theForm) {
			var f = this.getField('folderACLForm', 'folder');
			if (f) folder = f;
		}
		notesoup.getFolderACL(folder, note.updateValues, notesoup.notes[note.id]);
	}
});
note.init();
</script>
Loading...