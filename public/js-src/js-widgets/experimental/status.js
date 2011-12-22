<script type='text/javascript'>
/**
*	status.js - Note Soup status widget
*
*	Copyright 2007, 2008 Bill Roy
*	This file is licensed under the Note Soup Client License
*	See http://notesoup.net/js/LICENSE
*/
var note = notesoup.ui.getEnclosingNote(this);
note.set({
	ontick: function() {
		this.setContentDiv([
			'<b>Note Soup Client Status for ', notesoup.foldername, '</b><br/>',
			'<br/>',
			'Server time: ', notesoup.timeStamp(notesoup.getServerTime()*1000, 'time'), ' offset=', notesoup.serverTimeOffset, 'ms<br/>',
			'You have been here ', notesoup.stringifyTimeDiff(notesoup.sessionTime()), '<br/>',
			'<br/>',
			notesoup.loggedin ? 'You are logged in as ' + notesoup.username : 'You are not logged in', '.<br/>',
			'Your IP address is ', notesoup.clientip, ' ', notesoup.clientport, '<br/>',
			notesoup.isowner ? 'You own this folder.<br/>' : '',
			notesoup.iseditor ? 'You can edit things here.<br/>' : '',
			notesoup.issender ? 'You can send things here.<br/>' : '',
			'There are ', notesoup.countNotes(), ' notes here.<br/>',
			'<br/>',
			'Server version: ', notesoup.serverversion, '<br/>',
			'Client version: ', notesoup.clientVersion, '<br/>',
			'Debug level is ', notesoup.debugmode, '<br/>',
			'<br/>',
			'Last ajax rtt: ', notesoup.rttlast, ' sent ', notesoup.bytesSentTotal, ' received: ', notesoup.bytesReceivedTotal, '<br/>',
			'<br/>',
			'Push server: ', notesoup.pushhost || '?', ':', notesoup.aflax.port, '<br/>',
			'Connected: ', notesoup.aflax.connected, '<br/>',
			'Next connection check: ', notesoup.aflax.conncheckcountdown, '<br/>',
			'<br/>'
		].join(''));
	}
});
</script>