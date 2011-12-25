/**
*	notesoup-sound.js - Note Soup sound interface
*
*	Copyright 2007-2011 Bill Roy
*	This file is licensed under the Note Soup Client License
*	See http://notesoup.net/js/LICENSE
*

.sound.play('/sound/34005__jobro__EAS_beep.mp3');

*/
notesoup.sound = {

	id: 'notesoup.sound',

	play: function(url) {
		var sounddiv = Ext.get('sound_');
		if (sounddiv) sounddiv.remove();
		var body = document.getElementsByTagName("body");
		body.append('<embed id="sound_" autostart="true" hidden="true" src="' + url + '"/>');
	},

	init: function() {
	},

	start: function() {
	},
	
	stop: function() {
		$("#sound_").remove();
	}
};

