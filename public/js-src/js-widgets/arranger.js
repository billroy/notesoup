<script type='text/javascript'>
/**
*	arranger.js - Note Soup widget template
*
*	Copyright 2007, 2008 Bill Roy
*	This file is licensed under the Note Soup Client License
*	See http://notesoup.net/js/LICENSE
*/
var note = notesoup.ui.getEnclosingNote(this);
note.set({
	ontick: function() {
		notesoup.ui.arrangeNotes('tight');
	}
});
</script>