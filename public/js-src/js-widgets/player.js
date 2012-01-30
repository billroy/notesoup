<script>
/**
*	player.js - Note Soup command player widget
*	Copyright 2011 by Bill Roy
*	All rights reserved.
*	{imports: '/js-src/js-widgets/player.js'}
*/
note.set({

	start: function() {
		this.starttime = new Date().toString();
		this.running = true;
		this.index = -1;
		this.timeleft = 0;
		notesoup.say('Player started: ' + this.starttime);
	},

	ontick: function() {
		if (!this.running) return;
		if (this.timeleft > 0) --this.timeleft;
		else {
			if (++this.index >= this.cmds.length) {
				delete this.running;
			}
			else {
				this.timeleft = this.cmds[this.index][0];
				window.eval(this.cmds[this.index][1]);
			}
		}
	},
	
	cmds: [
		[1, "notesoup.folderShow('Those who make');"],
		[2, "notesoup.folderShow('peaceful revolution impossible');"],
		[1, "notesoup.folderShow('make');"],
		[2, "notesoup.folderShow('violent revolution inevitable.');"],
		[2, "notesoup.folderShow('- John F. Kennedy');"],
		[1, "notesoup.folderShow('(1917-1963)');"],
		[1, "notesoup.folderShow(' ');"],
		[1, "notesoup.folderFlash(' ');"]
	]

});
</script>
<center>
<input type='submit' value='start' onclick = 'notesoup.ui.getEnclosingNote(this).start();'/>
</center>
