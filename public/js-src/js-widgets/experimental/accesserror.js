<script type='text/javascript'>
/**
*	accesserror.js - Note Soup widget template
*
*	Copyright 2007, 2008 Bill Roy
*	This file is licensed under the Note Soup Client License
*	See http://notesoup.net/js/LICENSE
*/

*/
note.set({

	notename: 'Sorry, there was a problem...',
	bgcolor: 'orangered',
	opacity: 0.8,

	init: function() {
		document.body.style.background = 'black';
		notesoup.loadScript('/js-src/js-widgets/experimental/starfield.js');
		this.honk();
		this.show();
	},

	honk: function() {
		if (notesoup.sound && notesoup.sound.play && notesoup.sound.soundObj) {
			notesoup.sound.play('/sound/42704__K1m218__SHEEP.mp3');
		}
		//else this.honk.defer(200, this);		
	},

	onrender: function() {

		var o = [
			'<span style="color:white;"><br/>',
			'We cannot provide the resource you requested. <br/><br/>',
			'Either it doesn\'t exist, or you don\'t have the required access rights.<br/><br/>',
			'(We can\'t say which, to protect the privacy of our users. Hope you\'ll understand.)<br/><br/>',
		];

		if  (notesoup.loggedin && notesoup.username) o.push(
			'You are logged in as: <b>', notesoup.username, '</b><br/><br/>',
			'Since you are logged in, re-authenticating is unlikely to help.<br/><br/>',
			'Check the URL that brought you here. <br/><br/>',
			'You may need to contact the owner of the resource to get permission.<br/><br/>');
		else o.push(
			'<b>You aren\'t logged in, which might be part of the problem.</b><br/><br/>',
			'Check the URL that brought you here. <br/><br/>',
			'Or click the button to log in if you want to try again.<br/><br/>',
			'<center><input type="submit" value="log in" onclick="notesoup.openFolder(\'system/welcome\');" /></center>',
			'<br/>');

		o.push('</span>');
		this.setContentDiv(o.join(''));
	}
});
note.init();
</script>