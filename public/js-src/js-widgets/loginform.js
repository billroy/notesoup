<script type='text/javascript'>
/**
*	loginform.js - Note Soup login widget
*
*	Copyright 2007, 2008 Bill Roy
*	This file is licensed under the Note Soup Client License
*	See http://notesoup.net/js/LICENSE
*/
note.set({

	allowcreate: true,

	onrender: function() {

		var buttons = [{
			text: 'log in',
			handler: this.submit,
			scope: this
		}];

		if (this.allowcreate) {
			buttons.push({
				text: 'create account',
				handler: this.create,
				scope: this
			});
		}

		var loginForm = new Ext.FormPanel({
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
		loginForm.render(thediv);
		this.setEphemeral('loginForm', loginForm);
	},

	create: function(e) {
		if (!this.allowcreate) {
			notesoup.say('Account creation is not enabled.  Please contact the soupmaster.');
			return;
		}
		notesoup.createUser(this.getField('loginForm', 'username'), this.getField('loginForm', 'password'));
	},


	submit: function(e) {
		//notesoup.say('Login: ' + this.getField('loginForm', 'username') + ' ' + this.getField('loginForm', 'password'));
		notesoup.login(this.getField('loginForm', 'username'), this.getField('loginForm', 'password'));
	}
});
note.show();
</script>