<script>
/**
*	widgetbuilder.js - Note Soup widget builder widget
*
*	Copyright 2007-2011 Bill Roy
*	This file is licensed under the Note Soup Client License
*	See http://notesoup.net/js/LICENSE
* 
{notename:'Widget Builder', imports:'/js-src/js-widgets/widgetbuilder.js'}
*/
note.set({

	color: '#ccffcc',

	widgetlist: [
		{notename: 'AjaxRTT', imports: '/js-src/js-widgets/ajaxrtt.js'},
		{notename: 'Auction', imports: '/js-src/js-widgets/auction.js'},
		{notename: 'Avatar', imports: '/js-src/js-widgets/avatar.js'},
/*		{notename: 'Beta Signup', imports: '/js-src/js-widgets/betasignup.js'},	*/
		{notename: 'Button', imports: '/js-src/js-widgets/button.js'},
		{notename: 'Calculator', imports: '/js-src/js-widgets/calculator.js'},
		{notename: 'Chat', imports: '/js-src/js-widgets/chat.js'},
		{notename: 'Clock', imports: '/js-src/js-widgets/clock.js'},
		{notename: 'Countdown Timer', imports: '/js-src/js-widgets/countdowntimer.js'},
		{notename: 'Create User', imports: '/js-src/js-widgets/createuser.js'},
		{notename: 'Deck', imports: '/js-src/js-widgets/deck.js'},
		{notename: 'Egress', imports: '/js-src/js-widgets/egress.js'},
		{notename: 'File Upload', imports: '/js-src/js-widgets/uploadForm.js'},
		{notename: 'Flickr Images', imports: '/js-src/js-widgets/flickrjson.js'},
		{notename: 'Folder Access Control', imports: '/js-src/js-widgets/folderacl.js'},
		{notename: 'Form', imports: '/js-src/js-widgets/form.js'},
		{notename: 'Graphy', imports: '/js-src/js-widgets/graphy.js'},
		{notename: 'Hello World', imports: '/js-src/js-widgets/helloworld.js'},
		{notename: 'Ink', imports: '/js-src/js-widgets/ink.js'},
		{notename: 'Log In Here', imports: '/js-src/js-widgets/loginform.js'},
		{notename: 'Message', imports: '/js-src/js-widgets/message.js'},
		{notename: 'My Card', imports: '/js-src/js-widgets/bizcard.js'},
		{notename: 'Periodical Reminder', imports: '/js-src/js-widgets/periodicalreminder.js'},
//		{notename: 'Poll', imports: '/js-src/js-widgets/polling.js'},
		{notename: 'Portable Hole', imports: '/js-src/js-widgets/porthole.js'},
		{notename: 'Send a Message', imports: '/js-src/js-widgets/chatty.js'},
/*		{notename: 'Sound Board', imports: '/js-src/js-widgets/soundboard.js'}, */
		{notename: 'Timer', imports: '/js-src/js-widgets/timer.js'}
/*		{notename: 'Twitterizer', imports: '/js-src/js-widgets/twitterizer.js'} */
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
		notesoup.saveNote(this.widgetlist, notesoup.foldername);
	}
});
</script>
<center>
<input type='submit' value='clean' onclick = 'notesoup.ui.getEnclosingNote(this).clean();'/>
<input type='submit' value='make widgets' onclick='notesoup.ui.getEnclosingNote(this).makewidgets();'/>
</center>
