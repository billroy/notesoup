<script type='text/javascript'>
/**
*	virtualbutton.js - Note Soup virtual button widget
*	Copyright 2008 Bill Roy
*	This file is licensed under the Note Soup Client License
*	See http://notesoup.net/js/LICENSE
*/
note.set({
	click: function() {
		notesoup.postEvent('/sensor/' + notesoup.foldername, 'click', this.id);
	}
});
</script>
<center><input type='submit' value='go' onclick='notesoup.ui.getEnclosingNote(this).click();'/></center>
