<script type='text/javascript'>
/**
*	passwordform.js - Note Soup set-password widget
*
*	Copyright 2012 Bill Roy
*	This file is licensed under the Note Soup Client License
*	See http:/js/LICENSE
*
*	{imports:'/js-src/js-widgets/passwordform.js'}
*/
note.set({

	onrender: function() {

		var buttons = [{
			text: 'update password',
			handler: this.submit,
			scope: this
		}];

		var passwordForm = new Ext.FormPanel({
			labelWidth: 75,
			width: this.width - 36,
			bodyStyle: 'background:' + (this.bgcolor || notesoup.ui.defaultNoteColor),
			border: false,
			bodyBorder: false,

			items: [{
				xtype: 'textfield',
				fieldLabel: 'Username',
				id: this.getFieldID('username'),
				width: 175
			},{
				xtype: 'textfield',
				fieldLabel: 'Password',
				id: this.getFieldID('password'),
				width: 175,
				inputType: 'password'
			}],
			buttons: buttons,
			keys: [{key: 13, fn: this.submit, scope: this}]
		});

		var thediv = this.getContentDiv();
		thediv.innerHTML = '<br/>';
		passwordForm.render(thediv);
		this.setEphemeral('passwordForm', passwordForm);
	},

	submit: function(e) {
		notesoup.setPassword(this.getField('passwordForm', 'username'), this.getField('passwordForm', 'password'));
	}
});
note.show();
</script>