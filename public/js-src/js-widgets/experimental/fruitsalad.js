<script type='text/javascript'>
note.set({
	ontick: function() {
		notesoup.ui.arrangeNotes('random');
		for (var n in notesoup.notes) {
		    notesoup.notes[n].bgcolor = notesoup.ui.getRandomColor();
		    notesoup.notes[n].show();
		}
	}
});
</script>
Fruit salad!