<script type='text/javascript'>
/**
*	porthole.js - Note Soup portable hole widget
*
*	Copyright 2007, 2008 Bill Roy
*	This file is licensed under the Note Soup Client License
*	See http://notesoup.net/js/LICENSE
*/
note.set({

	isPortableHole: true,
	random: false,

	init: function() {
		if (this.viewfolder) this.refreshNoteList();
		else if (this.feedurl) this.getFeed();
		this.show();
		this.updateControls();
	},


	refreshNoteList: function() {
		if (this.viewfolder) {
			delete this.running;
			delete this.targetnoteid;
			delete this.targetnote;
			delete this.notes;
			delete this.noteidlist;

			notesoup.postRequest({
				method:"gettemplatelist",
				params:{
					fromfolder: this.viewfolder
			}},{
				//requestMessage: 'Fetching note list from ' + this.viewfolder + '...',
				//successMessage: 'Fetch complete.',
				successProc:	this.handleNoteListUpdate,
				successProcScope: this,
				failureMessage: 'Failure fetching note list from ' + this.viewfolder
			});
			this.showLoading();
		}
	},


	/**
	*	notelist:
	*	[0]: foldername like charlie/inbox
	*	[1]: noteid like noteN003kkrOI
	*	[2]: notename like shopping list
	*/
	handleNoteListUpdate: function(response, options) {
		this.setContentDiv('');	// kill the loading indicator
		var response = Ext.util.JSON.decode(response.responseText);

		if (response['error']) {
			notesoup.say('Could not fetch note list.', 'error');
			return;
		}
		var notelist = response.command[0][1];

		this.noteidlist = [];
		for (var i=0; i < notelist.length; i++) {
			if (notelist[i][1].indexOf('.') < 0) {
				this.noteidlist.push(notelist[i][1]);
			}
		}
		//notesoup.say('Note id list: ' + notesoup.dump(this.noteidlist));
		if (this.random) this.randomNote();
		else this.firstNote();
		this.running = true;
	},



	/**
	*	Fetch an RSS feed via the server
	*/
	getFeed: function() {
		Ext.Ajax.request({
			method: 'GET',
			url: '/getfeed',
			params: {url: 'http' + this.feedurl.substr(4)},
			disableCaching: false,
			success: this.getFeedHandler,
			scope: this
		});
		//notesoup.say('Feed request sent...');
		this.showLoading.createDelegate(this).defer(10);
	},
	
	
	/**
	*	Format and display the specified rss feed item.
	*	@param {number} entry	the index of the entry in feed[entries]
	*/
	noteFromRSSEntry: function(entry) {
		var text = [];
		text.push(
			'<b>', entry.title, ': </b>',
			entry.summary,
			'<a href="', entry.link, '" target="_blank">',
			'<img src="', notesoup.imageHost, 'images/famfamfam.com/link.png"></a>',
			entry.updated ? '<hr/><h5>Updated: ' + entry.updated + '</h5>' : '');

		return {
			notename: this.feedname || 'RSS Hole',
			text: text.join(''),
			id: 'feed' + notesoup.randomName(10),
			bgcolor: notesoup.ui.defaultNoteColor
		};
	},
	
	
	/**
	*	Handler for getfeed: process incoming feed data.
	*	@param {object} response	the response object
	*	@param {boolean} success	true if we got a feed back
	*/
	getFeedHandler: function(response, success) {
		if (success) {
			this.setContentDiv('Feed data received.');
			var feed = Ext.util.JSON.decode(response.responseText);
			if (feed.bozo) {
				this.setContentDiv('Server reports a format error in feed data.');
				return;
			}
			this.feedname = feed.feed.title || this.notename || '';
			this.notes = {};
			this.noteidlist = [];
			for (var entry=0; entry < feed.entries.length; entry++) {
				var thenote = this.noteFromRSSEntry(feed.entries[entry]);
				this.notes[thenote.id] = thenote;
				this.noteidlist.push(thenote.id);
			}
			this.setContentDiv('');
			
			if (this.random) this.randomNote();
			else this.firstNote();
			this.running = true;
		} 
		else this.setContentDiv('Unable to fetch feed.');
	},




	handleNotePick: function(combo, record, index) {
		this.cleanupGuests();
		if (index < 0) index = this.noteidlist.length - 1;
		if (index > this.noteidlist.length-1) index = 0;
		this.targetnoteindex = index;
		this.targetnoteid = this.noteidlist[this.targetnoteindex];
		
		if (this.notes && (this.targetnoteid in this.notes)) {
			this.targetnote = this.notes[this.targetnoteid];
			this.settimer();
			this.show();
			return;
		}
		
		notesoup.postRequest({
			method:"getnote",
			params:{
				fromfolder: this.viewfolder,
				noteid: this.targetnoteid
			}
		},{
			//requestMessage: 'Fetching note...',
			successProc: this.getNoteHandler,
			successProcScope: this,
			failureMessage: 'Could not fetch note: ' + this.targetnoteid
		});
	},


	getNoteHandler: function(response, options) {
		//notesoup.say('Fetch complete.');
		//notesoup.say(response.responseText);
		var response = Ext.util.JSON.decode(response.responseText);

		if (response['error']) {
			this.targetnote = {
				notename: 'Error',
				text: '<br/><br/><center>Error fetching note: ' + response.error + '</center></br></br>',
				bgcolor: 'red'
			};
		}
		else {
			this.targetnote = response.command[0][1];
			this.settimer();
		}
		//notesoup.say('GETNOTEHANDLER: ' + notesoup.dump(this.targetnote));
		this.show();
	},


	// player control panel
	imageroot: 		notesoup.imageHost + 'images/UII_Icons/24x24/',
	previmage: 		'backward.png',
	startimage: 	'play.png',
	pauseimage: 	'pause.png',
	nextimage:		'forward.png',
	refreshimage: 	'refresh.png',
	openfolderimage:'open.png',
	settingsimage:	'configuration.png',
	snapshotimage: 	'digital_camera.png',

	imagedisplaytime: 6,
	imagecountdown: 6,

	settimer: function() {
		this.imagecountdown = this.imagedisplaytime;
	},

	ontick: function() {
		if (this.running) {
			//notesoup.say('countdown: ' + this.imagecountdown + typeof(this.imagecountdown));
			if (--this.imagecountdown <= 0) {
				this.settimer();
				//if (this.random) this.randomNote.defer(Math.random() * 2000, this);
				//else this.nextNote.defer(Math.floor(Math.random() * 2000), this);
				if (this.random) this.randomNote();
				else this.nextNote();
			}
		}
	},

	firstNote: function() {
		this.handleNotePick(null, null, 0);
	},

	prevNote: function() {
		this.handleNotePick(null, null, this.targetnoteindex-1);
	},

	nextNote: function() {
		this.handleNotePick(null, null, this.targetnoteindex+1);
	},
	
	randomNote: function() {
		this.handleNotePick(null, null, Math.floor(Math.random() * this.noteidlist.length));
	},
	
	pause: function() {
		notesoup.say('Stopped.');
		delete this.running;
		this.updateControls();
	},

	start: function() {
		notesoup.say('Starting...');
		this.running = true;
		this.updateControls();
	},
	
	openfolder: function() {
		if (this.viewfolder)
			notesoup.openFolder(this.viewfolder);
	},
	
	settings: function() {
		var f = notesoup.prompt('Enter the folder to view, or an RSS feed URL:', this.viewfolder || this.feedurl || notesoup.foldername);
		if (!f) return;

		if (f.substring(0,7) == 'feed://') {
			this.feedurl = f;
			delete this.viewfolder;
			this.save();
			this.getFeed();
		}
		else {
			this.viewfolder = f;
			delete this.feedurl;
			this.save();
			this.refreshNoteList();
		}
	},

	clone: function(obj) {
		var theclone = {};
		for (var o in obj) theclone[o] = obj[o];
		return theclone;
	},

	snapshot: function() {
		var newnote = this.clone(this.targetnote);
		delete newnote.id;
		delete newnote.homediv;
		delete newnote.xPos;
		delete newnote.yPos;
		delete newnote.zIndex;
		delete newnote.isGuest;
		notesoup.saveNote(newnote, notesoup.foldername);
	},

	makeButton: function(img, handler) {
		return ['<img src="', this.imageroot, img, '"',
			' onclick="notesoup.ui.getEnclosingNote(this).', handler, '();"/>'].join('');
	},

	renderControls: function() {
		var o = [];
		o.push('<center>');
		o.push(this.makeButton(this.settingsimage, 'settings'));
		if (this.noteidlist) {
			o.push(this.makeButton(this.previmage, 'prevNote'));

			if (this.running) o.push(this.makeButton(this.pauseimage, 'pause'));
			else o.push(this.makeButton(this.startimage, 'start'));

			o.push(this.makeButton(this.nextimage, 'nextNote'));
			o.push(this.makeButton(this.snapshotimage, 'snapshot'));
		}
		if (this.viewfolder)
			o.push(this.makeButton(this.openfolderimage, 'openfolder'));
		o.push('</center>');
		return o.join('');
	},

	updateControls: function() {
		var elt = Ext.get(this.id + '_title');
		if (elt) elt.update([
			//this.notename ? this.notename + '<hr/>' : '',
			this.renderControls()
		].join(''));
	},
	
	guestNoteName: function() {
		for (var i=0; i < 10000; i++) {
			var name = 'guest' + notesoup.randomName(10);
			if (!$(name)) return name;
		}
		notesoup.say('oops guestname');
	},
	
	cleanupGuests: function() {
		if (this.guestnotes) {
			while (this.guestnotes.length > 0) {
				var noteid = this.guestnotes.pop();
				if (noteid in notesoup.notes) {
					if (notesoup.notes[noteid].isPortableHole)
						notesoup.notes[noteid].cleanupGuests();
					notesoup.destroyNote(noteid);
				}
				else {
					if (notesoup.debugLevel > 4)
						notesoup.say('Guest already left: ' + noteid);
				}
			}
		}
	},


	xoffset: 14,
	yoffset: 38,

	onrender: function() {
		var o = [];
		var portHoleCover = {
			notename: this.renderControls(),		//'Portable Hole',
			text:[ '<br/><center>',
				'<img src="/images/UII_Icons/80x80/smiley.png" align="center" />',
				'</center><br/>'].join(''),
			bgcolor: '#ffffff'
		};
		if (this.targetnote) {
			this.cleanupGuests();
		
			//var guestnote = this.clone(this.targetnote.isPortableHole ? portHoleCover : this.targetnote);
			var guestnote = {};
			if (this.targetnote.isPortableHole && (this.viewfolder == notesoup.foldername) &&
				(this.targetnote.id == this.id)) guestnote = this.clone(portHoleCover);
			else guestnote = this.clone(this.targetnote);	
	
			guestnote.id = 'guest' + notesoup.randomName(10);
			guestnote.isGuest = true;
			guestnote.homediv = this.id + notesoup.ui.contentSuffix;

			guestnote.xPos = this.xPos + this.xoffset;
			guestnote.yPos = this.yPos + this.yoffset;
			//guestnote.xPos = Ext.get(guestnote.homediv).getX();
			//guestnote.yPos = Ext.get(guestnote.homediv).getY();

			guestnote.zIndex = this.zIndex + 1;
			notesoup.updateNote(guestnote);
			if (!this.guestnotes) this.guestnotes = [];
			this.guestnotes.push(guestnote.id);
			this.guestnoteid = guestnote.id;
		}
		this.updateControls();
	},
	

	widthOffset: 28,
	heightOffset: 70,		//92,
	minWidth: 250,
	minHeight: 80,

	syncHeight: function() {

		if (!this.targetnote) return soupnote.prototype.syncHeight.apply(this);
		var guestdiv = Ext.get(this.guestnoteid + notesoup.ui.divSuffix);
		if (!guestdiv) {
			//notesoup.say('Could not fetch guest div.', 'error');
			return;
		}
		var guestsize = guestdiv.getSize();
		guestsize.width = Math.max(guestsize.width || 0, this.minWidth);
		guestsize.height = Math.max(guestsize.height || 0, this.minHeight);
		//notesoup.say('Adjusting to guest size: ' + guestsize.width + ' ' + guestsize.height);

		var outerDiv = Ext.get(this.id + notesoup.ui.divSuffix);
		var noteDiv = Ext.get(this.id);
		var contentDiv = Ext.get(this.id + notesoup.ui.contentSuffix);
		if (!outerDiv || !contentDiv) {
			notesoup.say('No outer DIV or no content DIV.', 'error');
		}
		contentDiv.setSize(guestsize.width || notesoup.defaultNoteWidth, guestsize.height || notesoup.defaultNoteHeight, true);
		noteDiv.setSize(guestsize.width + this.widthOffset, guestsize.height + this.heightOffset, true);
		outerDiv.setSize(guestsize.width + this.widthOffset, guestsize.height + this.heightOffset, true);
	}
});
note.init();
</script>