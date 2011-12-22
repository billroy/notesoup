<script type='text/javascript'>
/**
*	twitterizer.js - Note Soup twitter public tweet widget
*
*	Copyright 2007, 2008 Bill Roy
*	This file is licensed under the Note Soup Client License
*	See http://notesoup.net/js/LICENSE
*/

var note = notesoup.ui.getEnclosingNote(this);
note.set({

	bigtalker: false,
	displaytimeout: 1,
	displaytimer: 0,
	nexttweet: -1,
	refreshtimeout: 20,
	refreshtimer: 0,
	tweetttl: 30,

	init: function() {
		if (notesoup.foldername == 'system/widgets') {
			this.setContentDiv('Copy to another workspace to activate.');
			return;
		}
		notesoup.newNotePositionMode = 'random';
		if (notesoup.aflax.connected) this.gettweets();
		else this.init.defer(100, this);
	},

	gettweets: function(str) {
		this.geturl('http://twitter.com/statuses/public_timeline.json?since_id=' + (this.maxid || 0));
	},

/*****
    {
        "created_at": "Wed Jan 09 13:57:27 +0000 2008", 
        "id": 579700522, 
        "source": "web", 
        "text": "New blog post: Pay my student loans, please: student launches donation site to get help making payments http:\/\/tinyurl.com\/2dncop", 
        "truncated": false, 
        "user": {
            "description": "Personal finance magazine for students and young adults", 
            "id": 8241542, 
            "location": "", 
            "name": "youngmoney", 
            "profile_image_url": "http:\/\/s3.amazonaws.com\/twitter_production\/profile_images\/19015422\/logo_125_125_normal.png", 
            "protected": false, 
            "screen_name": "youngmoney", 
            "url": "http:\/\/www.youngmoney.com"
        }
    }, 
*****/

	display: function(text) {
		notesoup.frontstage.say('<br/><br/>' + text);
	},

	handleTweet: function(t) {
		//alert('Tweet: ' + notesoup.dump(t));
		if (this.bigtalker)
			return this.sendself('display', t.text);

		if ($n('tweet' + t.id)) return;		// no dups please
		this.maxid = Math.max(this.maxid || 0, t.id);
		var theNote = {
			istweet: true,
			notename: t.user.name || '?',
			screenname: t.screen_name,
			id: 'tweet' + t.id,
			bgcolor: notesoup.ui.getRandomColor(),
			nosave: true,
			ttl: this.tweetttl,		//Math.floor(Math.random() * this.tweetttl),
			//xPos: Math.max(0, Math.floor(Math.random() * Ext.lib.Dom.getViewWidth() - notesoup.defaultNoteWidth)),
			//yPos: Math.max(30, Math.floor(Math.random() * Ext.lib.Dom.getViewHeight() - notesoup.defaultNoteHeight)),
			mtime: notesoup.getServerTime(),
			text: [
				'<a href="http://twitter.com/', t.user.screen_name, '" target="_blank">',
					'<img src="', t.user.profile_image_url, '"/>',
				'</a>',
				t.text, (t.truncated ? '...' : ''), '<br/>',
				'<hr/>', t.user.description, '<br/>'
			].join('') || '(gratuitous tweet)'
		};
/*****
		if (t.text.charAt(0) == '@') {
			var blankpos = t.text.search(' ');
			var to = t.text.substr(1, blankpos-1);
			notesoup.say('To: ' + to);
			for (var n in notesoup.notes) {
				if (notesoup.notes[n].screen_name == to) {
					theNote.xPos = notesoup.notes[n].xPos;
					theNote.yPos = notesoup.notes[n].yPos + notesoup.notes[n].height + 36;
					theNote.bgcolor = notesoup.notes[n].bgcolor;
					notesoup.say('Match! ' + to, 'tell');
					break;
				}
			}
		}
*****/
		notesoup.sound.play('/sound/35687__Bansemer__Clo_1CCE53.mp3');
		notesoup.updateNote(theNote);
		//notesoup.postEvent('/folder/' + notesoup.foldername, 'updatenote', theNote);
	},


	getURLHandler: function(response, success, options) {
		if (!success) {
			notesoup.say('Failure loading data.');
			return;
		}
		try {
			this.tweetstr = response.responseText;
			//alert("TWEETLOAD:" + response.responseText);
			this.tweets = Ext.util.JSON.decode(this.tweetstr);			//.substr(15, this.tweetstr.length-16));
			this.setContentDiv('Received ' + this.tweets.length + ' tweets...');
			this.refreshtimer = this.refreshtimeout;
			this.nexttweet = this.tweets.length - 1;
			this.displaytimer = this.displaytimeout;
			this.running = true;
		} catch (e) {
			this.setContentDiv('Error loading data: ' + notesoup.dump(e));
			this.init.defer(1000, this);
		}
	},


	ontick: function() {

		if (!this.running) return;

		// shoot out the next note if we have one
		if (--this.displaytimer <= 0) {
			if (this.nexttweet >= 0) {
				this.handleTweet(this.tweets[this.nexttweet--]);
				this.displaytimer = this.displaytimeout;
			}
		}

		// make the notes vanish
		for (var n in notesoup.notes) {
			var thenote = notesoup.notes[n];
			if (thenote.istweet) {
				thenote.ttl = (thenote.ttl || 0) - 1;
				if (thenote.ttl > 0) {
					thenote.opacity = thenote.ttl / this.tweetttl;
					var container = Ext.get(thenote.id + notesoup.ui.divSuffix);
					if (container) container.setStyle('opacity', '' + thenote.opacity);
				}
				else notesoup.destroyNote(thenote.id);
			}				
		}

		// refresh our cache from twitter
		if (this.refreshtimer > 0) {
			this.refreshtimer = this.refreshtimer - 1;
			this.setContentDiv('Refresh in: ' + this.refreshtimer + ' seconds...');
			if (this.refreshtimer <= 0) this.gettweets();
		}
	},

	click: function(e) {
/***
		if (!this.feeddata) return;
		this.currentImage = this.currentImage + 1;
		if (this.currentImage >= this.feeddata.items.length)
			this.currentImage = 0;
		this.show();
***/
	}

});
Ext.get(note.id+'_content').on('click', note.click, note);
note.init();
</script>
Loading...