<script type='text/javascript'>
/**
*	chat.js - Note Soup chat widget
*
*	Copyright 2007, 2008 Bill Roy
*	This file is licensed under the Note Soup Client License
*	See http://notesoup.net/js/LICENSE
*/
var note = notesoup.ui.getEnclosingNote(this);
note.set({

	allowAnonymous: false,

	chatSay: function() {
		var user = notesoup.username;
		if (!notesoup.loggedin) {
			if (!this.allowAnonymous) {
				notesoup.say('You must be logged in to chat.');
				return;
			}
			user = 'Anonymous';
		}

		var utterance = this.getField('chatForm', 'chattext');
		if (utterance) {
			notesoup.folderSay(utterance);
			if ($n('chat log')) {
				$n('chat log').append(user + ': ' + utterance + '<br/>');
			}
			this.setField('chatForm', 'chattext', '');
			Ext.get(this.id + '_chattext').focus(true);
		}
	},

	onrender: function() {

		var chatForm = new Ext.FormPanel({
			labelWidth: 50, 
			labelalign: 'top',
			width: this.width - 36,
			bodyStyle: 'background:' + (this.bgcolor || notesoup.ui.defaultNoteColor),
			border: false,
			bodyBorder: false,

			items: [{
				xtype: 'textarea',
				fieldLabel: 'Type here',
				id: this.getFieldID('chattext'),
				name: 'chattext',
				value: '',
				width: 300
			}],
			buttons: [{
				text: 'say it',
				handler: this.chatSay,
				scope: this
			}],
			keys: [{
				key: 13,
				fn: this.chatSay,
				scope: this
			}]
		});
		var thediv = this.getContentDiv();
		thediv.innerHTML = '<br/>';
		chatForm.render(thediv);
		this.setEphemeral('chatForm', chatForm);
		Ext.get(thediv).addKeyListener(13, this.chatSay, this);
	}
});
note.show();
</script>
loading...