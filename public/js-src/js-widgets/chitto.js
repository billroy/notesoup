<script type='text/javascript'>
/**
*	chitto.js - Note Soup expense tracking and splitting widget
*
*	Copyright 2007, 2008 Bill Roy
*	This file is licensed under the Note Soup Client License
*	See http://notesoup.net/js/LICENSE
*/
note.set({

	votespervoter: 1,

	xPos: 12,
	yPos: 36,

	votexpos: 276,
	voteypos: 36,
	voteyinc: 42,

	unlockFolder: function() {
		notesoup.setFolderACL(notesoup.foldername, {
			readers: '*',
			senders: '*'
		});
	},


	lockFolder: function() {
		notesoup.setFolderACL(notesoup.foldername, {
			//readers: '-*',
			senders: '-*'
		});
	},


	ischitOwner: function() {
		return (notesoup.loggedin && (notesoup.username == notesoup.foldername.split('/')[0]));
	},


	getTopic: function(save) {
		this.topic = notesoup.prompt('Enter a topic for the chit:', this.topic);
		if (save) {
			this.save();
			this.show();
		}
	},


	startchit: function() {
		if (!this.running && notesoup.loggedin && this.ischitOwner()) {
			if (!this.topic) this.getTopic();
			var duration = notesoup.prompt('Starting chit: How long should voting be open?', '100 seconds');
			if (!duration) return;
			duration = notesoup.getDuration(duration);
			if (!duration) return;
			this.starttime = new Date().getTime();
			this.duration = duration;
			this.endtime = this.starttime + duration;
			this.chituser = notesoup.username;
			this.unlockFolder();
			this.running = true;
			this.ended = false;
			this.save();
			this.show();
			notesoup.folderSync();
			notesoup.say('The chit is running.');
		}
		else {
			notesoup.say('Sorry, only the chit owner can start the chit.', 'error');
		}
	},


	endchit: function() {
		if (this.running && this.ischitOwner()) {
			this.running = false;
			this.ended = true;
			notesoup.say('Ending chit...');
			this.lockFolder();
			this.updateVoteCounts();
			this.save();
			notesoup.folderSync();
			notesoup.folderSay('The chit is closed.');
		}
		else {
			this.running = false;
		}
	},
	

	addChoice: function() {
		if (this.running) return;
		if (!this.ischitOwner()) return;
		var choicetext = prompt('Add Choice: Enter the text for this chit choice:', '');
		if (!choicetext) return;
		if (this.choices == undefined) this.choices = [];
		this.choices.push(choicetext);
		if (this.votecounts == undefined) this.votecounts = [];
		this.votecounts.push(0);
		this.save();
		this.show();
	},


	vote: function(choiceindex) {
		if (!notesoup.loggedin || !notesoup.username) {
			notesoup.say('Sorry, you must be logged in to vote.', 'error');
			return;
		}
		if (!this.running) {
			notesoup.say('Sorry, the chit is not running.', 'error');
			return;
		}
		if ((choiceindex > this.choices.length) || (choiceindex < 0)) return;
		notesoup.say('Submitting your vote: ' + this.choices[choiceindex]);

		//var id = 'notechitvote' + notesoup.randomName(20);
		notesoup.saveNote({
			notename: 'vote',
			//id: id,
			xPos: this.votexpos,
			yPos: this.voteypos,
			apropos: this.id,
			bgcolor: notesoup.ui.defaultNoteColor,
			text: this.choices[choiceindex]
		}, notesoup.foldername);
		this.voteypos += this.voteyinc;
	},



	tallyVote: function(vote) {
		for (var c=0; c < this.choices.length; c++) {
			if (vote.text == this.choices[c]) {
				var voter = vote.from.split(' ')[0];
				if (!(voter in this.votes)) this.votes[voter] = [];
				this.votes[voter].push(c);
				while (this.votes[voter].length > this.votespervoter) {
					//notesoup.say('discarding rolloff vote for ' + voter);
					this.votes[voter].shift();
				}
				return;
			}
		}
		thenote.flash('chocolate');
		notesoup.say('Invalid vote.');
	},


	totalize: function() {
		for (var i=0; i < this.choices.length; i++) this.votecounts[i] = 0;
		this.totalvotes = 0;
		for (var voter in this.votes) {
			for (var vote=0; vote < this.votes[voter].length; vote++) {
				//notesoup.say('Totalizer: ' + voter + ' ' + vote + ' ' + this.votes[voter][vote]);
				this.votecounts[this.votes[voter][vote]]++;
				this.totalvotes++;
			}
		}
		notesoup.say('Totalizer sees ' + this.totalvotes + ' votes.', 'whisper');
	},


	postGrandTotal: function() {
		var t = this.totalvotes ? this.totalvotes : 0;
		Ext.get(this.id + '_pc_total').update('<hr/>Total votes: ' + t);
	},


	postTotals: function() {
		for (var i=0; i < this.choices.length; i++) {
			Ext.get(this.id + '_pc_v_' + i).update(''+this.votecounts[i]);
		}
		this.postGrandTotal();
	},


	updateVoteCounts: function() {
		this.votes = {};
		var notelist = notesoup.getNotesOrderedBy('mtime', true);
		for (var n=0; n < notelist.length; n++) {
			var thenote = notesoup.notes[notelist[n]];
			if (thenote.id == this.id) continue;
			if (!thenote.notename) continue;
			if (thenote.notename != 'vote') continue;
			if (!thenote.apropos) continue;
			if (thenote.apropos != this.id) continue;

			if (!thenote.text || !thenote.from || !thenote.mtime || 
				(thenote.mtime * 1000 < this.starttime) || (thenote.mtime * 1000 > this.endtime)) {
				if (this.ischitOwner()) {
					notesoup.say('Deleting malformed vote.');
					thenote.destroy();
				}
				else continue;
			}
			this.tallyVote(thenote);
		}
		this.totalize();
		this.postTotals();
	},


	ontick: function() {
		if (!this.running) return;
		if (new Date() > this.endtime) {
			if (this.ischitOwner()) {
				this.endchit();
				return;
			}
			else {
				this.running = false;
				return;
			}
		}

		// update time remaining
		this.timeleft = this.endtime - new Date();
		Ext.get(this.id + '_pc_timeleft').update('Time remaining: ' + notesoup.stringifyTimeDiff(this.timeleft));

		// set the color
		var newcolor = '';
		if (this.timeleft < (15*1000)) newcolor = 'red';
		else if (this.timeleft < (60*1000)) newcolor = 'yellow';
		if (newcolor) {
			this.getContentDiv().style.background = newcolor;
		}

		try {
			this.updateVoteCounts();
		} catch(e) {
			notesoup.say('Exception updating vote count: ' + notesoup.dump(e));
			return;
		}
	},


	formatChoice: function(index) {
		return(['<tr>',
			'<td>',
				this.running ? '<input type="submit" value="vote"'+
					' onclick="notesoup.ui.getEnclosingNote(this).vote(' + index + ');"/>' : '&bull;&nbsp;',
			'</td>',
			'<td style="width:80%;">', this.choices[index], '</td>',
			'<td style="align:right;"><span id="', 
			this.id, '_pc_v_', 
			''+index, '">', 
			''+this.votecounts[index], 
			'</span></td>',
		'</tr>'].join(''));
	},


	onrender: function() {
		var o = [];
		
		if (this.running || this.ended || this.ischitOwner()) {

			o.push(
				this.topic ? this.topic : this.ischitOwner() ? 'Click "enter topic" to supply a topic for this space.' : '',
				'<hr/>',
				'<center>',
					this.running ? 'The chit is open.' : 
						this.ended ? 'The chit has ended.' : 
							'The chit has not started.',
					'<br/>',
					'<span id="', this.id, '_pc_timeleft">&nbsp;</span>',
				'</center><hr/>');

			if (this.choices) {
				o.push('<table>');
				for (var c=0; c < this.choices.length; c++) {
					o.push(this.formatChoice(c));
				}
				o.push('</table>');
			}
			else o.push('There are no choices for the chit yet.  Click "add choice" to get started.');
			o.push('<span style="align:right;" id="', this.id, '_pc_total"></span>');
		}
		else {
			o.push('<br/><br/><center>The chit has not started.</center><br/><br/>');
		}

		if (this.ischitOwner()) {
			if (this.running) {
				o.push('<hr/><center>',
					'<input type="submit" value="end chit"',
					' onclick="notesoup.ui.getEnclosingNote(this).endchit();"/>',
					'</center>');
			} else {
				o.push('<hr/><center>',
					'<input type="submit" value="enter topic"',
					' onclick="notesoup.ui.getEnclosingNote(this).getTopic(true);"/>',
					'&nbsp;',
					'<input type="submit" value="add choice"',
					' onclick="notesoup.ui.getEnclosingNote(this).addChoice();"/>');
				if (this.choices) o.push(
					'&nbsp;',
					'<input type="submit" value="start chit"',
					' onclick="notesoup.ui.getEnclosingNote(this).startchit();"/>');
				o.push('</center>');
			}
		}
		this.setContentDiv(o.join(''));
		this.postGrandTotal.defer(200, this);
	}
});
note.show();
</script>
loading...