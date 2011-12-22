/**
*	bubbles.js - Note Soup bubbles
*
*	Copyright 2007, 2008 Bill Roy
*	This file is licensed under the Note Soup Client License
*	See http://notesoup.net/js/LICENSE
*/
var bubbles = {

	maxNumBubbles: 50,
	maxBubblesPerString: 100,
	rmin: 5,
	rmax: 5,
	xmin: 72,
	ymin: 72,
	xmax: 800,
	ymax: 400,
	xoffset: 200,
	yoffset: 200,
	count: 1,
	bubblecount: 0,
	
	init: function(homediv) {

		homediv = homediv || 'backdrop';
		this.canvas = document.getElementById(homediv);
		this.ctx = this.canvas.getContext('2d');
		if (this.ctx) notesoup.say('Bubbles here!');
		else {
			notesoup.say('Bubbles: load failed: sorry, failed to get ctx.');
			return;
		}
		this.colors = this.colorspm;

		return;



		//this.drawPanel(this.numBubbles);

		//for (var s = 0; s < 6; s++) {
		//	this.drawSegment(25, this.getColor());
		//}

		//document.body.style.background = this.getColor();
		this.drawCutLines();
		//this.bubbler();
		
		for (var i=Math.random() * 15; i > 0; i--)
		//if (Math.random() < 0.1)
			//this.drawDroid(undefined, 1.0);
			//this.drawDog(undefined, 1.0);
			this.drawOcto(undefined, 1.0);
	
		this.drawBigOcto();
		//this.drawBeerBubbles();
		//this.drawBeerBubbles();
		//this.drawBeerBubbles();

		//this.splat();

		//this.drawSun();
		this.animate();

	},

	clear: function() {
		this.ctx.clearRect(0, 0, 1200, 800);
	},

	bubbler: function() {
		//this.clear();
		this.numBubbles = Math.sqrt(Math.random() * (this.maxNumBubbles^2));
		this.count = 0;
		while (++this.count <= this.numBubbles) {
			this.drawSegment(this.getPos(), this.getPos(), Math.random() * this.maxBubblesPerString, this.getColor());
			this.rmax++;
		}
		//window.setTimeout('bubbles.bubbler();', 3);
	},

	// grayscale fun
	colorsgrayscale: [
		'#101010',
		'#202020',
		'#303030',
		'#404040',
		'#505050',
		'#606060',
		'#707070',
		'#808080',
		'#909090',
		'#a0a0a0',
		'#b0b0b0',
		'#c0c0c0',
		'#d0d0d0',
		'#e0e0e0',
		'#f0f0f0'
	],

	// from Piet Mondrian Pumpkin
	colorspm: [
		'#fe0000',	//red
		'#0404a2',	//blue
		'#fffc3b',	//yelo
		'#fefefe',	//wht
		'#1c1412',	// black
				'#00a050',	// light green
				'#5d4db8',	// alt blue-purple
		'#c0c0c0'	// gray
	],

	colors33: [
		'#5d4db8',	// alt blue-purple
		'#3de6f9'	// teal, 
	],

	// from Chatfield State Bark 2007 Balloon Fiesta	
	colorschatfield: [
		'#2856c5',	// royal blue
		'#ff002c',	// energizer pink
		'#d62f34',	// orangey
		'#9c6dad',	// purple
		'#66bf61',	// lime
		'#fff364',		// melo yelo
		'#726269',	// grayblk
		'#fedfbf',	// whitish
		'#726389'	// purp2
	],

	// from Stapleton Cows 2006
	colorsstaplecows: [
		'#4040f0',	// light blue
		'#00a050',	// light green
		'#404090',	// dark blue
		'#fafa14',	// yellow, take 2	'#e0a010'	// yellow
		'#c400ae'	// magenta
	],

	getColor: function() {
		return this.colors[Math.floor(Math.random()*this.colors.length)];
	},
	getPos: function() {
		return Math.random() * 500;
	},

	getbgColor: function() {
		return this.getGradientColor(this.count, this.numBubbles);
	},

	getGradientColor: function(val, max) {
		//return '#ffffff';
		var p = Math.floor((val / max)*240);
		var d1 = Math.floor(p/16);
		var d2 = p % 16;
		var d = '0123456789ABCDEF';
		var dd = '' + d.charAt(d1) + d.charAt(d2);
		var bg = '#' + dd + dd + dd;
		return bg;
	},
	
	drawPanel: function(number) {

		var segment = this.openSaveSegment();

		for (var b = 0; b < number; b++) {
			var r = (Math.random() * (this.rmax - this.rmin)) + this.rmin;
			if (r % 2) r++;
			this.drawBubble(this.getPos(), this.getPos(), 
				r, this.getbgColor(), r-3, this.getColor(), 0, segment);
		}
		this.drawSegment(50);
	},


	drawSegment: function(x, y, number, color) {
		//var x = this.getPos();
		//var y = this.getPos();
		var theta = (Math.random() * (Math.PI/2));// + (3.14159/2);
		var bgcolor = this.getbgColor();
		var r = Math.sqrt(Math.random() * ((this.rmax - this.rmin)^2)) + this.rmin;
		return this.drawSegmentWorker(x, y, number, color, theta, bgcolor, r, 0.2);
	},

	drawSegmentWorker: function(x, y, number, color, theta, bgcolor, r, fork, decay) {

		var segment = this.openSaveSegment();

		for (var b = 0; b < number; b++) {
			//r += (Math.random() - 0.5) * (r/2);
			r *= decay ? decay : .9;
			if (r < 1) continue;
			
			x += r * Math.cos(theta);
			y += r * Math.sin(theta); 
			
			//var dx = x - (this.xmax/2);
			//var dy = y - (this.ymax/2);
			//var d = Math.sqrt(dx*dx + dy*dy);
			//if (d > (this.ymax/2)) break;

			this.drawBubble(x, y, r, bgcolor, r-1, color, theta, segment);

			theta += ((Math.random() - 0.5) * (3.14159/2));
			x += r * Math.cos(theta);
			if ((x > this.xmax) || (x < 0)) break;//{alert('xbreak ' + x); break;}

			y += r * Math.sin(theta); 
			if ((y > this.ymax) || (y < 0)) break;//{alert('ybreak ' + y); break;}

			if (Math.random() < fork) 
				this.drawSegmentWorker(x, y, Math.floor((number-b)/3), color, theta, bgcolor, r, fork);
		}
	},

	recording: 1,
	savelist: [],
	nextfreeseg:0,

	openSaveSegment: function() {
		var f = this.nextfreeseg++;
		this.savelist[f] = [];
		return f;
	},
	
	saveBubble: function(xraw, yraw, orad, ocolor, irad, icolor, theta, segment) {
		if (!this.recording) return;
		this.savelist[segment].push({
			'x': xraw, 'y': yraw, 'orad':orad, 'ocolor':ocolor, 'irad':irad, 'icolor':icolor, 'theta':theta
		});
	},
	
	animate: function(scale) {
		scale = scale || 1.0;
		this.ctx.clearRect(0, 0, 1200, 800);
		this.ctx.scale(scale, scale);
		var r = this.recording;
		this.recording = false;
		for (var seg = 0; seg < this.savelist.length; seg++) {
			var offset = (Math.random() - 0.5) * (Math.PI/10);
			for (var bubble = 0; bubble < this.savelist[seg].length; bubble++) {
				var b = this.savelist[seg][bubble];
				var b0 = {};
				if (bubble > 0) {
					b0 = this.savelist[seg][bubble-1];
					if (Math.random() > .05) {
						b0.theta += (Math.random() - 0.5) * (Math.PI/10) + offset;
						//b.theta = (b.theta + b0.theta)/2;
					}
					b.x = b0.x + (b0.orad + b.orad) * Math.cos(b0.theta);
					b.y = b0.y + (b0.orad + b.orad) * Math.sin(b0.theta);
				}
				this.drawBubble(b.x, b.y, b.orad, b.ocolor, b.irad, b.icolor, b.theta, -1);
				//this.drawBubble(b.x, b.y, b.orad, b.ocolor, b.irad, '#ff0000'/*b.icolor*/, b.theta, -1);
			}
		}
		this.recording = r;
		window.setTimeout('bubbles.animate()', 20);
	},
	
	drawBubble: function(xraw, yraw, orad, ocolor, irad, icolor, theta, segment) {
		var x = xraw + this.xoffset;
		var y = yraw + this.yoffset;
		++this.bubblecount;

		this.saveBubble(xraw, yraw, orad, ocolor, irad, icolor, theta, segment);
	
		var d = (orad - irad) / 2;

		this.ctx.beginPath();
		this.ctx.fillStyle = ocolor;
		this.ctx.arc(x, y, orad, 0, Math.PI*2, true);
		this.ctx.fill();

		this.ctx.beginPath();
		this.ctx.fillStyle = icolor;
		this.ctx.arc(x, y, irad, 0, Math.PI*2, true);
		this.ctx.fill();

		if (orad > 2) {
			this.ctx.beginPath();
			//this.ctx.fillStyle = '#e0e0e0';
			//this.ctx.fillStyle = '#f04040';
			//this.ctx.fillStyle = '#40f040';
			this.ctx.fillStyle = '#f0f020';
			var sr = Math.max(1, orad/10);
			this.ctx.arc(x-irad/2, y-irad/2, sr, 0, Math.PI*2, true);
			this.ctx.fill();
		}
	},

	drawLine: function(x1, y1, x2, y2) {
		this.ctx.moveTo(x1, y1);
		this.ctx.lineTo(x2, y2);
	},
	
	drawCutLines: function() {
		var dx = this.xoffset;
		var dy = this.yoffset;
		var lx = dx * 0.5;
		var ly = dy * 0.5;

		this.ctx.beginPath();
		this.ctx.strokeStyle = '#202020';
		this.drawLine(dx, 0, dx, ly); this.drawLine(0, dy, lx, dy);
		this.drawLine(dx+this.xmax, 0, dx+this.xmax, ly); this.drawLine(dx+this.xmax+dx, dy, dx+this.xmax+dx-lx, dy);
		this.drawLine(0, dy+this.ymax, lx, dy+this.ymax); this.drawLine(dx, dy+this.ymax+dy, dx, dy+this.ymax+dy-ly);
		this.drawLine(dx+this.xmax+dx, dy+this.ymax, dx+this.xmax+dx-lx, dy+this.ymax); 
		this.drawLine(dx+this.xmax, dy+this.ymax+dy, dx+this.xmax, dy+this.ymax+dy-ly);
		this.ctx.stroke();
	},
	
	splat: function() {
		if (!this.splatx) {
			this.splatx = 400;
			this.splaty = 200;
		}
		var segment = this.openSaveSegment();
		this.drawBubble(this.splatx, this.splaty++, 10, '#ff0000', 9, '#00ff00', 0, segment);
		window.setTimeout('bubbles.splat();', 10);
	},
	
	drawDroid: function(color, scale) {
		scale = scale || 1.0;
		var x = this.getPos();
		var y = this.getPos();
		var theta = Math.PI/2 + (Math.random() - 0.5) * Math.PI/2;
		var bgcolor = color || this.getColor();

		this.ctx.save();
		this.ctx.scale(scale, scale);

		var headradius = 12;
		var torsoradius = 16;
		this.drawBubble(x, y, headradius, '#ffffff', headradius-1, bgcolor, 0, this.openSaveSegment());
		var dx = (headradius+torsoradius) * Math.cos(theta);
		var dy = (headradius+torsoradius) * Math.sin(theta);
		x += dx; y += dy;

		var armradius = 6;
		var armsegments = 4;
		this.drawSegmentWorker(x, y, armsegments, bgcolor, theta+(Math.PI/2), '#ffffff', armradius, 0.0);
		this.drawSegmentWorker(x, y, armsegments, bgcolor, theta-(Math.PI/2), '#ffffff', armradius, 0.0);

		this.drawBubble(x, y, torsoradius, '#ffffff', torsoradius-1, bgcolor, 0, this.openSaveSegment());

		x += torsoradius * Math.cos(theta);
		y += torsoradius * Math.sin(theta);
		var legradius = 8;
		var legsegments = 4;
		this.drawSegmentWorker(x, y, legsegments, bgcolor, theta+(Math.PI/4), '#ffffff', legradius, false);
		this.drawSegmentWorker(x, y, legsegments, bgcolor, theta-(Math.PI/4), '#ffffff', legradius, false);

		this.ctx.restore();

	},

	drawDog: function(x, y, color, scale) {
		scale = scale || 1.0;
		var x = x || this.getPos();
		var y = y || this.getPos();
		//var theta = Math.PI/2 + (Math.random() - 0.5) * Math.PI/2;
		var theta = Math.PI/4 + (Math.random() - 0.5) * Math.PI/2;
		var bgcolor = color || this.getColor();

		this.ctx.save();
		this.ctx.scale(scale, scale);

		var headradius = 8;
		var noseradius = 4;
		var torsoradius = 10;

		var nosex = x + (headradius+noseradius*0) * Math.cos(theta + Math.PI *.75 + (Math.random()-0.5) * Math.PI/2);
		var nosey = y + (headradius+noseradius*0) * Math.sin(theta + Math.PI *.75 + (Math.random()-0.5) * Math.PI/2);
		this.drawBubble(nosex, nosey, noseradius, '#ffffff', noseradius-1, bgcolor, 0, this.openSaveSegment());	//nose
		this.drawBubble(x, y, headradius, '#ffffff', headradius-1, bgcolor, 0, this.openSaveSegment());	//head

		var t1x = x + (headradius+torsoradius) * Math.cos(theta);
		var t1y = y + (headradius+torsoradius) * Math.sin(theta);

		theta -= Math.PI/4;
		var t2x = t1x + (torsoradius+torsoradius) * Math.cos(theta);
		var t2y = t1y + (torsoradius+torsoradius) * Math.sin(theta);

		var armradius = 6;
		var armsegments = 3;
		this.drawSegmentWorker(t1x, t1y, armsegments, bgcolor, theta+(Math.PI/2), '#ffffff', armradius, 0.0);
		this.drawSegmentWorker(t1x, t1y, armsegments, bgcolor, theta+(3*Math.PI/4), '#ffffff', armradius, 0.0);

		this.drawSegmentWorker(t2x, t2y, armsegments, bgcolor, theta+(Math.PI/2), '#ffffff', armradius, 0.0);
		this.drawSegmentWorker(t2x, t2y, armsegments, bgcolor, theta+(3*Math.PI/4), '#ffffff', armradius, 0.0);

		this.drawBubble(t1x, t1y, torsoradius, '#ffffff', torsoradius-1, bgcolor, 0, this.openSaveSegment());	//t1
		this.drawBubble(t2x, t2y, torsoradius-2, '#ffffff', torsoradius-1, bgcolor, 0, this.openSaveSegment());	//t2

		var tailradius = 2;
		var tailsegments = 10;
		theta -= Math.PI/4;
		var tailx = t2x + (torsoradius) * Math.cos(theta);
		var taily = t2y + (torsoradius) * Math.sin(theta);
		//this.drawBubble(tailx, taily, tailradius, '#ffffff', tailradius-1, bgcolor);	//tail
		//this.drawSegmentWorker(tailx, taily, tailsegments, bgcolor, theta+(3*Math.PI/4), '#ffffff', tailradius, 0.0);
		this.drawSegmentWorker(tailx, taily, tailsegments, bgcolor, theta-(Math.PI/4), bgcolor, tailradius, 0.0);
		this.ctx.restore();

	},



	drawOcto: function(color, scale) {
		scale = scale || 1.0;
		var x = this.getPos();
		var y = this.getPos();
		//var theta = Math.PI/2 + (Math.random() - 0.5) * Math.PI/2;
		var theta = Math.PI/2;
		var dtheta = Math.PI/10;
		var bgcolor = color || this.getColor();

		this.ctx.save();
		this.ctx.scale(scale, scale);

		var headradius = 16;
		var numtentacles = 6;
		var tentaclesegments = 25;
		var halftentacles = 4;
		var tentacleradius = 6;

		var armtheta = theta - ((numtentacles/2) + .5) * dtheta;
		var arm = 0;
		while (arm++ < numtentacles) {
			this.drawSegmentWorker(
				//x + (headradius-tentacleradius) * Math.cos(armtheta),
				//y + (headradius-tentacleradius) * Math.sin(armtheta),
				x,// + (headradius-tentacleradius) * Math.cos(armtheta),
				y,// + (headradius-tentacleradius) * Math.sin(armtheta),
				Math.random() * tentaclesegments, 
				bgcolor, 
				armtheta + (Math.random() * Math.PI/4), 
				'#ffffff', 
				tentacleradius, 
				0.0);
			armtheta += dtheta;
		}

		this.drawBubble(x, y, headradius, '#ffffff', headradius-1, bgcolor, 0, this.openSaveSegment());	//head
		this.ctx.restore();

	},
	
	drawBeerBubbles: function() {
		var beerbubblecount = 50;
		var beerbubblesize = 4;

		this.drawSegmentWorker(
			this.getPos(), this.getPos(),
			Math.random() * beerbubblecount,
			'#f0f0f8', 
			3 * Math.PI/2, 
			'#00FF00', 
			beerbubblesize, 
			0.5);
	},

	drawBigOcto: function(color, scale) {
		scale = scale || 1.0;
		var x = 200;		//this.getPos();
		var y = 50;		//this.getPos();
		//var theta = Math.PI/2 + (Math.random() - 0.5) * Math.PI/2;
		var theta = Math.PI/2;
		var dtheta = Math.PI/10;
		var bgcolor = '#010101';//f0f0f7';	// color || this.getColor();
		var outercolor = '#202020';	//'#fa1010'

		this.ctx.save();
		this.ctx.scale(scale, scale);

		var headradius = 60;
		var numtentacles = 8;
		var tentaclesegments = 150;
		var halftentacles = 4;
		var tentacleradius = 10;

		var armtheta = theta - ((numtentacles/2) + .5) * dtheta;
		var arm = 0;
		while (arm++ < numtentacles) {
			armtheta = Math.PI/2 + (Math.random() - 0.5) * Math.PI/3;
			this.drawSegmentWorker(
				x + (headradius-tentacleradius) * Math.cos(armtheta),
				y + (headradius-tentacleradius) * Math.sin(armtheta),
				Math.random() * tentaclesegments, 
				this.getGradientColor(arm, numtentacles), 
				armtheta,	//Math.PI/2 + (Math.random()-.5) * Math.PI/4,
				outercolor,	//'#f02020',	//'#ffffff', 
				tentacleradius, 
				0.1,
				0.95);
			armtheta += dtheta;
		}
		this.drawBubble(x, y, headradius, '#f0f8f8', headradius-1, bgcolor, 0, this.openSaveSegment());	//head
		this.ctx.restore();
	},
	
	drawSun: function(color, scale) {
		scale = scale || 1.0;
		var x = 300;		//this.getPos();
		var y = 200;		//this.getPos();
		//var theta = Math.PI/2 + (Math.random() - 0.5) * Math.PI/2;
		var theta = Math.PI/2;
		
		var bgcolor = color || '#f0f080';//f0f0f7';	// color || this.getColor();
		var outercolor = '#202020';	//'#fa1010'

		//document.body.style.background = '#5070d0';
		var t1 = new Date();
		this.ctx.save();
		this.ctx.scale(scale, scale);

		var sunradius = 120;	
		var numrays = 15;			// 100/50 is nice
		var raysegments = 50;
		var rayradius = sunradius/20;
		var dtheta = (2*Math.PI)/numrays;
		var theta = 0;
		while (theta <= 2*Math.PI) {
			this.drawSegmentWorker(
				x + (sunradius-(2*rayradius)) * Math.cos(theta),
				y + (sunradius-(2*rayradius)) * Math.sin(theta),
				Math.random() * raysegments, 
				bgcolor,	//this.getGradientColor(arm, numtentacles), 
				Math.random() * 2 * Math.PI,
				outercolor,	//'#f02020',	//'#ffffff', 
				rayradius, 
				0.2,
				0.95);
			theta += dtheta;
		}
		
		this.drawBubble(x, y, sunradius, bgcolor, sunradius-1, bgcolor, 0, this.openSaveSegment());	//head
		this.ctx.restore();

		var t = new Date() - t1;
		window.status = '' + t + ' ' + this.bubblecount + ' ' + this.bubblecount/t;
	},


	drawAnt: function(x, y, color, scale) {
		scale = scale || 1.0;
		var x = x || this.getPos();	//25;	//this.getPos();
		var y = y || this.getPos();	//10;	//this.getPos();
		var theta = Math.PI/2;	///2 + (Math.random() - 0.5) * Math.PI/2;
		var bgcolor = 'black' || this.getColor();
		var fgcolor = 'brown';
		
		this.ctx.save();
		this.ctx.scale(scale, scale);

		var headradius = 8;
		var thoraxradius = 6;
		var abdomenradius = headradius;

		var antennaradius = 3;
		var antennasegments = 8;
		this.drawSegmentWorker(x, y, antennasegments, bgcolor, theta-Math.PI-(Math.PI/4), fgcolor, antennaradius, 0.0);
		this.drawSegmentWorker(x, y, antennasegments, bgcolor, theta-Math.PI+(Math.PI/4), fgcolor, antennaradius, 0.0);

		this.drawBubble(x, y, headradius, fgcolor, headradius-1, bgcolor, 0, this.openSaveSegment());
		var dx = (headradius+thoraxradius) * Math.cos(theta);
		var dy = (headradius+thoraxradius) * Math.sin(theta);
		x += dx; y += dy;		

		var legradius = 3;
		var legsegments = 4;
		this.drawSegmentWorker(x, y, legsegments, bgcolor, theta+(Math.PI/2), fgcolor, legradius, 0.0);
		this.drawSegmentWorker(x, y, legsegments, bgcolor, theta+(Math.PI/2)+Math.PI/6, fgcolor, legradius, 0.0);
		this.drawSegmentWorker(x, y, legsegments, bgcolor, theta+(Math.PI/2)-Math.PI/6, fgcolor, legradius, 0.0);
		this.drawSegmentWorker(x, y, legsegments, bgcolor, theta-(Math.PI/2), fgcolor, legradius, 0.0);
		this.drawSegmentWorker(x, y, legsegments, bgcolor, theta-(Math.PI/2)+Math.PI/6, fgcolor, legradius, 0.0);
		this.drawSegmentWorker(x, y, legsegments, bgcolor, theta-(Math.PI/2)-Math.PI/6, fgcolor, legradius, 0.0);

		this.drawBubble(x, y, thoraxradius, fgcolor, thoraxradius-1, bgcolor, 0, this.openSaveSegment());

		x += (thoraxradius+abdomenradius) * Math.cos(theta);
		y += (thoraxradius+abdomenradius) * Math.sin(theta);
		this.drawBubble(x, y, abdomenradius, fgcolor, abdomenradius-1, bgcolor, 0, this.openSaveSegment());
		this.ctx.restore();
	},


	/** 
	*	draw an ellipse centered at x1,y1
	*/
	drawEllipse: function(x, y, rx, ry, icolor, ocolor, highlight) {
	
		this.drawBoundedEllipse(x-rx, y-ry, x+rx, y+ry, ocolor);

		var rx1 = rx-1;
		var ry1 = ry-1;
		this.drawBoundedEllipse(x-rx1, y-ry1, x+rx1, y+ry1, icolor);

		if (highlight) {
			var hx = x - (rx/2);
			var hy = y + (ry/2);
			var hr = 1;
			this.drawBoundedEllipse(hx-hr, hy-hr, hx+hr, hy+hr, '#f0f020');
		}
	},

	/** 
	*	draw an ellipse bounded in x1,y1..x2,y2
	*	from http://canvaspaint.org/blog/
	*	x1,y1 .. x2,y2 is the bounding box
	*/
	drawBoundedEllipse: function(x1raw, y1raw, x2raw, y2raw, color) {

		var x1 = x1raw + this.xoffset;
		var y1 = y1raw + this.yoffset;
		var x2 = x2raw + this.xoffset;
		var y2 = y2raw + this.yoffset;

		var scale = 1.0;

		var KAPPA = 4 * ((Math.sqrt(2) -1) / 3);
		
		var rx = (x2-x1)/2;
		var ry = (y2-y1)/2;
		
		var cx = x1+rx;
		var cy = y1+ry;

		this.ctx.save();
		this.ctx.scale(scale, scale);
	
		this.ctx.beginPath();
		this.ctx.moveTo(cx, cy - ry);
		this.ctx.fillStyle = color;
		this.ctx.bezierCurveTo(cx + (KAPPA * rx), cy - ry,  cx + rx, cy - (KAPPA * ry), cx + rx, cy);
		this.ctx.bezierCurveTo(cx + rx, cy + (KAPPA * ry), cx + (KAPPA * rx), cy + ry, cx, cy + ry);
		this.ctx.bezierCurveTo(cx - (KAPPA * rx), cy + ry, cx - rx, cy + (KAPPA * ry), cx - rx, cy);
		this.ctx.bezierCurveTo(cx - rx, cy - (KAPPA * ry), cx - (KAPPA * rx), cy - ry, cx, cy - ry);
		this.ctx.fill();
	},

	drawPiece: function(color, scale) {
		scale = scale || 1.0;
		var x = this.getPos();	//25;	//this.getPos();
		var y = this.getPos();	//40;	//this.getPos();
		var theta = Math.PI/2;		// + (Math.random() - 0.5) * Math.PI/2;
		//var bgcolor = notesoup.ui.getRandomColor();	
		var bgcolor = this.getColor();
		var fgcolor = 'gray';//bgcolor;		//'black';

	notesoup.say('drawing piece ' + x + ' ' + y);

		
		this.ctx.save();
		this.ctx.scale(scale, scale);

		var headradius = 8;		//	4 + Math.floor(Math.random() * 6);
		var necksegments = 1 + Math.floor(Math.random() * 6);	// 3
		var neckradius = necksegments+1;
		var footradiusx = 12;	//headradius + 2;		//16;
		var footradiusy = 6;

		this.drawEllipse(x, y, footradiusx, footradiusy, bgcolor, fgcolor);
		y -= neckradius * 1.5;

		for (var i=0; i < necksegments; i++) {
			this.drawBubble(x, y, neckradius, fgcolor, neckradius-1, bgcolor, 0, this.openSaveSegment());
			y -= (neckradius+neckradius-2);
			neckradius--;
		}
		y -= (headradius-neckradius);
		this.drawBubble(x, y, headradius, fgcolor, headradius-1, bgcolor, 0, this.openSaveSegment());

		if (this.canvas.toDataURL)
			notesoup.print(this.canvas.toDataURL());

		this.ctx.restore();
	},
	
	drawTree: function(color, scale) {
		scale = scale || 1.0;
		var x = 200;	//this.getPos();	//25;	//this.getPos();
		var y = 190;	//this.getPos();	//40;	//this.getPos();
		//var bgcolor = notesoup.ui.getRandomColor();	
		//var bgcolor = 'white';	//this.getColor();
		var bgcolor = this.getColor();
		var fgcolor = 'darkgreen';	//'gray';//bgcolor;		//'black';

		this.ctx.save();
		this.ctx.scale(scale, scale);

		var ymin = 20;
		for (var y = 220; y > ymin; y=y-1) {
			var offset = Math.random() * Math.PI / 2
			var branchsegments = Math.floor(Math.sqrt(y));
			var branchradius = branchsegments/2;
			var bgcolor = this.getColor();
			//theta = (1/4) * Math.PI + offset;
			if (Math.random() > .5) theta = 0 + Math.random() * Math.PI/4;
			else theta = Math.PI - Math.random() * Math.PI/4;
			this.drawSegmentWorker(x, y, branchsegments, fgcolor, theta, bgcolor, branchradius, 0, 0.85);
		}
		
		var starradius = 4;
		var starrays = 7;
		var raysegments = 8;
		var rayradius = 2;
		for (i=0; i < starrays; i++) {
			this.drawSegmentWorker(x, ymin-starradius, raysegments, 'white', 
				(i/starrays) * Math.PI * 2, 'yellow', rayradius, 0.5, 0.9);
		}
		this.drawBubble(x, ymin-starradius, starradius, 'yellow', starradius-1, 'yellow', 0, this.openSaveSegment());
		
		this.ctx.restore();
	},
	
	draw1D6: function(value, x, y, color, scale) {
		var dotpos = [
			[3],			[0,6],			[0,3,6],
			[0,2,4,6],		[0,2,3,4,6],	[0,1,2,4,5,6]
		];
		var dotoffsets = [
			[-1, -1],	[0, -1],	[+1, -1],
						[0, 0],
			[-1, +1],	[0, +1],	[+1, +1]
		];

		value = value ? (value-1) : Math.floor(Math.random() * 6);
		scale = scale || 1.0;
		var x = x || this.getPos();
		var y = y || this.getPos();
		var bgcolor = 'gray';
		var fgcolor = color || this.getColor();
		//var fgcolor = 'white';

		this.ctx.save();
		this.ctx.scale(scale, scale);

		var dotoffset = 10;
		var dotradius = 5;
		var dotlist = dotpos[value];
		for (d=0; d < dotlist.length; d++) {
			var dotx = x + (dotoffset * dotoffsets[dotlist[d]][0]);
			var doty = y + (dotoffset * dotoffsets[dotlist[d]][1]);
			//notesoup.say('Dot! ' + value + ' ' + dotx + ' ' + doty);
			this.drawBubble(dotx, doty, dotradius, bgcolor, dotradius-1, fgcolor, 0, this.openSaveSegment());
		}
		this.ctx.restore();
	},
	
	dotoffset: 24,
	dieoffset:50,
	dielinecolor: 'gray',

	dieGridH: function(i) {
		this.ctx.strokeStyle = this.dielinecolor;
		this.drawLine(this.xoffset-this.dotoffset, this.yoffset + (i*this.dieoffset) - this.dotoffset, 
						this.xoffset-this.dotoffset + 6*this.dieoffset,this.yoffset + (i*this.dieoffset) - this.dotoffset);
		this.ctx.stroke();
	},

	dieGridV: function(i) {
		this.ctx.strokeStyle = this.dielinecolor;
		this.drawLine(this.xoffset-this.dotoffset + (i*this.dieoffset), this.yoffset  - this.dotoffset, 
						this.xoffset-this.dotoffset + (i*this.dieoffset), this.yoffset - this.dotoffset + (this.colors.length * this.dieoffset));
		this.ctx.stroke();
	},

	draw1D6Panel: function() {
		for (var c=0; c < this.colors.length; c++) {
			this.dieGridH(c);
			for (var d=1; d <= 6; d++) {
				this.draw1D6(d, 1+((d-1)*this.dieoffset), 1+c*this.dieoffset, this.colors[c], 1.0);
			}
		}
		this.dieGridH(this.colors.length);
		for (var i=0; i<=6; i++) this.dieGridV(i);
	},

	drawAntPanel: function() {
		this.ymax=1200;
		this.colors = [1,2,3,4,5,6];
		var scale = 0.6;
		for (var c=0; c < 6; c++) {
			this.dieGridH(c);
			for (var d=0; d < 6; d++) {
				this.drawAnt(this.xoffset - 64 + (d*this.dieoffset)/scale, 
					this.yoffset - 72 + (c*this.dieoffset)/scale, 
					'black', 1.0*scale);
			}
		}
		this.dieGridH(6);
		for (var i=0; i<=6; i++) this.dieGridV(i);
	},
	
	drawMoon: function() {
		this.colors = this.colorsgrayscale;
		return this.drawSun('gray');
	}
};
bubbles.init();
