<script type='text/javascript'>
/**
*	clock.js - Note Soup clock widget
*
*	Copyright 2007, 2008 Bill Roy
*	This file is licensed under the Note Soup Client License
*	See http://notesoup.net/js/LICENSE
*/
note.set({
	ontick: function() {
		this.setContentDiv([
			'<h2><center>',
			notesoup.timeStamp('','time'),
			'</h2></center>'
		].join(''));
	}
});
</script>