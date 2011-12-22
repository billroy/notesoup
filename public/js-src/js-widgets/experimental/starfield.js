/**
*	starfield.js - Note Soup star field screen backdrop
*
*	Copyright 2007, 2008 Bill Roy
*	This file is licensed under the Note Soup Client License
*	See http://notesoup.net/js/LICENSE
*/
var starfield = {

	stars: [],
	numstars: 250,
	maxx: 1200,
	maxy: 800,
	maxv: 10,
	minv: 1,
	maxr: 6,
	framedelay: 50,
	xoffset: 0,
	yoffset: 0,
	accel: false,
	xaccel: 1.04,
	yaccel: 1.02,
	bounce: false,
	rotizzy: false,
	theta: 0.0,

	init: function(homediv) {
		homediv = homediv || 'backdrop';
		this.canvas = document.getElementById(homediv);
		this.ctx = this.canvas.getContext('2d');
		if (this.ctx) notesoup.say('Starfield here!');
		else {
			notesoup.say('Starfield: load failed: sorry, failed to get ctx.');
			return;
		}
		//this.colors = this.colorspm;
		this.colors = this.colorsgrayscale;
		for (var i=0; i < this.numstars; i++) this.initstar(i);
		this.drawframe();
	},

	initstar: function(s) {
		var theta = Math.random() * Math.PI * 2.0;
		if (this.rotizzy) {
			theta = this.theta + (Math.PI * 2 / 100);
			this.theta = theta;
		}
		var z = Math.random();
		var v = this.minv + z * (this.maxv - this.minv);
		var r = z * this.maxr + 2;

		this.stars[s] = {
			x: this.maxx/2,
			y: this.maxy/2,
			vx: v * Math.cos(theta),
			vy: v * Math.sin(theta),
			r: r,
			ci: this.getColor(),
			ri: r-2,
			c: this.getbgColor()
		};
		//notesoup.say('init: ' + s + ':' + notesoup.dump(this.stars[s]));
	},
	
	updatestar: function(starid) {
		var s = this.stars[starid];
		//this.dumpstar('update in', starid, this.stars[starid]);
		s.x = s.x + s.vx;
		s.y = s.y + s.vy;

		if (this.accel) {
			s.vx *= this.xaccel;
			s.vy *= this.yaccel;
		}

		if (this.bounce) {
			if ((s.x < 0) || (s.x > this.maxx)) s.vx *= -1;
			if ((s.y < 0) || (s.y > this.maxy)) s.vy *= -1;
		}
		else if ((s.x < 0) || (s.x > this.maxx) || (s.y < 0) || (s.y > this.maxy)) {
			this.initstar(starid);
		}
		//this.dumpstar('update about to draw', starid, this.stars[starid]);
		this.drawstar(s.x, s.y, s.r, s.c, s.ri, s.ci);
	},

	dumpstar: function(tag, starid, star) {
		notesoup.say(tag + ' ' + starid + ' ' + notesoup.dump(star));
	},

	clear: function() {
		this.ctx.clearRect(0, 0, this.maxx, this.maxy);
	},

	drawframe: function() {
		//notesoup.say('frame');
		this.clear();
		for (var s=0; s < this.stars.length; s++) {
			//notesoup.say('star ' + s);
			this.updatestar(s);
		}
		this.drawframe.defer(this.framedelay, this);
	},
	
	drawstar: function(xraw, yraw, orad, ocolor, irad, icolor) {
		var x = xraw + this.xoffset;
		var y = yraw + this.yoffset;
		//var d = (orad - irad) / 2;

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
			//this.ctx.fillStyle = '#40f040';
			//this.ctx.fillStyle = '#f0f020';
			this.ctx.fillStyle = '#f0f0f8';
			var sr = Math.max(1, orad/10);
			this.ctx.arc(x-irad/2, y-irad/2, sr, 0, Math.PI*2, true);
			this.ctx.fill();
		}
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

	getbgColor: function(i) {
		//return '#f0f080';
		return this.getGradientColor(i, this.numstars);
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
	}	
};
starfield.init();
