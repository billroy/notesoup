<script type='text/javascript'>
/**
*	connmon.js - Note Soup connection monitor
*
*	Copyright 2007, 2008 Bill Roy
*	This file is licensed under the Note Soup Client License
*	See http://notesoup.net/js/LICENSE
*/

*/
var note = notesoup.ui.getEnclosingNote(this);
note.set({

	testinterval: '100 seconds',

	init: function() {
		notesoup.say('Hello, world!');
		this.fired = false;
		this.setContentDiv('Counting down ' + this.testinterval + '...');
	},
	
	ontick: function() {
		if (this.fired) return;
		if (notesoup.sessionTime() > notesoup.getDuration(this.testinterval)) {
			this.fired = true;

			notesoup.say('Connmon fired after ' + this.testinterval, 'tell');
			this.t1 = new Date().getTime();
			this.sendself('probe');
		}
	},
	
	probe: function() {
		notesoup.say('Connection is up: ' + Math.floor(new Date().getTime()-this.t1) + 'ms', 'tell');
	}
});
note.init();
</script>