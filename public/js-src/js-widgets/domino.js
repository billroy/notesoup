<script type='text/javascript'>
/**
*	domino.js - Note Soup dice / domino widget
*
*	Copyright 2007, 2008 Bill Roy
*	This file is licensed under the Note Soup Client License
*	See http://notesoup.net/js/LICENSE
*/
note.set({

	bgcolor: '#008000',

	init: function() {
		this.show();
		this.sendself.defer(1000, this, ['sync']);
	},

	backImage: notesoup.imageHost + 'images/cards_png/b1fv.png',	// or b2fv for red
	colors: ['red', 'blue', 'green'],
	ranks: [1,2,3,4,5,6],

	dominoxoffset: 150,
	dominoyoffset: 62,
	dominowidth: 98,
	dominoheight: 50,
	dominogutter: 12,
	//dominoheight: 76,
	dominocolumns: 7,

	dominoImage: function(imgname, align) {
		return [
			'<img src="', notesoup.imageHost, 'images/dice/1d6', imgname, '.jpg" ',
				' align="', (align || 'left'), '" />'
			].join('');
	},

	countdominoes: function() {
		count = 0;
		for (var n in notesoup.notes) {
			if (notesoup.notes[n].deckid == this.id) count++;
		}
		this.dominocount = count;
		return count;
	},

	makedomino: function() {
		var x = this.dominoxoffset + ((this.dominocount % this.dominocolumns) * (this.dominowidth + this.dominogutter));
		var y = this.dominoyoffset + Math.floor(this.dominocount / this.dominocolumns) * (this.dominoheight + this.dominogutter);
		//notesoup.say('Pos: ' + x + ' ' + y);

		var thedomino = this.getrandomdomino();
		if (!thedomino) return;
		 
		var dominonote = {
			id: 'domino' + notesoup.randomName(20), 
			mtime: notesoup.getServerTime(),
			rank1: thedomino.rank1,
			color1: thedomino.color1,
			rank2: thedomino.rank2,
			color2: thedomino.color2,
			deckid: this.id,
			nosave: true,
			width: this.dominowidth,
			height: this.dominoheight,
			xPos: x,
			yPos: y,
			zIndex: 0,
			bgcolor: 'orange',
			template: [
				this.dominoImage('' + this.colors[thedomino.color1] + this.ranks[thedomino.rank1], 'left'),
				this.dominoImage('vshim', 'center'),
				this.dominoImage('' + this.colors[thedomino.color2] + this.ranks[thedomino.rank2], 'right')
				].join('')
		};
		//alert(dominonote.template);
		this.sendself('showdomino', dominonote);
	},

	showdomino: function(thedomino) {
		notesoup.updateNote(thedomino);
	},

	snapdomino: function() {
		notesoup.sound.play('/sound/45813__themfish__draw_card.mp3');
		//		19244__deathpie__dominoDrop2.mp3');
	},

	deletedomino: function(dominoid) {
		notesoup.destroyNote(dominoid);
	},

	deal: function(howmany, showing) {
		this.sendself('snapdomino');
		this.countdominoes();
		while (howmany-- > 0) {
			this.makedomino(showing);
			this.dominocount++;
		}
	},

	shuffle: function() {
		notesoup.sound.play('/sound/19245__deathpie__shuffle.mp3');
		this.dominos = {};
		for (var n in notesoup.notes) {
			if (n == this.id) continue;
			if (notesoup.notes[n].deckid == this.id) {
				//notesoup.say("Deleting domino " + notesoup.notes[n].rank + ' ' + notesoup.notes[n].color);
				this.sendself('deletedomino', n);
			}
		}
	},
	
	sync: function() {
		for (var n in notesoup.notes) {
			if (n == this.id) continue;
			if (notesoup.notes[n].deckid == this.id) {
				this.sendself('showdomino', notesoup.notes[n]);
			}
		}
	},

	getrandomdomino: function() {
		return {
			color1: this.random(this.colors.length), rank1: this.random(this.ranks.length),
			color2: this.random(this.colors.length), rank2: this.random(this.ranks.length),
		};
	},

	random: function(max) { return Math.floor(Math.random() * max); },
	pick: function(list) { return '' + list[Math.floor(Math.random() * list.length)]; },

	buttons: [
		['1 up', 'deal(1);'],
		//['1 down', 'deal(1, false);'],
		['5 up', 'deal(5);'],
		//['5 down', 'deal(5, false);'],
		['shuffle', 'shuffle();']
	],

	makeButton: function(b) {
		return [
			'<input type="submit" value="', b[0], 
			'" onclick="{notesoup.ui.getEnclosingNote(this).', b[1], ';return false;}" />'
		].join('');
	},

	makeButtons: function() {
		var o = [];
		o.push('<center>');
		for (var i=0; i < this.buttons.length; i++) {
			o.push(this.makeButton(this.buttons[i]));
		}
		o.push('</center>');
		return o.join('');
	},

	onrender: function() {
		var markup = [
			//'<img style="width:100%;" src="', this.backImage, '"/>',
			this.makeButtons()
		].join('');
		this.setContentDiv(markup);
	},

	face: function(upness) {
		//notesoup.say('Click! ' + color + ' ' + rank);
		//this.showing = upness;
		//this.onrender();
	},

	click: function(e) {
		this.sendself('face', !this.showing);
	}
});
//Ext.get(note.id+'_content').on('click', note.click, note);
note.init();
</script>