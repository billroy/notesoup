<script type='text/javascript'>
/**
*	button.js - Note Soup scriptable button widget
*	Copyright 2007, 2008 Bill Roy
*	This file is licensed under the Note Soup Client License
*	See http://notesoup.net/js/LICENSE
*/
var note = notesoup.ui.getEnclosingNote(this);
note.set({
	click: function() {
		// your click code here
		notesoup.say('CLICK! ' + this.id);
	}
});
</script>
<center><input type='submit' value='go' onclick='notesoup.ui.getEnclosingNote(this).click();'/></center>
