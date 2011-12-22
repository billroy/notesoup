<script type='text/javascript'>
/**
*	card.js - Note Soup playing card widget
*
*	Copyright 2007, 2008 Bill Roy
*	This file is licensed under the Note Soup Client License
*	See http://notesoup.net/js/LICENSE
*/
var note = notesoup.ui.getEnclosingNote(this);
note.set({
	width: 130,
	bgcolor: '#f9f9f9',
	backImage: notesoup.imageHost + 'images/cards_png/b1fv.png',	// or b2fv

	init: function() {
		if (!this.initialized) {
			this.showing = false;
			this.rank = this.pickrank();
			this.suit = this.picksuit();
			this.faceImage = notesoup.imageHost + 'images/cards_png/' + this.suit + this.rank + '.png';
			this.initialized = true;
			this.save();
		}
		else this.show();
	},

	pick: function(list) { return '' + list[Math.floor(Math.random() * list.length)]; },
	pickrank: function() { return this.pick([2,3,4,5,6,7,8,9,10,'j','q','k','1']); },
	picksuit: function() { return this.pick(['s','h','d','c']); },

	onrender: function() {
		var markup = [
			"<img style='width:100%;' src='",
				this.showing ? this.faceImage : this.backImage,
			"'/>"
		].join('');
		this.setContentDiv(markup);
	},

	face: function(upness) {
		this.showing = upness;
		this.onrender();
	},

	click: function(e) {
		this.sendself('face', !this.showing);
	}
});
Ext.get(note.id+'_content').on('click', note.click, note);
note.init();
</script>