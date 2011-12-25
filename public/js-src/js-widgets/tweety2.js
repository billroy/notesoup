<script type='text/javascript'>
/**
*	tweety.js - Note Soup twitter display
*
*	Copyright 2007, 2008 Bill Roy
*	This file is licensed under the Note Soup Client License
*	See http://notesoup.net/js/LICENSE
*/
note.set({

	lingertime: 5 * 60 * 1000,
	tweetcount: 0,
	hitcount: 0,
	
	init: function() {
		this.starttime = new Date().getTime();
		this.ink = $n('Ink');
		this.subscribe();
	},

	subscribe: function() {
		if (notesoup.push.connected) notesoup.push.subscribe('/radio/soup', this.ondata, this);
		else this.subscribe.defer(1000, this);
	},

	ondata: function(request) {
		//notesoup.say('TWEET:' + notesoup.dump(request));
		if (request.op != 'say') return false;
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
			thenote.setColor('limegreen');
			thenote.text = [thenote.text, '<br/>', text.replace(/\"/g, '&zq' + 'x3;')].join('');
		} else {
			thenote = this.getsettings(name);
			thenote.text = text.replace(/"/g, '&zq' + 'x3;');
			thenote.text = this.makeLinksClickable(thenote.text);
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
			'Tweets/sec: ', ''+Math.floor(10000 * (this.tweetcount / (new Date().getTime() - this.starttime)))/10, '<br/>'
		].join(''));
		notesoup.ui.filterBarWatcher();
	},
	
	/*
	*	=$n('t23').makeLinksClickable('I like http://www.timezone.com and all');
	*/
	makeLinksClickable: function(str) {
	
		var linkstart = 0;
	
		var schemes = ['http:', 'https:', 'ftp:'],
	
		for (var s=0; s < schemes.length; s++) {
			var scheme = schemes[s];
			var l = str.indexOf(scheme);
			if (l >= 0) {
				var head = str.substring(0, l-1);
				var uri = '';
				var tail = str.substring(l);
				//notesoup.say('found link, head/tail = [' + head + ']   ...   [' + tail + ']');
				var uridelim = tail.indexOf(' ');
				if (uridelim > 0) {
					uri = tail.substring(0, uridelim);
					tail = tail.substring(uridelim);
					tail = this.makeLinksClickable(tail);
				}
				else {
					uri = tail;
					tail = '';
				}
				return [
					head, '&nbsp;<a href="', uri, '" target="_blank">', uri, '</a>', tail
				].join('');
			}
		}
		return str;
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