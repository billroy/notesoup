<script type='text/javascript'>
/**
*	avatar.js - Note Soup avatar widget
*
*	Copyright 2007, 2008 Bill Roy
*	This file is licensed under the Note Soup Client License
*	See http://notesoup.net/js/LICENSE
*/
note.set({

	init: function() {
		//notesoup.say('Avatar here!', 'tell');
		if (this.isHome()) {
			this.follow = true;
			this.think("g'day!");
			// slide on down
			var maxy = 0;
			for (var n in notesoup.notes) {
				if (n == this.id) continue;
				if (notesoup.notes[n].imports == this.imports) {

					// if it was dragged out of the alley, ignore it
					if (notesoup.notes[n].xPos > 25) continue;

					var y = notesoup.notes[n].yPos;
					if (typeof(y) != 'number') y = parseInt(y);
					if (y > maxy) maxy = y;
				}
			}
			var myY = this.yPos;
			if (typeof(myY) != 'number') myY = parseInt(myY);
			if (maxy >= myY) {
				this.moveTo(12,  maxy + this.height + 12);
				notesoup.refreshAvatar.defer(500, notesoup);
			}
		}
		else {
			this.think('hi!');
			//this.draggable = false;
		}
		Ext.get(this.id).on('contextmenu', this.doMenu, this);
	},

	isHome: function() {
		return (this.username && this.clientid && notesoup.username && notesoup.pushClientID &&
			(this.username == notesoup.username) && (this.clientid == notesoup.pushClientID));
	},

	ontick: function() {
		// fidget the widget
		if (this.isHome() && (Math.random() < .05)) {
			var dx = 12;
			var dy = 3;
			this.think('fidget...');
			this.bump(Math.floor(Math.random() * dx) - dx/2,
						Math.floor(Math.random() * dy) - dy/2);
			notesoup.refreshAvatar.defer(500, notesoup);
		}
	},

	onsay: function(request) {
		if ((request.sender == this.username) && (request.clientid == this.clientid)) {
			this.think(request.data);
			return true;
		}
		return false;
	},
	
	onleave: function(request) {
		if ((request.data.username == this.username) && (request.clientid == this.clientid)) {
			notesoup.destroyNote(this.id);
			return true;
		}
		return false;
	},

	doMenu: function(e) {
		e.stopEvent();
		this.isHome() ? this.doHomeMenu(e) : this.doAwayMenu(e);
	},
	
	toggleFollow: function() {
		this.follow = !this.follow;
		this.think(this.follow ? 'Following, aye.' : 'Standing by....');
	},

	doHomeMenu: function(e) {

		var avatarHomeMenu = new Ext.menu.Menu({
			id: 'avatarHomeMenu',
			items: [
				{text: 'Dismiss', handler: function(e) {
					notesoup.removeAvatar();
				}, icon: notesoup.imageHost + 'images/famfamfam.com/user_delete.png'},
				new Ext.menu.CheckItem({
					text: 'Follow Me', 
					checked: this.follow,
					handler: this.toggleFollow,
					scope: this
				}),
				'-',
				{text: 'Say...', handler: function(e) {
					var s = prompt("What would you like to say?", '');
					if (s) notesoup.folderSay(s);
				}, icon: notesoup.imageHost + 'images/famfamfam.com/comment.png'},
				{text: 'Flash...', handler: function(e) {
					var s = prompt("Flash what?", '');
					if (s) notesoup.folderFlash(s);
				}, icon: notesoup.imageHost + 'images/famfamfam.com/sound.png'},
				{text: 'Transport Everybody to...', handler: function(e) {
					var s = prompt("Beam everybody where?", '');
					if (s) notesoup.folderSee(s);
				}, icon: notesoup.imageHost + 'images/famfamfam.com/application_go.png'},
				'-',
				{text: 'Ping', handler: function(e) {
					notesoup.folderPing();
				}, icon: notesoup.imageHost + 'images/famfamfam.com/transmit_blue.png'},
				'-',
				{text: 'Sync All', handler: function(e) {
					notesoup.folderSync();
				}, icon: notesoup.imageHost + 'images/famfamfam.com/arrow_refresh.png'},
				{text: 'Refresh All', handler: function(e) {
					notesoup.folderRefresh();
				}, icon: notesoup.imageHost + 'images/famfamfam.com/arrow_redo.png'},
				'-',
				{text: 'Remote console...', handler: function(e) {
					var s = prompt("Rcon what? (don't be a jerk)", '');
					if (s) notesoup.folderRcon(s);
				}, icon: notesoup.imageHost + 'images/famfamfam.com/eye.png'},
				'-',
				{text: 'Info...', handler: this.info, scope: this,
					icon: notesoup.imageHost + 'images/famfamfam.com/information.png'}
			]
		});
		avatarHomeMenu.showAt(e.getXY());
	},
	
	kick: function() {
		notesoup.folderSay(notesoup.username + 'is kicking ' + this.username);
		var kickstr = [
			"=if (notesoup.username == '", this.username,"') notesoup.logout();"
		].join('');
		// thrice i kick thee
		notesoup.folderRcon(kickstr);
		notesoup.folderRcon(kickstr);
		notesoup.folderRcon(kickstr);
	},

	thwack: function(whom, howlong) {
		if (!howlong) howlong = 5000;
		if (notesoup.username == whom) {
			notesoup.frontstage.show('thwack!', 'yellow');
			notesoup.frontstage.hide.defer(howlong);
		}
		else this.think('ouch!');
	},
	
	info: function() {
		return(notesoup.say(notesoup.dump(this)));
	},

	doAwayMenu: function(e) {
		var avatarAwayMenu = new Ext.menu.Menu({
			id: 'avatarAwayMenu',
			items: [{text: 'Whisper privately...', handler: function(e) {
					var msg = prompt('Whisper what to ' + this.username + '?', '');
					if (msg) notesoup.tell(this.username, msg);
				}, icon: notesoup.imageHost + 'images/famfamfam.com/comment.png'},
				{text: 'Thwack', handler: function(e) {
					notesoup.folderSay(notesoup.username + ' thwacks ' + this.username, 'warning');
					this.sendself('thwack', this.username);
				}, icon: notesoup.imageHost + 'images/famfamfam.com/home_go.png'},
				{text: 'Kick Out', handler: this.kick, scope: this,
					icon: notesoup.imageHost + 'images/famfamfam.com/home_go.png'},
				'-',
				{text: 'Info...', handler: this.info, scope: this,
					icon: notesoup.imageHost + 'images/famfamfam.com/information.png'}
			]
		});
		avatarAwayMenu.showAt(e.getXY());
	}
});
note.init();
</script>
Avatar widget is go.