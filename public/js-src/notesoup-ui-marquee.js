/**
*	Notesoup Marquee Display 1.1 glue
*
*	Copyright 2007, 2008 Bill Roy
*	This file is licensed under the Note Soup Client License
*	See http://notesoup.net/js/LICENSE
*/
	
notesoup.marquee = {
	payload: '',
	offset: 0,
	interval: 40,
	longinterval: 1000,
	starttime: 0,
	endtime: 0,

	/**
	*	Push some text onto the marquee display queue.
	*/
	push: function(someText) {
		var wasRunning = (notesoup.marquee.payload.length > 0);
		notesoup.marquee.payload += '\n' + someText;
		if (!wasRunning) {
			notesoup.marquee.update();
			notesoup.marquee.starttime = new Date().getTime();
		}
	},


	/**
	*	Slam the marquee display queue with some text.
	*/
	put: function(someText) {
		this.payload = '';
		this.push(someText);
	},


	/**
	*	Periodical updater: interpret the next byte in the display queue.
	*/
	update: function() {
		if (notesoup.marquee.offset >= notesoup.marquee.payload.length) {
			notesoup.marquee.payload = '';
			notesoup.marquee.offset = 0;
			notesoup.ui.commandbar.setValue('');
			notesoup.marquee.endtime = new Date().getTime();
			//notesoup.say('' + (notesoup.marquee.endtime - notesoup.marquee.starttime)/1000 + ' seconds');
			return;		// do NOT set timer for re-call
		}

		if (notesoup.marquee.payload[notesoup.marquee.offset] == '[') {
			//notesoup.say('found [');
			notesoup.marquee.offset++;
			notesoup.marquee.offset++;
			notesoup.doCommand(notesoup.ui.commandbar.getValue());
		}
		else if (notesoup.marquee.payload[notesoup.marquee.offset] == '\n') {
			notesoup.marquee.payload = notesoup.marquee.payload.substring(notesoup.marquee.offset+1);
			notesoup.marquee.offset = 0;
			window.setTimeout('notesoup.marquee.update();', notesoup.marquee.longinterval);
			return;
		}
		else {
			notesoup.ui.commandbar.setValue(notesoup.marquee.payload.substring(0, notesoup.marquee.offset+1));
			notesoup.marquee.offset++;
		}

		window.setTimeout('notesoup.marquee.update();', notesoup.marquee.interval);
	}
};

notesoup.registeredCommands.push(['/marquee', 'Play a message in the command bar.', notesoup.marquee.push]);

