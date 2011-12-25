<script type='text/javascript'>
/**
*	ssh.js - Note Soup ssh access widget
*
*	Copyright 2007, 2008 Bill Roy
*	This file is licensed under the Note Soup Client License
*	See http://notesoup.net/js/LICENSE
*/
note.set({

	init: function() {
		this.show();
	},

	sendit: function() {
		if (!this.getField('sshForm', 'password')) {
			notesoup.say('Please supply a password.', 'error');
			return;
		}

		notesoup.postRequest({
			method:"ssh",
			params:{
				connection: this.getField('sshForm', 'connection'),
				sshcommand: this.getField('sshForm', 'command'),
				password: this.getField('sshForm', 'password'),
				tofolder: notesoup.foldername,
				notifyfolder: notesoup.foldername
			}},{
			requestMessage: 'Sending ssh command...',
			successMessage: 'Command complete.',
			failureMessage: 'Could not execute ssh command.'
		});
		//this.setField('sshForm', 'command', '');
	},

	openshell: function() {
		document.location.href = 'ssh://' + this.getField('sshForm', 'connection');
	},

	clean: function() {
		// clear the workspace of command output
		for (var n in notesoup.notes) {
			if (n == this.id) continue;
			if (notesoup.notes[n].iscommandoutput) notesoup.deleteNote(n);
		}
		notesoup.openFolder.defer(2000, notesoup, [notesoup.foldername]);
	},
	
	saveform: function() {
		this.connection = this.getField('sshForm', 'connection');
		this.sshcommand = this.getField('sshForm', 'command');
		this.save();
	},


	onrender: function() {

		var sshForm = new Ext.FormPanel({
			labelWidth: 75,
			labelalign: 'top',
			width: this.width - 36,
			minButtonWidth: 35,
			bodyStyle: 'background:' + (this.bgcolor || notesoup.ui.defaultNoteColor),
			border: false,
			bodyBorder: false,
			items: [{
				xtype: 'textfield',
				fieldLabel: 'Connect to',
				name: 'connection',
				id: this.getFieldID('connection'),
				value: this.connection || '',
				width: this.width - 36 - 86
			},{
				xtype: 'textfield',
				fieldLabel: 'Password',
				name: 'password',
				id: this.getFieldID('password'),
				inputType: 'password',
				width: this.width - 36 - 86
			},{
				xtype: 'textfield',
				fieldLabel: 'Command',
				name: 'command',
				id: this.getFieldID('command'),
				value: this.sshcommand || '',
				width: this.width - 36 - 86
			}],
			buttons: [{
				text: 'Go',
				handler: this.sendit,
				scope: this
			},{
				text: 'Save',
				handler: this.saveform,
				scope: this
			},{
				text: 'Open',
				handler: this.openshell,
				scope: this
			},{
				text: 'Clean',
				handler: this.clean,
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
		sshForm.render(this.getContentDiv());
		this.setEphemeral('sshForm', sshForm);
	}
});
note.init();
</script>