<script type='text/javascript'>
/**
*	sound.js - Note Soup sound widget
*
*	Copyright 2007, 2008 Bill Roy
*	This file is licensed under the Note Soup Client License
*	See http://notesoup.net/js/LICENSE
*/
note.set({

	init: function() {
		notesoup.say('Sound widget here.');
		try {
			var soundObj = new AFLAX.FlashObject(notesoup.aflax.handle, "Sound");
			soundObj.exposeFunction("loadSound", soundObj);
			soundObj.exposeFunction("start", soundObj);
			soundObj.exposeFunction("stop", soundObj);
			soundObj.exposeProperty("position", soundObj);
			soundObj.mapFunction("addEventHandler");
			soundObj.addEventHandler("onLoad", "readyToPlay");
			soundObj.loadSound('/sound/41344__ivanbailey__1.wav', true);
			this.setEphemeral('soundObj', soundObj);
		} catch(e) {
			notesoup.say('Error initializing sound widget: ' + notesoup.dump(e));
			return;
		}

		this.load('/sound/41344__ivanbailey__1.wav');
	},

	getSoundObj: function() {
		return this.getEphemeral('soundObj');
	},
	
	load: function(filename) {
		notesoup.say('Loading sound file: ' + filename);
		this.getSoundObj().loadSound(filename, true);
	},

	readyToPlay: function() {
		notesoup.say('Ready.');
		this.start();
	},
	
	start: function() {
		notesoup.say('Starting...');
		this.getSoundObj().start();
	},
	
	stop: function() {
		notesoup.say('Stopped.');
		this.getSoundObj().stop();
	},
	
	getPosition: function() {
		return this.getSoundObj().getPosition();
	}
});
note.init();
</script>