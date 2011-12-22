<script type='text/javascript'>
/**
*	soupvine.js - Note Soup twitter widget
*
*	Copyright 2007, 2008 Bill Roy
*	This file is licensed under the Note Soup Client License
*	See http://notesoup.net/js/LICENSE
*/
var note = notesoup.ui.getEnclosingNote(this);
note.set({

	postinterval: '20 seconds',	// minimum time between posts

	init: function() {
		//if (!this.subs) this.subs = [];
		if (!this.subs) this.subs = {};
		this.show();
	},

	makeSubscriptionTicket: function(cmd) {
		if (!notesoup.loggedin || !notesoup.username || !notesoup.issender) {
			return notesoup.say('Sorry.');
		}
		notesoup.saveNote({
			notename: cmd + ' ' + notesoup.username,
			cmd: cmd,
			apropos: this.id,
			bgcolor: cmd == 'subscribe' ? 'lime' : 'deeppink',
			text: notesoup.username
		}, notesoup.foldername);
		alert('Your request to ' + cmd + ' has been saved and will be processed before the next update.');
	},
	subscribe: function() { this.makeSubscriptionTicket('subscribe'); },
	unsubscribe: function() { this.makeSubscriptionTicket('unsubscribe'); },

	addsubscription: function(user, mtime) {
		if (!user) return;
		notesoup.say('Subscribe ' + user);

		// only the eldest ticket counts
		if ((user in this.subs) && (mtime < this.subs[user])) return;

		//notesoup.say('before: ' +  notesoup.dump(this.subs) + '' + notesoup.dump(this));
		//this.subs.push(user);
		this.subs[user] = notesoup.getServerTime(); 	// unix mtime!
		//notesoup.say('after: ' + notesoup.dump(this.subs) + ' ' + notesoup.dump(this));
		this.dirty = true;
	},

	deletesubscription: function(user, mtime) {
		notesoup.say('Unsubscribe ' + user);
		if (this.subs && (user in this.subs) && (this.subs[user] < mtime)) {
			delete this.subs[user];
			this.dirty = true;
		}
	},

	processTickets: function() {
		if (!notesoup.iseditor) return;
		notesoup.say('Processing subscription updates...');
		var deletelist = [];
		for (var n in notesoup.notes) {
			if (n == this.id) continue;
			var note = notesoup.notes[n];
			if (typeof(note.cmd) == 'string') {
				notesoup.say('command: ' + note.cmd + ' ' + note.id);
				if (note.cmd == 'subscribe') this.addsubscription(note.text, note.mtime);
				else if (note.cmd == 'unsubscribe') this.deletesubscription(note.text, note.mtime);
				else {
					notesoup.say('Ticket with bogus command: ' + note.id);
					return;
				}
				deletelist.push(n);
			}
		}
		if (this.dirty) {
			notesoup.say('Saving subscription updates...');
			delete this.dirty;
			this.save();
			this.sendself('show');	// update remote watchers
			notesoup.say('Saved.');
		}
		while (deletelist.length) {
			var d = deletelist.pop();
			notesoup.say('Removing processed subscription request ' + d);
			notesoup.deleteNote(d);
		}
	},
	
	addsub: function() {
		var user = prompt('User to subscribe:', '');
		if (user) {
			this.addsubscription(user, notesoup.getServerTime());
			//notesoup.say('subdump: ' + notesoup.dump(this.subs));
			this.save();
		}
	},

	delsub: function() {
		var user = prompt('User to unsubscribe:', '');
		if (user) {
			this.deletesubscription(user, notesoup.getServerTime());
			this.save();
		}
	},
	
	countsubs: function() {
		var count=0;
		for (var s in this.subs) ++count;
		return count;
	},

	who: function() {
		this.processTickets();
		var thenote = {
			notename: 'Subscriptions for ' + notesoup.foldername + ':',
			xPos: this.xPos,
			yPos: this.yPos + this.height + 12,
			bgcolor: this.bgcolor || notesoup.ui.defaultNoteColor
		};
		var o = [];
		for (var s in this.subs) o.push(s, '<br/>');
		o.push('<center><input type="submit" value="done" onclick="notesoup.ui.getEnclosingNote(this).destroy();"/></center>');
		thenote.text = o.join('');
		notesoup.saveNote(thenote);
	},


	post: function() {

		if (this.lastpost) {	// rate limiting
			var dt = new Date().getTime() - (this.lastpost + notesoup.getDuration(this.postinterval));
			if (dt < 0) {
				notesoup.say('You may post again in ' + notesoup.stringifyTimeDiff(-dt), 'error');
				return;
			}
		}

		this.processTickets();

		var post = this.getField('postingForm', 'msg');
		notesoup.say('Posting message: ' + post);
		if (!post) return;
		
		var log = $n(this.logname || 'post log');
		if (log) {
			log.text = ['' + new Date(), '<br/>', notesoup.username, ': ', post, '<hr/>', (log.text || '')].join('');
			log.save();
			log.flash('green');
		}
		
		var deliveries = 0;
		var t1 = new Date().getTime();
		for (var s in this.subs) {
			var channeluri = (s.charAt(0) == '/') ? s : '/talk/' + s;
			notesoup.say('Posting to ' + channeluri + '...');
			notesoup.postEvent(channeluri, 'say', post);
			deliveries++;
		}

		this.lastpost = new Date().getTime();
		this.save();
		notesoup.say('Posted.');
		notesoup.say('Posted ' + deliveries + ' notifications in ' + Math.floor(new Date().getTime()-t1) + 'ms', 'whisper');
	},

	makeButton: function(name) {
		return ['<input type="submit" value="', name, '" onclick="notesoup.ui.getEnclosingNote(this).', name, '();"/>'].join('');
	},

	onrender: function() {
		var o = [];
		if (notesoup.iseditor) this.renderPostingForm();
		else if (notesoup.issender) {
			var subscribed = (notesoup.username in this.subs);
			var buttontext =  subscribed ? 'unsubscribe' : 'subscribe';
			this.setContentDiv([
				'<center>',
					'<br/>',
					'Welcome, ', notesoup.username || 'Anonymous', '<br/>',
					'You are', subscribed ? '' : ' not', ' subscribed.<br/>',
					'Click here to ', buttontext, ':<br/>', 
					this.makeButton(buttontext), '<br/>',
				'</center>'
			].join(''));
		}
		else {
			this.setContentDiv('<center><br/>Please <a href="/folder/system/welcome">create an account and log in</a> to subscribe.<br/><br/></center>');
		}
	},
	
	renderPostingForm: function() {
		var postingForm = new Ext.FormPanel({
			labelWidth: 75,
			minButtonWidth: 25,
			labelalign: 'top',
			width: this.width - 36,
			bodyStyle: 'background:' + (this.bgcolor || notesoup.ui.defaultNoteColor),
			border: false,
			bodyBorder: false,
			items: [{
				xtype: 'textarea',
				fieldLabel: 'Message',
				name: 'msg',
				id: this.getFieldID('msg'),
				width: this.width - 36 - 86
			}],
			buttons: [
				{text: 'post', handler: this.post, scope: this},
				{text: '+', handler: this.addsub, scope: this, width: 25 },
				{text: '-', handler: this.delsub, scope: this, width: 25 },
				{text: 'who', handler: this.who, scope: this}
			],
			keys: [{key: 13, fn: this.post, scope: this}]
		});
		this.setContentDiv([
			'<center><br/>', 
			'' + this.countsubs(), ' subscribers<br/>',
			'<br/>',
			'</center><hr/>'
		].join(''));
		postingForm.render(this.getContentDiv());
		this.setEphemeral('postingForm', postingForm);
	}
});
note.init();
</script>