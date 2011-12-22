<script type='text/javascript'>
/**
*	hitcounter.js - Note Soup hit counter widget
*
*	Copyright 2007, 2008 Bill Roy
*	This file is licensed under the Note Soup Client License
*	See http://notesoup.net/js/LICENSE
*/
var note = notesoup.ui.getEnclosingNote(this);
note.onload = 'this.text=parseInt(this.text)+1;this.save();'
</script>