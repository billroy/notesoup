<script type='text/javascript'>
/**
*	egress.js - Note Soup programmable egress widget
*
*	Copyright 2007, 2008 Bill Roy
*	This file is licensed under the Note Soup Client License
*	See http://notesoup.net/js/LICENSE
*/
var note = notesoup.ui.getEnclosingNote(this);
note.set({
	duration: '5 minutes',
	destination: notesoup.foldername,

	ontick: function() {
		if (notesoup.sessionTime() > notesoup.getDuration(this.duration)) 
			return notesoup.openFolder(this.destination);
		this.onrender();
	},

	onrender: function() {
		this.setContentDiv([
			'<br/><h1><center>', 
				notesoup.stringifyTimeDiff(notesoup.getDuration(this.duration) - notesoup.sessionTime()), 
			'</center></h1><br/>'
		].join(''));
	}
});
note.show();
</script>