<script type='text/javascript'>
/**
*	chatty.js - Note Soup chat widget
*
*	Copyright 2007, 2008 Bill Roy
*	This file is licensed under the Note Soup Client License
*	See http://notesoup.net/js/LICENSE
*/
var note = notesoup.ui.getEnclosingNote(this);
note.set({

	sendit: function() {
		var to = this.getField('chattyForm', 'to');
		var msg = this.getField('chattyForm', 'msg');
		if (to && msg) notesoup.postEvent('/talk/' + to, 'say', msg);
	},
	
	ping: function() {
		var to = this.getField('chattyForm', 'to');
		if (to) notesoup.postEvent('/talk/' + to, 'say', 'Ping!');
	},

	resetForm: function() {
		this.setField('chattyForm', 'msg', '');
		notesoup.say('Message sent.');
	},

	onrender: function() {

		var chattyForm = new Ext.FormPanel({
			//labelWidth: 75,
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
				xtype: 'textarea',
				fieldLabel: 'Say',
				name: 'msg',
				id: this.getFieldID('msg'),
				width: this.width - 36 - 86
			}],
			buttons: [{
				text: 'Ping',
				handler: this.ping,
				scope: this
			},{
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
		chattyForm.render(this.getContentDiv());
		this.setEphemeral('chattyForm', chattyForm);
	}
});
note.show();
</script>