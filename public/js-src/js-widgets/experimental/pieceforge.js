<script type='text/javascript'>
/**
*	pieceforge.js:	note soup game piece widget.
*
*	Copyright 2007, 2008 Bill Roy
*	This file is licensed under the Note Soup Client License
*	See http://notesoup.net/js/LICENSE
*/
note.set({

	canvaswidth: 50,
	canvasheight: 50,
	desiredwidth: 50 + (15*2),		//80
	desiredheight: 50 + (18 + 24),	//92
	bgcolor: '',

	init: function() {

		notesoup.say('Init pieceforge: ' + this.width + ' ' + this.height);

		// load bubbles
		notesoup.loadScript('/js-src/js-widgets/bubbles.js');

		//var stylespec = 'width:"' + this.canvaswidth + '";height:"' + this.canvasheight + '"';
		var stylespec = 'width:' + this.canvaswidth + '; height:' + this.canvasheight;
		notesoup.say('style spec: ' + stylespec);

		// make a canvas in this note of size x,y
		Ext.get(this.id + notesoup.ui.contentSuffix).createChild({
			tag:'canvas', 
			id: this.getFieldID('canvas'),
			//zIndex: 20000,
			//style: stylespec
			width: this.canvaswidth,
			height: this.canvasheight
		});

		this.editing = true;
			this.resizeTo(this.desiredwidth, this.desiredheight);
		delete this.editing;

		this.initCanvas();
	},

	initCanvas: function() {
		var c = $(this.getFieldID('canvas'));
		if (!c) { 
			notesoup.say('Waiting for canvas...', 'warn');
			this.initCanvas.defer(200, this);
			return;
		}
		if (typeof(bubbles) == 'undefined') {
			notesoup.say('Waiting for bubbles...', 'warn');
			this.initCanvas.defer(200, this);
			return;
		}
		notesoup.say('Pieceforge here!');
		this.draw();
	},
	
	syncHeight: function() {
		return this.slamHeight(this.desiredheight);
	},

	draw: function() {
		notesoup.say('Drawing...');
		bubbles.init(this.getFieldID('canvas'));
		bubbles.xoffset = 0;
		bubbles.yoffset = 0;
		//bubbles.drawPiece();
		bubbles.drawAnt();
		
		//this.snapshot();
	},

	snapshot: function() {
		var s = null;
		var c = $(this.getFieldID('canvas'));
		if (!c || !c.toDataURL) {
			notesoup.say('no shot');
			return;
		}
		var thenote = {
			notename: 'A Piece',
			noframe: true,
			notetype: 'proxy',
			bgcolor: this.bgcolor,
			width: this.canvaswidth,
			height: this.canvasheight,
			proxyfor: c.toDataURL()
		};
		notesoup.saveNote(thenote, notesoup.foldername);
	},
	
	makeButton: function(img, handler) {
		return ['<img src="', this.imageroot, img, '"',
			' onclick="notesoup.ui.getEnclosingNote(this).', handler, '();"/>'].join('');
	}

	

});
note.init();
</script>

