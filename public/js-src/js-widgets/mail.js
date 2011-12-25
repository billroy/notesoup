<script type='text/javascript'>
/**
*	mail.js - Note Soup mail widget
*
*	Copyright 2007, 2008 Bill Roy
*	This file is licensed under the Note Soup Client License
*	See http://notesoup.net/js/LICENSE
*/
note.set({

	sendmail: function(to, subject, body) {
		notesoup.postRequest({
			method:"mail",
			params:{
				to: to,
				subject: subject,
				body:body
			}
		},{
			requestMessage: 'Sending email...',
			successMessage: 'Sent.',
			failureMessage: 'Error sending mail.'
		});
	},

	sendit: function() {
		var to = this.getField('mailForm', 'to');
		var subject = this.getField('mailForm', 'subject');
		var msg = this.getField('mailForm', 'msg');
		if (to) this.sendmail(to, subject, msg);
	},
	
	ping: function() {
		var to = this.getField('mailForm', 'to');
		if (to) this.sendmail(to, 'Ping!', '');
	},

	resetForm: function() {
		this.setField('mailForm', 'msg', '');
		notesoup.say('Message sent.');
	},

	onrender: function() {

		var mailForm = new Ext.FormPanel({
			labelWidth: 75,
			labelalign: 'top',
			width: this.width - 36,
			bodyStyle: 'background:' + (this.bgcolor || notesoup.ui.defaultNoteColor),
			border: false,
			bodyBorder: false,
			items: [{
				xtype: 'textfield',
				fieldLabel: 'To',
				name: 'to',
				id: this.getFieldID('to'),
				width: this.width - 36 - 86
			},{
				xtype: 'textfield',
				fieldLabel: 'Subject',
				name: 'subject',
				id: this.getFieldID('subject'),
				width: this.width - 36 - 86
			},{
				xtype: 'textarea',
				fieldLabel: 'Message',
				name: 'msg',
				id: this.getFieldID('msg'),
				width: this.width - 36 - 86
			}],
			buttons: [{
				text: 'Ping', handler: this.ping, scope: this },
				{text: 'Send', handler: this.sendit, scope: this},
				{text: 'Done', handler: this.destroy, scope: this}]/***,
			keys: [{
				key: 13, fn: this.sendit, scope: this
			}]***/
		});
		this.setContentDiv('<br/>');
		mailForm.render(this.getContentDiv());
		this.setEphemeral('mailForm', mailForm);
	}
});
note.show();
</script>