<script type='text/javascript'>
/**
*	deck.js - Note Soup playing card deck widget
*
*	Copyright 2007, 2008 Bill Roy
*	This file is licensed under the Note Soup Client License
*	See http://notesoup.net/js/LICENSE
*/
var note = notesoup.ui.getEnclosingNote(this);
note.set({

	bgcolor: '#008000',

	init: function() {
		this.show();
		this.sendself.defer(1000, this, ['sync']);
	},

	backImage: notesoup.imageHost + 'images/cards_png/b1fv.png',	// or b2fv for red
	suits: ['s','h','d','c'],
	ranks: [2,3,4,5,6,7,8,9,10,'j','q','k','1'],

	cardxoffset: 150,
	cardyoffset: 50,
	cardwidth: 130,
	cardgutter: 12,
	cardheight: 76,
	cardcolumns: 7,

	makecard: function() {

		var x = this.cardxoffset + ((this.cardcount % this.cardcolumns) * (this.cardwidth + this.cardgutter));
		var y = this.cardyoffset + Math.floor(this.cardcount / this.cardcolumns) * this.cardheight;
		//notesoup.say('Pos: ' + this.cardcount + ': ' + x + ' ' + y);

		var thecard = this.getrandomcard();
		if (!thecard) return;
		 
		var cardnote = {
			id: 'card' + notesoup.randomName(20), 
			mtime: notesoup.getServerTime(),
			rank: thecard.rank,
			suit: thecard.suit,
			deckid: this.id,
			nosave: true,
			width: this.cardwidth,
			xPos: x,
			yPos: y,
			zIndex: 0,
			bgcolor: '#f9f9f9',
			notetype: 'proxy',
			proxyfor: notesoup.imageHost + 'images/cards_png/' + this.suits[thecard.suit] + this.ranks[thecard.rank] + '.png',
		};
		this.sendself('showcard', cardnote);
	},

	showcard: function(thecard) {
		notesoup.updateNote(thecard);
	},

	snapcard: function() {
		notesoup.sound.play('/sound/45813__themfish__draw_card.mp3');
		//		19244__deathpie__cardDrop2.mp3');
	},

	deletecard: function(cardid) {
		notesoup.destroyNote(cardid);
	},

	deal: function(howmany, showing) {
		this.sendself('snapcard');
		this.updatedealt();
		while (howmany-- > 0) {
			this.makecard(showing);
		}
	},

	shuffle: function() {
		notesoup.sound.play('/sound/19245__deathpie__shuffle.mp3');
		this.cards = {};
		for (var n in notesoup.notes) {
			if (n == this.id) continue;
			if (notesoup.notes[n].deckid == this.id) {
				//notesoup.say("Deleting card " + notesoup.notes[n].rank + ' ' + notesoup.notes[n].suit);
				this.sendself('deletecard', n);
			}
		}
	},
	
	sync: function() {
		for (var n in notesoup.notes) {
			if (n == this.id) continue;
			if (notesoup.notes[n].deckid == this.id) {
				this.sendself('showcard', notesoup.notes[n]);
			}
		}
	},

	updatedealt: function() {
		this.dealt = [];
		this.cardcount = 0;

		for (var s=0; s < this.suits.length; s++) {
			this.dealt[s] = [];
			for (var r=0; r < this.ranks.length; r++) this.dealt[s][r] = false;
		}

		for (var n in notesoup.notes) {
			if (notesoup.notes[n].deckid == this.id) {
				this.cardcount++;
				this.dealt[notesoup.notes[n].suit][notesoup.notes[n].rank] = true;
			}
		}
		//notesoup.say('Dealt: ' + this.cardcount);
	},

	getrandomcard: function() {
		var cardsleft = this.suits.length * this.ranks.length - this.cardcount;
		if (cardsleft <= 0) {
			notesoup.say('No cards left to deal.  Shuffle to start again.', 'error');
			return null;
		}
		var cardpicked = this.random(cardsleft);
		//notesoup.say('Picked card ' + cardpicked + ' of ' + cardsleft);

		for (var s=0; s < this.suits.length; s++) {
			for (var r=0; r < this.ranks.length; r++) {
				if (this.dealt[s][r]) continue;
				if (--cardpicked < 0) {
					this.dealt[s][r] = true;
					this.cardcount++;
					return {suit: s, rank: r};
				}
				//else notesoup.say('Skipping card ' + s + ' ' + r);
			}
		}
		notesoup.say('oops dealbot broke');
		return null;
	},


	random: function(max) { return Math.floor(Math.random() * max); },
	pick: function(list) { return '' + list[Math.floor(Math.random() * list.length)]; },
	picksuit: function() { return random(4); },
	pickrank: function() { return random(13); },

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
			'<img style="width:100%;" src="', this.backImage, '"/>',
			this.makeButtons()
		].join('');
		this.setContentDiv(markup);
	},

	face: function(upness) {
		//notesoup.say('Click! ' + suit + ' ' + rank);
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