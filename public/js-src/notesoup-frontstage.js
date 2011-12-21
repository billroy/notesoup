/**
*	notesoup-frontstage.js
*
*	Copyright 2007, 2008 Bill Roy
*	This file is licensed under the Note Soup Client License
*	See http://notesoup.net/js/LICENSE
*/
notesoup.frontstage = {

	domid: 'frontstage',
	innerdomid: 'frontstagetext',
	lingertime: 1000,
	yoffset: 35,
	width: null,
	height: null,
	color: 'black',
	
	init: function() {
		var mydiv = Ext.get(this.domid);
		if (!mydiv) {
			this.init.defer(50, this);
			return;
		}
		var bsize = Ext.getBody().getSize();
		this.width = bsize.width;
		this.height = bsize.height;
		mydiv.setBounds(0, 0, this.width, this.height);
		
		//this.scroll.defer(2000, this, ['A long time ago<br/>in a galaxy far away...']);		
	},

	show: function() { 
		Ext.get(this.domid).show().setOpacity(0.75); 
	},

	showFx: function() {Ext.get(this.domid).show({
		duration: notesoup.ui.defaultEffectsDuration/2,
		endOpacity: 0.75}); 
	},

	scrollInterval: 100,		// ms per frame
	scrollOffset: 25,		// pixels per frame

	scroll: function(msg, bg) {
		Ext.get(this.domid).setStyle('background', bg || this.color);
		this.say(msg);
		this.scrolloff.defer(this.lingertime, this);
	},

/*****
		if (!stage) notesoup.say('oops stage');
		//if (stage.getBottom() < 0) {
		//	this.hide();
		//	this.set('');
		//	stage.moveTo(0, 0, false);
		//	return;
		//}
		//notesoup.say('b:' + stage.getBottom() + ' t:' + stage.getTop());
		//stage.setTop(stage.getTop() - this.scrolloffset);
		//stage.moveTo(stage.getTop() - this.scrolloffset, 0, {duration:(this.scrollInterval/1000)});
		//stage.moveTo(stage.getTop() - this.scrolloffset, 0, false);
		//stage.scroll('up', this.scrollOffset, true);
		stage.move.delay(100, stage, ['up', stage.getBottom(), true]);
		//}
		//this.scroll.defer(this.scrollInterval, this, []);
	},
*****/

	scrolloff: function() {
		var stage = Ext.get(this.innerdomid);
		stage.move('up', stage.getBottom(), {duration: this.lingertime/1000});
		this.hide.defer(this.lingertime, this);
		//this.resetscroll.defer(this.lingertime + 10, this);
	},

	resetscroll: function() {
		// BUG: um, this is broken
		//Ext.get(this.innerdomid).setTop(0, false);
		//Ext.get(this.innerdomid).moveTo(0, 0, false);
		Ext.get(this.innerdomid).setXY([0, 0], false);
	},

	hide: function() { 
		Ext.get(this.domid).hide(true);
	},

	set: function(markup) { 
		//Ext.getDom('frontstagetext').innerHTML = '';
		Ext.get(this.innerdomid).update(markup, true).setXY([0, this.yoffset], false);
	},

	say: function(msg) {
		// One cannot vertically center text properly without bizarre efforts
		// We fake this here
		if (msg[0] != '<') {
			msg = msg.split('\n').join('<br>');		// convert newlines to <br>
			var lines = msg.split('<br>').length;	// count <br>
			var linesperpage = 8;
			var linestoadd = (linesperpage - lines) / 2;
			while (linestoadd-- > 0) msg = "<br>" + msg;
		}
		this.set(msg);	
		this.show();
	},

	flash: function(msg, bg) {
		Ext.get(this.domid).setStyle('background', bg || this.color);
		this.say(msg);
		this.hide.defer(this.lingertime, this);
	}
};

