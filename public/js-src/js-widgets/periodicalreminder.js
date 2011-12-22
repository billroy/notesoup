<script type='text/javascript'>
/**
*	periodicalreminder.js - Note Soup reminder widget
*
*	Copyright 2007, 2008 Bill Roy
*	This file is licensed under the Note Soup Client License
*	See http://notesoup.net/js/LICENSE
*/
var note = notesoup.ui.getEnclosingNote(this);
note.set({

	ontick: function() {
		try {
			if (this.running) this.updateDisplay();
		} catch (e) {
			notesoup.say('pr onrender error: ' + notesoup.dump(e));
		}
	},

	onrender: function() {
		if (this.running) this.updateDisplay();
		else this.showInputForm();
	},

	showInputForm: function() {
		var reminderForm = new Ext.FormPanel({
			labelWidth: 75,
			width: this.width - 36,
			bodyStyle: 'background:' + (this.bgcolor || notesoup.ui.defaultNoteColor),
			border: false,
			bodyBorder: false,
			items: [{
				xtype: 'textfield',
				id: this.getFieldID('remindername'),
				fieldLabel: 'Subject',
				value: this.notename || '',
				width: 175
			},{
				xtype: 'textfield',
				fieldLabel: 'In how long',
				value: this.durationstring || '',
				width: 175,
				id: this.getFieldID('duration')
			},{
				xtype: 'checkbox',
				id: this.getFieldID('autorestart'),
				fieldLabel: 'Auto restart',
				checked: this.autorestart
			}],
			buttons: [{
				text: 'remind me',
				handler: this.submitReminder,
				scope: this
			}],
			keys: [{
				key: 13,
				fn: this.submitReminder,
				scope: this
			}]
		});
		var thediv = this.getContentDiv();
		thediv.innerHTML = '<br/><center><h2>Periodical Reminder Settings</h2></center><br/>';
		reminderForm.render(thediv);
		this.setEphemeral('reminderForm', reminderForm);
		//Ext.get(thediv).addKeyListener(13, this.submitReminder, this);
	},

	submitReminder: function(e) {
		notesoup.say('Setting reminder to: ' + this.getField('reminderForm', 'remindername') + ' in ' + this.getField('reminderForm', 'duration'));
		this.setupClock(this.getField('reminderForm', 'remindername'), this.getField('reminderForm', 'duration'), this.getField('reminderForm', 'autorestart'));
		this.startClock();
		//this.save();
	},

	setupClock: function(name, duration, autorestart) {
		if (!name || !duration) return;
		var t = new Date();
		this.set({
			notename: name,
			clockstartstring: t.toString(),
			clockstart: t.getTime(),
			clockduration: notesoup.getDuration(duration),
			durationstring: duration,
			autorestart: autorestart
		});
		Ext.get(this.id + '_title').update(name);
	},

	startClock: function() {
		this.running = true;
		this.complete = false;
		this.editing = false;
		this.flash('#22f822');
	},
	
	restartClock: function() {
		this.setupClock(this.notename, this.durationstring, this.autorestart);
		this.startClock();
	},

	stopClock: function() {
		delete this.running;
		var outerDiv = Ext.get(this.id + notesoup.ui.divSuffix);
		outerDiv.setStyle('opacity', 1.0);
	},
	
	editClock: function() {
		this.stopClock();
		this.editing = true;
		this.show();
	},
	
	ontimercomplete: function() {
		notesoup.say('Ding! ' + this.notename);
	},

	updateDisplay: function() {

		var timediff = new Date().getTime() - this.clockstart;
		this.completed = timediff / this.clockduration;
		if ((this.completed >= 1.0)  || (this.completed < 0)) {
			if (!this.complete) {
				this.ontimercomplete();
				this.complete = true;
				if (this.autorestart) this.restartClock();
			}
		}
		var bg = '#ff3030';
		if (this.completed < 0.75) bg = '#80ff80';
		else if (this.completed < 0.90) bg = '#ffff30';

		this.setContentDiv([
			'<br/><h2><center>', 
				this.complete ? 'PAST DUE<br/>' : '',
				notesoup.stringifyTimeDiff(timediff), 
				' (', ''+Math.floor(100 * this.completed), '%) of ', this.durationstring, '<br/>',
				'since ', ''+this.clockstartstring,
			'</center></h2><br/>'
		].join(''));

		var outerDiv = Ext.get(this.id + notesoup.ui.divSuffix);
		outerDiv.setStyle('opacity', '' + Math.max(0.05, this.completed));
		
		outerDiv.on('dblclick', function(e) {
			var thenote = notesoup.notes[notesoup.ui.getNoteIDFromWindowID(this.id)];
			thenote.editClock();
			return true;
		});
		
		var innerDiv = Ext.get(this.id + notesoup.ui.contentSuffix);
		innerDiv.setStyle('background', bg);
		var runningForm = new Ext.FormPanel({
			labelWidth: 75,
			width: this.width - 36,
			bodyStyle: 'background:' + (this.bgcolor || notesoup.ui.defaultNoteColor),
			border: false,
			bodyBorder: false,
			items: [{
				xtype: 'hidden'
			}],
			buttons: [{
				text: 'restart',
				handler: this.restartClock,
				scope: this
			},{
				text: 'edit',
				handler: this.editClock,
				scope: this
			}]
		});
		runningForm.render(this.getContentDiv());
	}	
});
note.show();
</script>