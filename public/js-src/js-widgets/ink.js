<script type='text/javascript'>
/**
*	ink.js - Note Soup ink widget
*
*	Copyright 2007, 2008 Bill Roy
*	This file is licensed under the Note Soup Client License
*	See http://notesoup.net/js/LICENSE
*/
note.set({

	chalky: false,
	linewidth: 3,
	color: 'black',
	yoffset: 45,

	init: function(canvasname) {
		if (canvasname) this.canvasname = canvasname;
		else this.canvasname = 'backdrop';
		
		if (this.chalky) {
			this.color = 'white';
			this.linewidth = 4;
		}
	
		var canvas = document.getElementById(this.canvasname);
		var ctx = canvas.getContext('2d');
		if (ctx) {
			notesoup.say('Ink here!');
			this.setEphemeral('ctx', ctx);
		}
		else {
			notesoup.say('Ink: load failed: sorry, failed to get ctx.', 'error');
			return;
		}

		//this.yoffset = Ext.get(this.canvasname).getTop();
		Ext.get(this.canvasname).on('mousedown', this.startsegment, this);
		Ext.get(this.canvasname).on('mousemove', this.updatesegment, this);
		Ext.get(this.canvasname).on('mouseup', this.endsegment, this);
	},

	getctx: function() {
		return this.getEphemeral('ctx');
	},

	play: function(sounduri) {
		if (notesoup.sound)
			notesoup.sound.play(sounduri);
	},

	startsegment: function(e) {
		this.lastx = e.getPageX();
		this.lasty = e.getPageY() - this.yoffset;
		this.pendown = true;
		if (this.chalky) this.sendself('play', '/sound/43548__richymel__tiza.mp3');
		if (this.zIndex != this.frontZ) this.sendself('canvasfront');
	},

	endsegment: function(e) {
		delete this.pendown;
		if (notesoup.sound) notesoup.sound.stop();
		if (this.zIndex != this.backZ) this.sendself('canvasback');
	},

	frontZ: 30000,
	backZ: 0,
	setZ: function(z) {
		this.zIndex = z;
		var container = Ext.get(this.canvasname);
		if (container) {
			container.setStyle({position: 'absolute', zIndex: this.zIndex});
		}
	},
	canvasfront: function() { this.setZ(this.frontZ); },
	canvasback: function() { this.setZ(this.backZ); },

	updatesegment: function(e) {
		if (!this.pendown) return;

		var x = e.getPageX();
		var y = e.getPageY() - this.yoffset;
		if ((x == this.lastx) && (y == this.lasty)) return;
		
		var color = ((notesoup.ui.defaultNoteColor == '#FFFF99') || (notesoup.ui.defaultNoteColor == '#FFFF30'))
			? this.color : notesoup.ui.defaultNoteColor;

		this.sendself('drawline', this.lastx, this.lasty, x, y, color, this.linewidth);

		this.lastx = x;
		this.lasty = y;

	},
	
	drawline: function(x1, y1, x2, y2, color, linewidth) {
		this.getctx().beginPath();
		this.getctx().strokeStyle = color || this.color;
		this.getctx().lineWidth = linewidth || this.linewidth;
		this.getctx().moveTo(x1, y1);
		this.getctx().lineTo(x2, y2);
		this.getctx().stroke();
	},
	
	moveTo: function(x, y) { this.getctx().moveTo(x, y); },
	lineTo: function(x, y) { this.getctx().lineTo(x, y); },
	beginPath: function() { this.getctx().beginPath(); },
	closePath: function() { this.getctx().closePath(); },
	fillStyle: function(s) { this.getctx().fillStyle = s; },
	fill: function() { this.getctx().fill(); },
	strokeStyle: function(s) { this.getctx().strokeStyle = s; },
	stroke: function() { this.getctx().stroke(); },
	fillRect: function(x, y, width, height) { this.getctx().fillRect(x, y, width, height); },
	strokeRect: function(x, y, width, height) { this.getctx().strokeRect(x, y, width, height); },
	clearRect: function(x, y, width, height) { this.getctx().clearRect(x, y, width, height); },
	clear: function() { this.getctx().clearRect(0, 0, 1200, 800); },
	arc: function(x, y, radius, startAngle, endAngle, ccw) { this.getctx().arc(x, y, radius, startAngle, endAngle, ccw); },
	rect: function(x, y, width, height) { this.getctx().rect(x, y, width, height); },
	quadraticCurveTo: function(cp1x, cp1y, x, y) { this.getctx().quadraticCurveTo(cp1x, cp1y, x, y); },
	bezierCurveTo: function(cp1x, cp1y, cp2x, cp2y, x, y) { this.getctx().bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y); },

	drawImage: function(image, x, y, width, height) { this.getctx().drawImage(image, x, y, width, height); },

	fillCircle: function(x, y, radius, color) {
		this.getctx().beginPath();
		this.getctx().fillStyle = color || this.color;
		this.getctx().arc(x, y, radius, 0, 2*Math.PI, true);
		this.getctx().fill();
	},


/*****
image can be:
1. http:blah
2. data: blah
3. an element or element id
function draw() {
  var ctx = document.getElementById('canvas').getContext('2d');

  // create new image object to use as pattern
  var img = new Image();
  img.src = 'images/wallpaper.png';
  img.onload = function(){

    // create pattern
    var ptrn = ctx.createPattern(img,'repeat');
    ctx.fillStyle = ptrn;
    ctx.fillRect(0,0,150,150);

  }
}
      
var img = new Image();   // Create new Image object
img.src = 'myImage.png'; // Set source path
When this script gets executed, the image starts loading. If loading isn't finished when a drawImage statement gets executed, the script halts until the image is finished loading. If you don't want this to happen, use an onload event handler:
var img = new Image();   // Create new Image object
img.onload = function(){
  // execute drawImage statements here
}
img.src = 'myImage.png'; // Set source path
*****/

	globalAlpha: function(alpha) { this.getctx.globalAlpha = alpha; },

	snapshot: function() {
		var canvas = document.getElementById(this.canvasname);
		if (!canvas || !canvas.toDataURL) {
			notesoup.say('Sorry, this browser does not support snapshots.  Firefox is known to work.', 'warning');
			return;
		}
		var thenote = {
			notename: 'Snapshot',
			//noframe: true,
			notetype: 'proxy',
			bgcolor: this.bgcolor,
			width: this.canvaswidth,
			height: this.canvasheight,
			proxyfor: canvas.toDataURL()
		};
		notesoup.saveNote(thenote, notesoup.foldername);
	},

	clearButton: function() {
		this.sendself('clear');
	}
});
note.init();
</script>
<center>
Ink widget is here!<br/>
Click to draw on the desktop.<br/>
Toolbar sets color.<br/>
<center>
<input type='submit' value='clear' onclick = 'notesoup.ui.getEnclosingNote(this).clearButton();'/>
<input type='submit' value='snapshot' onclick = 'notesoup.ui.getEnclosingNote(this).snapshot();'/>
</center>
