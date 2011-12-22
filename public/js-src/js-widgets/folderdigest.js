<script type='text/javascript'>
/**
*	folderdigest.js - Note Soup folder digest widget
*
*	Copyright 2007, 2008 Bill Roy
*	This file is licensed under the Note Soup Client License
*	See http://notesoup.net/js/LICENSE
*/
var note = notesoup.ui.getEnclosingNote(this);
note.set({
	buildDigest: function() {
		var o = [];
		o.push('<p/>',
			'<h1>Folder Digest for ', notesoup.foldername, ' at ', '' + new Date(), '</h1>',
			'<hr/>');
		var notelist = notesoup.getNotesOrderedBy('yPos', true);
		for (var i=0; i < notelist.length; i++) {
			if (notelist[i] == note.id) continue;
			var thenote = notesoup.notes[notelist[i]];
			o.push('<div style="background:', thenote.bgcolor || '#909090', '">');
				if (thenote.notename) o.push('<h2>', thenote.notename, '</h2>');
				o.push(thenote.getContentDiv().innerHTML);
				o.push('<hr/>');
			o.push('</div>');
		}
		this.set({
			text:o.join(''),
			width: 450,
			bgcolor: '#909090',
			syncme: true,
			showme: true
		});
	}
});
</script>
<center>
<input type='submit' value='make folder digest' onclick = 'notesoup.ui.getEnclosingNote(this).buildDigest();'/>
</center>
