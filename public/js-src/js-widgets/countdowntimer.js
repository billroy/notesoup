<script type='text/javascript'>
/**
*	countdown.js - Note Soup count down timer widget
*
*	Copyright 2007, 2008 Bill Roy
*	This file is licensed under the Note Soup Client License
*	See http://notesoup.net/js/LICENSE
*/
var note = notesoup.ui.getEnclosingNote(this);
note.set({

	ontick: function() {
		if (this.running) this.updateDisplay();
	},

	onrender: function() {
		if (this.running) this.updateDisplay();
		else this.showInputForm();
	},

	showInputForm: function() {
		var myForm = new Ext.FormPanel({
			labelWidth: 75,
			labelalign: 'top',

			width: this.width - 36,
			bodyStyle: 'background:' + (this.bgcolor || notesoup.ui.defaultNoteColor),
			border: false,
			bodyBorder: false,
			items: [{
				xtype: 'textfield',
				fieldLabel: 'Subject',
				name: 'subject',
				id: this.getFieldID('subject'),
				value: this.subject || '',
				width: this.width - 36 - 86,
				value: this.notename || '',
				width: 250
			},{
				xtype: 'textfield',
				fieldLabel: 'Deadline timestamp',
				name: 'deadline',
				id: this.getFieldID('deadline'),
				value: this.deadline ? this.deadline : new Date(),
				width: 250
			}],
			buttons: [{
				text: 'go',
				handler: this.submitForm,
				scope: this
			}],
			keys: [{
				key: 13,
				fn: this.submitForm,
				scope: this
			}]
		});
		var thediv = this.getContentDiv();
		thediv.innerHTML = '<br/><center><h2>Countdown To Deadline</h2></center><br/>';
		myForm.render(thediv);
		this.setEphemeral('myForm', myForm);
	},

	submitForm: function(e) {
		notesoup.say('Starting countdown to: ' + this.getField('myForm', 'subject') + ' at ' + this.getField('myForm', 'deadline'));
		this.setupClock(this.getField('myForm', 'subject'), this.getField('myForm', 'deadline'));
		this.save();
	},

	setupClock: function(subject, deadline) {
		if (!subject || !deadline) return;
		var t = new Date();
		this.set({
			running: true,
			editing: false,
			notename: subject,
			deadline: deadline,
			deadlinetime: Date.parse(deadline)
		});
		Ext.get(this.id + '_title').update(subject);
		this.ontick = function() {this.onrender();};
	},

	editClock: function() {
		this.editing = true;
		this.show();
	},
	
	updateDisplay: function() {
		var timediff = this.deadlinetime - new Date().getTime();
		var preposition = 'until ';
		if (timediff < 0) {
			preposition = 'since ';
			timediff = (-timediff);
		}
		this.setContentDiv([
			'<br/><h2><center>', 
				notesoup.stringifyTimeDiff(timediff), '<br/>',
				preposition, this.deadline,
			'</center></h2><br/>'
		].join(''));
	}
});
note.show();
</script>