<script type='text/javascript'>
/**
*	empty.js - Note Soup widget template
*
*	Copyright 2008 [copyright holder]
*	[licensing reference]
*/
var note = notesoup.ui.getEnclosingNote(this);
note.set({
	init: function() {
		notesoup.say('Hello, world!');
	}
});
note.init();
</script>