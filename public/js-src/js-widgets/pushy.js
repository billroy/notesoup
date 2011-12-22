<script type='text/javascript'>
/**
*	pushy.js - Note Soup push throughput test
*
*	Copyright 2007, 2008 Bill Roy
*	This file is licensed under the Note Soup Client License
*	See http://notesoup.net/js/LICENSE
*/
var note = notesoup.ui.getEnclosingNote(this);
note.set({

	count: 100,
	pokecount: 0,

	init: function() {
		notesoup.say('Pushy here!');
	},
	
	run: function(count) {
		if (count) this.count = count;
		this.pokecount = 0;
		var t1 = new Date();
		this.sendself('zap');
		for (var i=0; i < this.count; i++) {
			this.sendself('poke');
		}
		var t = new Date() - t1;
		var tps = this.count / (t/1000);
		notesoup.say(['Pushy: ', this.count, ' messages sent in ', t, ' ms = ', tps, ' tps.'].join(''));
	},


	zap: function() {
		this.pokecount = 0;
	},

	poke: function() {
		if (++this.pokecount >= this.count) {
			notesoup.say('Ding!');
		}
	},
	
	ontick: function() {
		if (this.lastcount) {
			if (this.pokecount > this.lastcount) {
				notesoup.say('Pushy: ' + this.pokecount + ' ' + (this.pokecount-this.lastcount) + '/sec', 'tell');
			}
		}
		this.lastcount = this.pokecount;
	}
});
note.init();
</script>
<center>
<input type='submit' value='100' onclick = 'notesoup.ui.getEnclosingNote(this).run(100);'/>
<input type='submit' value='250' onclick = 'notesoup.ui.getEnclosingNote(this).run(250);'/>
<input type='submit' value='1000' onclick = 'notesoup.ui.getEnclosingNote(this).run(1000);'/>
<input type='submit' value='5000' onclick = 'notesoup.ui.getEnclosingNote(this).run(5000);'/>
</center>
