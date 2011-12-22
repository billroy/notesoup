<script type='text/javascript'>
/**
*	vsensor.js - Note Soup virtual sensor transmit test widget
*
*	Copyright 2007, 2008 Bill Roy
*	This file is licensed under the Note Soup Client License
*	See http://notesoup.net/js/LICENSE
*/
var note = notesoup.ui.getEnclosingNote(this);
note.set({

	sendit: function() {
		var op = this.getField('vsensorForm', 'op');
		var data = this.getField('vsensorForm', 'data');
		if (op && data) notesoup.postEvent('/sensor/' + notesoup.foldername, op, data);
	},
	
	resetForm: function() {
		this.setField('vsensorForm', 'data', '');
		notesoup.say('Message sent.');
	},

	onrender: function() {

		var vsensorForm = new Ext.FormPanel({
			//labelWidth: 75,
			labelalign: 'top',
			width: this.width - 36,
			bodyStyle: 'background:' + (this.bgcolor || notesoup.ui.defaultNoteColor),
			border: false,
			bodyBorder: false,
			items: [{
				xtype: 'textfield',
				fieldLabel: 'op',
				name: 'op',
				id: this.getFieldID('op'),
				width: this.width - 36 - 86
			},{
				xtype: 'textfield',
				fieldLabel: 'data',
				name: 'data',
				id: this.getFieldID('data'),
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
		vsensorForm.render(this.getContentDiv());
		this.setEphemeral('vsensorForm', vsensorForm);
	}
});
note.show();
</script>