<script type='text/javascript'>
/**
*	soundboard.js - Note Soup sound board widget
*
*	Copyright 2007, 2008 Bill Roy
*	This file is licensed under the Note Soup Client License
*	See http://notesoup.net/js/LICENSE
*/

/*	These example sounds are from http://freesound.iua.upf.edu; see
*	http://freesound.iua.upf.edu/legal.php for license information.
*	Transformed to mp3 and trimmed for use here.
*	To extend this widget, provide the full url to your .mp3 audio file.
*/
note.set({
	buttons: [
		['attention', 'lime', '/sound/32304__acclivity__ShipsBell.mp3',],
		['order', 'black', '/sound/6164__NoiseCollector.mp3'],
		['warning', 'yellow', '/sound/23512__liquidhot__De_1C637C.mp3'],
		['time is up', 'red', '/sound/41344__ivanbailey__1.mp3'],
		['recess', 'lightblue', '/sound/41345__ivanbailey__2.mp3'],
		['red alert', 'red', '/sound/17468__cognito_perce_1C634D.mp3'],
		['out of order', 'purple', '/sound/46062__reinsamba__gong.mp3'],
		['adjourned', 'black', '/sound/43504__mkoenig__publ_1C660C.mp3']
	],

	fire: function(i) {
		var b = this.buttons[i];
		notesoup.sound.play(b[2]);
		notesoup.frontstage.flash(b[0], b[1]);
	},
	
	play: function(soundname) {
		for (var i=0; i < this.buttons.length; i++) {
			if (this.buttons[i][0] == soundname) {
				this.fire(i);
				return;
			}
		}
		this.fire(0);
	},

	makeButton: function(i) {
		return [
			'<input type="submit" value="', this.buttons[i][0], '"',
			' onclick="notesoup.ui.getEnclosingNote(this).sendself(\'fire\',', i, ');"/>',
			'<br/>'].join('');
	},

	onrender: function() {
		var o = [];
		for (var b=0; b<this.buttons.length; b++) {
			o.push(this.makeButton(b));
		}
		this.setContentDiv(o.join(''));
	}
});
note.show();
</script>