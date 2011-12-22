<script type='text/javascript'>
/**
*	tweety.js - Note Soup twitter display
*
*	Copyright 2007, 2008 Bill Roy
*	This file is licensed under the Note Soup Client License
*	See http://notesoup.net/js/LICENSE
*/
var note = notesoup.ui.getEnclosingNote(this);
note.set({

	lingertime: 5 * 60 * 1000,
	tweetcount: 0,
	hitcount: 0,
	
	init: function() {
		this.starttime = new Date().getTime();
		this.ink = $n('Ink');
	},

	onsay: function(request) {
		//notesoup.say('TWEET:' + notesoup.dump(request));
		var tweet = request.data;
		var name = '';
		var toname = '';
		var namedelim = tweet.search(':');
		if (namedelim > 0) {
			name = tweet.substr(0, namedelim);
			tweet = tweet.substr(namedelim+2);	// +1 for the blank
			if (tweet.charAt(0) == '@') {
				var delim = tweet.search(' ');
				if (delim > 0) {
					toname = tweet.substr(1, delim-1);
					tweet = tweet.substr(delim+1);
				}
			}
		}
		this.showtweet(name, toname, request.data);
		return true;
	},

	hash: function(s) {
		var h = 0;
		for (var i=0; i < s.length; i++) {
			h += s.charCodeAt(i);
			h *= s.charCodeAt(i);
			h %= 1024*1024*1024;
		}
		return h;
	},

	tweetwidth: 250,
	tweetheight: 54,
	xoffset: 30,
	yoffset: 30,
	xmax: Ext.lib.Dom.getViewWidth() - 250 - 30,
	ymax: Ext.lib.Dom.getViewHeight() - 54 - 30,
	yincrement: 36,

	getsettings: function(name) {
		var h = this.hash(name);
		//notesoup.say('HASH: ' + name + '=' + h);
		var thenote = {};
		thenote.xPos = Math.floor(this.xoffset + (h % this.xmax));
		h /= this.xmax;
		thenote.yPos = Math.floor(this.yoffset + this.yincrement * (h % (this.ymax/this.yincrement)));
		//notesoup.say('HASH:' + name + ' ' + thenote.xPos + ' ' + thenote.yPos);
		return thenote;
	},
	
	getnoteid: function(name) {
		return 'tweet_' + (name || '?anon?');
	},

	showtweet: function(name, toname, text) {
		//notesoup.say('Tweet: name=' + name + ' toname=[' + toname + '] text=' + text);
		this.tweetcount++;
		var noteid = this.getnoteid(name);
		var thenote = null;
		if (noteid in notesoup.notes) {
			this.hitcount++;
			thenote = notesoup.notes[noteid];
			thenote.text = [thenote.text, '<br/>', text.replace(/\"/g, '&zqx3;')].join('');
		} else {
			thenote = this.getsettings(name);
			thenote.text = text.replace(/"/g, '&zqx3;');
			thenote.isGuest = true;
			thenote.nosave = true;
			thenote.template = '<div class="tweet">{text}</div>';
			thenote.height = this.tweetheight;
			thenote.width = this.tweetwidth;
			thenote.id = noteid;
			thenote.zIndex = 10;
			thenote.mtime = notesoup.getServerTime();
		}
		notesoup.updateNote(thenote);
		notesoup.destroyNote.defer(this.lingertime, notesoup, [thenote.id]);
		
		if (toname && this.ink) {
			var tonote = this.getsettings(toname);
			//notesoup.say('Line: ' + toname + ' ' + thenote.xPos + ' ' + thenote.yPos + ' / ' + tonote.xPos + ' ' + tonote.yPos);
			var color = 'red';
			if (this.getnoteid(toname) in notesoup.notes) color = 'lime';
			this.ink.drawline(thenote.xPos, thenote.yPos - this.yoffset, tonote.xPos, tonote.yPos - this.yoffset, color, 3);
		}
	},
	
	ontick: function() {
		this.setContentDiv([
			'Tweets: ', this.tweetcount, '<br/>',
			'Tweets/sec: ', Math.floor(10000 * (this.tweetcount / (new Date().getTime() - this.starttime)))/10, '<br/>'
		].join(''));
		notesoup.ui.filterBarWatcher();
	}
});
note.init();
</script><style>
div.tweet {
	border:1px solid gray;
	background:white;
	font-size:6pt;
}
</style>
Tweety here!