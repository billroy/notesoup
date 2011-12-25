<script>
/**
*	timer2.js - Note Soup timer widget
*
*	Copyright 2007-2011 Bill Roy
*	This file is licensed under the Note Soup Client License
*	See http://notesoup.net/js/LICENSE
*/
self.set({

	start: function() {
		this.starttime = new Date().toString();
		this.running = true;
		this.save();
		notesoup.say('Timer started: ' + this.starttime);
	},

	ontick: function() {
		if (!this.running) return;
		this.setContentDiv([
			'<center>', '<h2>', 
				notesoup.stringifyTimeDiff(new Date() - Date.parse(this.starttime)), 
				'</h2><br/>',
				'<h5>since ', this.starttime, '</h5>',
			'</center>'
		].join(''));
	}
});
</script>
<center>
<input type='submit' value='start' onclick = 'notesoup.ui.getEnclosingNote(this).start();'/>
</center>
