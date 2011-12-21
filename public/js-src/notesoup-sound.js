/**
*	notesoup-sound.js - Note Soup sound interface
*
*	Copyright 2007, 2008 Bill Roy
*	This file is licensed under the Note Soup Client License
*	See http://notesoup.net/js/LICENSE
*/
var soundReady = function() {
	//notesoup.say('Sound ready.');
	notesoup.sound.start();
};

notesoup.sound = {

	id: 'notesoup.sound',

	play: function(url) {
		try {
			if (this.soundObj) {
				this.soundObj.loadSound(url, true);
				return true;
			}
		} catch(e) {
			notesoup.say('Error playing sound: ' + notesoup.dump(e));
			return false;
		}
	},

	reinit: function(msdelay) {
		this.init.defer(msdelay, this);
	},

	init: function() {

		try {
			if (!notesoup.aflax.connected) {
				if (notesoup.debugmode) notesoup.say('Sound is waiting for Push Channel...');
				this.reinit(500);
				return;
			}
			this.soundObj = new AFLAX.FlashObject(notesoup.aflax.handle, "Sound");
			if (!this.soundObj) {
				notesoup.say('oops soundObj');
				this.reinit(1000);
				return;
			}
			this.soundObj.exposeFunction("loadSound", this.soundObj);
			this.soundObj.exposeFunction("start", this.soundObj);
			this.soundObj.exposeFunction("stop", this.soundObj);
			this.soundObj.exposeProperty("position", this.soundObj);
			this.soundObj.mapFunction("addEventHandler");
			this.soundObj.addEventHandler("onLoad", "soundReady");
			if (notesoup.debugmode) notesoup.say('Sound is go.');
		} catch(e) {
			notesoup.say('pfft soundObj', 'error');
			if (!this.retryCount) this.retryCount = 1;
			else if (++this.retryCount < 10) {
				this.reinit(1000);
			}
			else notesoup.say('Error initializing sound widget: ' + ' ' + notesoup.dump(e));
		}
	},

	start: function() {
		if (!this.soundObj) {
			notesoup.say('oops start');
			return;
		}
		try {
			//notesoup.say('Starting...');
			notesoup.sound.soundObj.start();
		} catch(e) {
			notesoup.say('Error starting sound playback: ' + notesoup.dump(e));
			return;
		}
	},
	
	stop: function() {
		//notesoup.say('Stopped.');
		notesoup.sound.soundObj.stop();
	},
	
	getPosition: function() {
		return this.soundObj.getPosition();
	}
};

