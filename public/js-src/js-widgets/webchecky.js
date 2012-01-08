<script type='text/javascript'>
/**
*	webchecky.js - Note Soup web site status check widget
*
*	Copyright 2007, 2008 Bill Roy
*	This file is licensed under the Note Soup Client License
*	See http://notesoup.net/js/LICENSE
*/
note.set({
	url: 'http://alpha.notesoup.net:3000/status',
	bgcolor: 'yellow',
	status: 'unknown',
	normaltimeout: 60,
	errortimeout: 15,
	refreshtimer: Math.floor(Math.random() * 15),

	go: function() {
		this.geturl(this.url);
	},

	getURLHandler: function(response, success, options) {
		if (success && (response.responseText != 'url fetch failed')) {
			this.status = 'OK';
			this.refreshtimer = this.normaltimeout;
			if (this.bgcolor != 'lime') {
				this.bgcolor = 'lime';
				this.rendercontainer();
			}
		}
		else {
			notesoup.say('Error fetching: ' + this.url, 'error');
			this.status = 'NOT OK';
			this.refreshtimer = this.errortimeout;
			if (this.bgcolor != 'red') {
				this.bgcolor = 'red';
				this.rendercontainer();
			}
		}
	},

	showStatus: function(msg) {
		this.setContentDiv([
			'<center>',
				'Monitoring site:<br/>',
				this.url, '<br/>',
				'Last status: ', this.status, '<br/>',
				msg, '<br/>',
				'<input value="check now" type="submit" onclick="notesoup.ui.getEnclosingNote(this).go();" />',
			'</center>'
		].join(''));
	},

	ontick: function() {
		if (--this.refreshtimer <= 0) {
			this.refreshtimer = this.normaltimeout;
			this.showStatus('Checking...');
			this.go();
		}
		else this.showStatus('Next check: ' + this.refreshtimer + ' seconds');
	}
});
</script>
Loading...