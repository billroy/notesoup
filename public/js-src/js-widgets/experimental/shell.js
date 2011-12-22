/**
*	shell.js - Note Soup shell access widget
*
*	Copyright 2007, 2008 Bill Roy
*	This file is licensed under the Note Soup Client License
*	See http://notesoup.net/js/LICENSE
*/
notesoup.shell = {

	init: function() {
		this.show();
	},

	sendit: function() {
		notesoup.postRequest({
			method:"shell",
			params:{
				shellcommand: this.getField('shellForm', 'cmd'),
				tofolder: notesoup.foldername,
				notifyfolder: notesoup.foldername
			}},{
			requestMessage: 'Sending shell command request...',
			successMessage: 'Command complete.',
			failureMessage: 'Could not execute shell command.'
		});
		this.setField('shellForm', 'cmd', '');
	},


	onrender: function() {

		var shellForm = new Ext.FormPanel({
			labelWidth: 75,
			labelalign: 'top',
			width: this.width - 36,
			bodyStyle: 'background:' + (this.bgcolor || notesoup.ui.defaultNoteColor),
			border: false,
			bodyBorder: false,
			items: [{
				xtype: 'textfield',
				fieldLabel: 'Command',
				name: 'cmd',
				id: this.getFieldID('cmd'),
				width: this.width - 36 - 86
			}],
			buttons: [{
				text: 'Send',
				handler: this.sendit,
				scope: this
			},{
				text: 'Done',
				handler: this.destroy,
				scope: this
			}],
			keys: [{
				key: 13,
				fn: this.sendit,
				scope: this
			}]
		});

		this.setContentDiv('<br/>');
		shellForm.render(this.getContentDiv());
		this.setEphemeral('shellForm', shellForm);
	}
};
