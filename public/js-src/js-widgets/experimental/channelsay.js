<script type='text/javascript'>
/**
*	channelsay.js - Note Soup sensor channel display
*
*	Copyright 2008 Bill Roy
*	This file is licensed under the Note Soup Client License
*	See http://notesoup.net/js/LICENSE
*/
note.set({

	init: function() {
		this.subscribe();
	},

	subscribe: function() {
		if (notesoup.push.connected) 
			notesoup.push.subscribe('/sensor/' + notesoup.foldername, this.ondata, this);
		else this.subscribe.defer(1000, this);
	},

	ondata: function(request) {
		notesoup.say('[SENSOR@' + request.sender + '] ' + request.op + ':' + request.data);
		return true;
	}
});
note.init();
</script>[SENSOR] Sensor channel probe here!