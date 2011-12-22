<script type='text/javascript'>
/**
*	server.js - Note Soup server control widget
*
*	Copyright 2007, 2008 Bill Roy
*	This file is licensed under the Note Soup Client License
*	See http://notesoup.net/js/LICENSE
*/
var note = notesoup.ui.getEnclosingNote(this);
note.set({

	stop: function() { return this.servercommand('stop'); },
	restart: function() { return this.servercommand('restart'); },

	servercommand: function(cmd) {
		notesoup.postRequest({
			method:'server',
			params:{servercommand: cmd}
		},{
			requestMessage: 'Stopping server...',
			successMessage: 'Command complete.  Which means the server didn\'t stop.',
			failureMessage: 'The server has stopped.'
		});
	}
});
</script>
<center><input type='submit' value='stop' 
	onclick='notesoup.ui.getEnclosingNote(this).stop();'/><input type='submit' value='restart' 
	onclick='notesoup.ui.getEnclosingNote(this).restart();'/>
</center>
