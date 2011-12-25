<script type='text/javascript'>
/**
*	message.js - Note Soup message widget
*
*	Copyright 2007, 2008 Bill Roy
*	This file is licensed under the Note Soup Client License
*	See http://notesoup.net/js/LICENSE
*/
note.set({

	sendit: function() {
		if (!notesoup.loggedin) {
			notesoup.say('You must be logged in to do that.', 'error');
			return;
		}
		var tofolder = '';
		if (this.replyto) tofolder = this.replyto;
		else {
			var to = prompt('Send to:', '');
			if (!to) return;
			var parts = to.split('/');
			if (parts.length == 1) tofolder = to + '/inbox';
			else if (parts.length == 2) tofolder = to;
			else {
				notesoup.say('Address error.');
				return;
			}
		}

		// Build a message note to save in the destination		
		var thenote = this.cleanNote();
		delete thenote.zIndex;

		var msg = notesoup.username + ': ' + this.getField('messageForm', 'msg');

		if (!thenote.msglog) thenote.msglog = [];
		thenote.msglog.push(msg);

		if (this.sendCount) {
			thenote.notename = 'Reply from ' + notesoup.username;
			thenote.sendCount++;
		}
		else {
			thenote.notename = 'Message from ' + notesoup.username;
			thenote.sendCount = 1;
		}
		thenote.replyto = notesoup.foldername;

		notesoup.postRequest({
			method:"savenote",
			params:{
				note: thenote,
				tofolder: tofolder,
				notifyfolder:notesoup.foldername
			}},{
			successProc: this.sendCount ? this.quietDelete.createDelegate(this) : this.resetForm.createDelegate(this),
			requestMessage: 'Sending message...',
			failureMessage: 'Could not deliver the message.  Confirm you have sender rights to the destination.'
		});
	},


	resetForm: function() {
		this.setField('messageForm', 'msg', '');
		notesoup.say('Message sent.');
	},


	quietDelete: function() {
		notesoup.postRequest({
			method:"sendnote",
			params:{
				noteid: this.id,
				fromfolder: notesoup.foldername,
				tofolder: notesoup.username + '/trash',
				notifyfolder: notesoup.foldername,
				deleteoriginal: true
			}},{
			requestMessage: 'Message sent.'
		});
	},


	onrender: function() {

		var messageForm = new Ext.FormPanel({
			labelWidth: 75,
			labelalign: 'top',
			width: this.width - 36,
			bodyStyle: 'background:' + (this.bgcolor || notesoup.ui.defaultNoteColor),
			border: false,
			bodyBorder: false,
			items: [{
				xtype: 'textfield',
				fieldLabel: ('sendCount' in this) && (this.sendCount > 1) ? 'Reply' : 'Message',
				name: 'msg',
				id: this.getFieldID('msg'),
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

		var o = [];
		if (this.msglog) {
			var m = [];
			for (var i=0; i < this.msglog.length; i++) m.push(this.msglog[i]);
			o.push('<br/>');
			o.push(m.reverse().join('<hr/>'));
			o.push('<hr/>');
		}
		o.push('<br/>');
		this.setContentDiv(o.join(''));
		messageForm.render(this.getContentDiv());
		this.setEphemeral('messageForm', messageForm);
	}
});
note.show();
</script>