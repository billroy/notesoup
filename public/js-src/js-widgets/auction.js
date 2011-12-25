<script type='text/javascript'>
/**
*	auction.js - Note Soup auction widget
*
*	Copyright 2007, 2008 Bill Roy
*	This file is licensed under the Note Soup Client License
*	See http://notesoup.net/js/LICENSE
*/
note.set({
	xPos: 12,
	yPos: 36,

	bidypos: 228,
	bidyinc: 42,

	runningACL: {
		readers: '*',
		senders: '*'
	},
	closedACL: {
		//readers: '-*',
		senders: '-*'
	},
	
	isAuctionOwner: function() {
		return (notesoup.loggedin && (notesoup.username == notesoup.foldername.split('/')[0]));
	},


	startAuction: function() {
		if (!this.running && notesoup.loggedin && this.isAuctionOwner()) {
			var duration = notesoup.prompt('Starting Auction: How long should the auction last?', '100 seconds');
			if (!duration) return;
			duration = notesoup.getDuration(duration);
			if (!duration) return;
			this.starttime = new Date().getTime();
			this.duration = duration;
			this.endtime = this.starttime + duration;
			this.auctionuser = notesoup.username;
			notesoup.setFolderACL(notesoup.foldername, this.runningACL);
			this.running = true;
			this.save();
			this.show();
			notesoup.say('The auction is running.');
		}
		else {
			notesoup.say('Sorry, only the auction owner can start the auction.', 'error');
		}
	},


	endAuction: function() {
		if (this.running && this.isAuctionOwner()) {
			this.running = false;
			notesoup.say('Ending auction...');
			notesoup.setFolderACL(notesoup.foldername, this.closedACL);
			notesoup.folderSay('The auction is closed.');
			
			var text = this.highbidder ? 
				'Winning bidder: ' + this.highbidder + '<br/>Winning bid: ' + this.highbid :
				'There were no bids.';
			
			notesoup.saveNote({
				notename: 'Auction ended at ' + new Date(),
				bgcolor: 'lime',
				xPos: this.xPos,
				yPos: this.yPos,
				text: '<br/><br/><center>' + text + '</center><br/><br/>'
			}, notesoup.foldername);
			this.destroy();
		}
		else {
			notesoup.say('Sorry, only the auction owner can end the auction.', 'error');
		}
	},


	bid: function() {
		if (!notesoup.loggedin || !notesoup.username) {
			notesoup.say('Sorry, you must be logged in to bid.', 'error');
			return;
		}
		if (!this.running) {
			notesoup.say('Sorry, the auction is not running.', 'error');
			return;
		}
		var bidval = this.getField('auctionForm', 'mybid');
		if (!bidval) return;

		var bid = parseFloat(bidval);
		if (this.highbid && (bid <= this.highbid)) {
			notesoup.say('Sorry, your bid must be greater than the current high bid.');
			return;
		}
		notesoup.say('Submitting your bid: ' + bid);

		//var id = 'noteauctionbid' + notesoup.randomName(20);
		notesoup.saveNote({
			notename: 'bid',
			xPos: 12,
			yPos: this.bidypos,
			apropos: this.id,
			bgcolor: notesoup.ui.defaultNoteColor,
			text: '' + bid + ' by ' + notesoup.username + ' at ' + new Date()
		}, notesoup.foldername);
		this.setField('auctionForm', 'mybid', '');
		this.bidypos += this.bidyinc;
	},


	ontick: function() {
		if (!this.running) return;
		if (new Date() > this.endtime) {
			if (this.isAuctionOwner()) {
				this.endAuction();
				return;
			}
			else {
				this.running = false;
				this.setContentDiv('<br/><br/>The auction has ended...<br/><br/>');
				return;
			}
		}

		// update time remaining
		this.timeleft = this.endtime - new Date();

		// set the color
		var newcolor = '';
		if (this.timeleft < (15*1000)) newcolor = 'red';
		else if (this.timeleft < (60*1000)) newcolor = 'yellow';
		if (newcolor && (newcolor != this.bgcolor)) {
			this.bgcolor = newcolor;
			this.show();
		}

		// find and post high bid
		this.highbid = 0.0;
		this.highbidder = '';
		for (var n in notesoup.notes) {
			if (n == this.id) continue;
			var thenote = notesoup.notes[n];
			if (thenote.notename != 'bid') continue;

			if (!thenote.text || !thenote.from || !thenote.mtime || 
				(thenote.mtime * 1000 < this.starttime) || (thenote.mtime * 1000 > this.endtime)) {
				if (this.isAuctionOwner()) {
					notesoup.say('Deleting malformed bid.');
					thenote.destroy();
					//notesoup.say(thenote.toJSON());
				}
				else continue;
			}
			var bid = parseFloat(thenote.text);
			if (bid > this.highbid)  {
				this.highbid = bid;
				this.highbidder = thenote.from.split(' ')[0];
			}
			if (thenote.yPos >= this.bidypos) {
				this.bidypos = thenote.yPos + this.bidyinc;
			}
		}

		this.setField('auctionForm', 'timeleft',  notesoup.stringifyTimeDiff(this.timeleft));
		this.setField('auctionForm', 'highbid', ''+this.highbid || '');
		this.setField('auctionForm', 'highbidder', ''+this.highbidder || '');
	},


	onrender: function() {
	
		var preamble = '';

		var auctionForm = new Ext.FormPanel({
			labelWidth: 75,
			items: [{xtype: 'hidden'}],
			bodyStyle: 'background:' + (this.bgcolor || notesoup.ui.defaultNoteColor),
			border: false,
			bodyBorder: false
		});

		if (this.running) {
			auctionForm.add({
					xtype: 'textfield',
					fieldLabel: 'Time remaining',
					id: this.getFieldID('timeleft'),
					name: 'timeleft',
					width: this.width - 36 - 86
				},{
					xtype: 'numberfield',
					fieldLabel: 'High bid',
					id: this.getFieldID('highbid'),
					name: 'highbid',
					width: this.width - 36 - 86
				},{
					xtype: 'textfield',
					fieldLabel: 'High bidder',
					id: this.getFieldID('highbidder'),
					name: 'highbidder',
					width: this.width - 36 - 86
				},{
					xtype: 'numberfield',
					fieldLabel: 'Enter your bid here',
					id: this.getFieldID('mybid'),
					name: 'mybid',
					width: this.width - 36 - 86
				}
			);
	
			auctionForm.addButton({
				text: 'bid',
				handler: this.bid,
				scope: this
			});

			if (this.isAuctionOwner()) {
				auctionForm.addButton({
					text: 'end auction',
					handler: this.endAuction,
					scope: this
				});
			}
		} 
		else {
			preamble = '<center><br/><br/>Waiting for the auction owner to start the auction.<br/><br/></center>';
			if (this.isAuctionOwner()) {		
				auctionForm.addButton({
					text: 'start',
					handler: this.startAuction,
					scope: this
				});
			}
		}

		this.setContentDiv(preamble);
		var thediv = this.getContentDiv();
		auctionForm.render(thediv);
		this.setEphemeral('auctionForm', auctionForm);
		//Ext.get(thediv).addKeyListener(13, this.bid, this);
	}
});
note.show();
</script>