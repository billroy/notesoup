<script type='text/javascript'>
/**
*	newnote.js - Note Soup new note widget
*
*	Copyright 2007, 2008 Bill Roy
*	This file is licensed under the Note Soup Client License
*	See http://notesoup.net/js/LICENSE
*/
var note = notesoup.ui.getEnclosingNote(this);
var notename = notesoup.prompt('New Note: Enter a title:', 'my new note');
if (notename.length) {
	var notetext = notesoup.prompt('New Note: Enter some text for the note; separate multiple lines with "/" like line 1/line 2.  (You can fix mistakes later.)', '');
	if (notename.length && notetext.length) {
		note['notename'] = notename;
		note['text'] = notetext.split('/').join('<br/>');
		note.save();
		note.show();
	}
}
</script>
Loading...