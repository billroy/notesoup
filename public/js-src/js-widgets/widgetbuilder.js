<script type='text/javascript'>
/**
*	widgetbuilder.js - Note Soup widget builder widget
*
*	Copyright 2007, 2008 Bill Roy
*	This file is licensed under the Note Soup Client License
*	See http://notesoup.net/js/LICENSE
*/
var note = notesoup.ui.getEnclosingNote(this);
note.set({

	color: '#ccffcc',

	widgetlist: [
		{notename: 'AjaxRTT', imports: 'http://chowder.notesoup.net/js-src/js-widgets/ajaxrtt.js'},
		{notename: 'Auction', imports: 'http://chowder.notesoup.net/js-src/js-widgets/auction.js'},
		{notename: 'Avatar', imports: 'http://chowder.notesoup.net/js-src/js-widgets/avatar.js'},
		{notename: 'Beta Signup', imports: 'http://chowder.notesoup.net/js-src/js-widgets/betasignup.js'},
		{notename: 'Button', imports: 'http://chowder.notesoup.net/js-src/js-widgets/button.js'},
		{notename: 'Calculator', imports: 'http://chowder.notesoup.net/js-src/js-widgets/calculator.js'},
		{notename: 'Chat', imports: 'http://chowder.notesoup.net/js-src/js-widgets/chat.js'},
		{notename: 'Clock', imports: 'http://chowder.notesoup.net/js-src/js-widgets/clock.js'},
		{notename: 'Countdown Timer', imports: 'http://chowder.notesoup.net/js-src/js-widgets/countdowntimer.js'},
		{notename: 'Create User', imports: 'http://chowder.notesoup.net/js-src/js-widgets/createuser.js'},
		{notename: 'Deck', imports: 'http://chowder.notesoup.net/js-src/js-widgets/deck.js'},
		{notename: 'Egress', imports: 'http://chowder.notesoup.net/js-src/js-widgets/egress.js'},
		{notename: 'File Upload', imports: 'http://chowder.notesoup.net/js-src/js-widgets/uploadForm.js'},
		{notename: 'Flickr Images', imports: 'http://chowder.notesoup.net/js-src/js-widgets/flickrjson.js'},
		{notename: 'Folder Access Control', imports: 'http://chowder.notesoup.net/js-src/js-widgets/folderacl.js'},
		{notename: 'Form', imports: 'http://chowder.notesoup.net/js-src/js-widgets/form.js'},
		{notename: 'Graphy', imports: 'http://chowder.notesoup.net/js-src/js-widgets/graphy.js'},
		{notename: 'Hello World', imports: 'http://chowder.notesoup.net/js-src/js-widgets/helloworld.js'},
		{notename: 'Ink', imports: 'http://chowder.notesoup.net/js-src/js-widgets/ink.js'},
		{notename: 'Log In Here', imports: 'http://chowder.notesoup.net/js-src/js-widgets/loginform.js'},
		{notename: 'Message', imports: 'http://chowder.notesoup.net/js-src/js-widgets/message.js'},
		{notename: 'My Card', imports: 'http://chowder.notesoup.net/js-src/js-widgets/bizcard.js'},
		{notename: 'Periodical Reminder', imports: 'http://chowder.notesoup.net/js-src/js-widgets/periodicalreminder.js'},
		{notename: 'Poll', imports: 'http://chowder.notesoup.net/js-src/js-widgets/polling.js'},
		{notename: 'Portable Hole', imports: 'http://chowder.notesoup.net/js-src/js-widgets/porthole.js'},
		{notename: 'Send a Message', imports: 'http://chowder.notesoup.net/js-src/js-widgets/chatty.js'},
		{notename: 'Sound Board', imports: 'http://chowder.notesoup.net/js-src/js-widgets/soundboard.js'},
		{notename: 'Timer', imports: 'http://chowder.notesoup.net/js-src/js-widgets/timer.js'},
		{notename: 'Twitterizer', imports: 'http://chowder.notesoup.net/js-src/js-widgets/twitterizer.js'}
	],

	clean: function() {
		// clear the workspace of importing notes
		for (var n in notesoup.notes) {
			if (n == this.id) continue;
			if (notesoup.notes[n].imports) notesoup.deleteNote(n);
		}
		notesoup.openFolder.defer(2000, notesoup, [notesoup.foldername]);
	},


	saveall: function() {
		for (var n in notesoup.notes) notesoup.notes[n].syncme = true;
		notesoup.syncToServer();
	},


	makewidgets: function() {
		for (var i=0; i < this.widgetlist.length; i++) {
			var w = this.widgetlist[i];
			notesoup.doCommand(Ext.util.JSON.encode({
				notename: w.notename,
				imports: w.imports,
				bgcolor: this.color
			}));
			notesoup.saveNote({
				notename: w.notename,
				imports: notesoup.foldername + '/@' + w.notename,
				bgcolor: this.color
			}, notesoup.username + '/templates');
		}
		this.saveall.defer(2000);
	}
});
</script>
<center>
<input type='submit' value='clean' onclick = 'notesoup.ui.getEnclosingNote(this).clean();'/>
<input type='submit' value='make widgets' onclick='notesoup.ui.getEnclosingNote(this).makewidgets();'/>
</center>
