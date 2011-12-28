<script type='text/javascript'>
/**
*	flickrjson.js - Note Soup flickr.com json api widget
*
*	Copyright 2007, 2008 Bill Roy
*	This file is licensed under the Note Soup Client License
*	See http://notesoup.net/js/LICENSE
*/
note.set({
	viewtimeout: 10,
	viewtimer: 10,

	init: function() {
		this.keywords = (this.notename != 'Flickr Images') ? this.notename : 'sunset';
		this.notename = this.keywords;
		note.getflickr(this.keywords);
	},

	ontick: function() {

		if (this.notename != this.keywords)
			return this.init();

		this.viewtimer = this.viewtimer - 1;
		if (this.viewtimer <= 0) {
			this.click();
			this.viewtimer = this.viewtimeout;
		}
	},

	getURLHandler: function(response, success, options) {
		if (!success) {
			notesoup.say('Failure loading data.');
			return;
		}
		try {
			// prune 'jsonFlickrFeed('
			this.feedstr = response.responseText;
			this.feeddata = Ext.util.JSON.decode(this.feedstr.substr(15, this.feedstr.length-16));
			notesoup.say('Received ' + this.feeddata.items.length + ' images...');
			this.onrender = this.renderimage;
			this.currentImage = 0;
			this.show();
		} catch (e) {
			this.setContentDiv('Error loading feed: ' + notesoup.dump(e));
		}
	},

	renderimage: function() {
		var markup = [
			"<img style='width:100%;' src='",
			this.getimage(),
			"'/>"
		].join('');
		this.setContentDiv(markup);
	},

	getimage: function() {
		if (!this.feeddata) return '';
		return this.feeddata.items[this.currentImage].media.m;
	},

	click: function(e) {
		if (!this.feeddata) return;
		this.currentImage = this.currentImage + 1;
		if (this.currentImage >= this.feeddata.items.length)
			this.currentImage = 0;
		this.show();
	},

	getflickr: function(str) {
		notesoup.say('Fetching Flickr images for keyword: ' + str);
		this.geturl('http://api.flickr.com/services/feeds/photos_public.gne?format=json&tags=' + escape(str));
	}
});
Ext.get(note.id+'_content').on('click', note.click, note);
note.init();
</script>
Loading...