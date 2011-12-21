/**
*	notesoup-push-aflax.js: AFLAX push socket interface
*
*	Copyright 2007, 2008 Bill Roy
*	This file is licensed under the Note Soup Client License
*	See http://notesoup.net/js/LICENSE
*/
/** @constructor */
notesoup.aflax = {

	handle: new AFLAX("/js/AFLAX/aflax.swf", true),
	connection: null,
	flashup: false,
	connected: false,
	port: 7000,

	initfailurecount: 0,
	initmaxfailures: 3,
	connectionmaxfailurecount: 0,
	connectionmaxfailures: 3,
	failureretrytimeout: 3000,
	pingcount: 0,
	nopcount: 0,

	subscriptions: [],

	subscribe: function(channeluri, handler, handlerScope) {
		// Send a registration request
		if (!notesoup.pushClientID) {
			notesoup.pushClientID = notesoup.randomName(10);
			if (notesoup.debugmode) notesoup.say('push client id is: ' + notesoup.pushClientID);
		}
		var request = {
			method: 'subscribe',
			clientid: notesoup.pushClientID,
			channeluri: channeluri
		};
		if (notesoup.loggedin) request.authtoken = document.cookie.split('=')[1];
		var jsonrequest = Ext.util.JSON.encode(request);
		//notesoup.say('Sending subscription request...' + jsonrequest);
		notesoup.aflax.send(jsonrequest);

		for (var i=0; i<this.subscriptions.length; i++) {
			if (channeluri == this.subscriptions[i].channeluri) {
				//notesoup.say('oops: duplicate subscription ' + channeluri, 'tell');
				return;
			}
		}

		this.subscriptions.push({
			channeluri: channeluri,
			handler: handler || notesoup.aflax.handleNotification,
			handlerScope: handlerScope || notesoup.aflax
		});
	},

	deliverNotification: function(notification) {
		try {
			for (var i=0; i < this.subscriptions.length; i++) {
				var s = this.subscriptions[i];
				if (s.channeluri == notification.channeluri) {
					s.handler.apply(s.handlerScope, [notification]);
				}
			}
		} catch (e) {
			notesoup.say('Exception delivering notification: ' + e.message + ' at ' + e.at + ': ' + notesoup.dump(notification), 'error');
		}
	},

	onconnect: function(msg) {
		if (msg) {

			// Race: we can get here before notesoup is initialized
			if (!notesoup.initialized) {
				//if (notesoup.debugmode)
				notesoup.say('onconnect data-too-early retrying...', 'warning');
				
				//notesoup.say('clientversion:' + notesoup.clientVersion);
				//notesoup.say('imageHost:' + notesoup.imageHost);
				//notesoup.say('initialize:' + typeof(notesoup.initialize));
				//notesoup.say('dump:' + typeof(notesoup.dump));
				//notesoup.say('serveropts:' + typeof(notesoup.serveropts));

				notesoup.say('ui.init:' + typeof(notesoup.ui.initialize));
				notesoup.say('arrangeMenu' + typeof(notesoup.ui.arrangeMenu));
				notesoup.say('sharingMenu' + typeof(notesoup.ui.sharingMenu));
				notesoup.say('backgroundColorMenu' + typeof(notesoup.ui.backgroundColorMenu));
				notesoup.say('folderMenu' + typeof(notesoup.ui.folderMenu));
				//notesoup.say('colorMenu' + typeof(notesoup.ui.colorMenu));
				//notesoup.say('colorMenuHandler' + typeof(notesoup.ui.colorMenuHandler));
				//notesoup.say('sendMenu' + typeof(notesoup.ui.sendMenu));
				//notesoup.say('showNoteMenu' + typeof(notesoup.ui.showNoteMenu));
				//notesoup.say('commandbar' + typeof(notesoup.ui.commandbar));
				//notesoup.say('tb' + typeof(notesoup.ui.tb));
				//notesoup.say('defaultNoteColor' + typeof(notesoup.ui.defaultNoteColor));
				//notesoup.say('loadingText' + typeof(notesoup.ui.loadingText));
				
				window.setTimeout("notesoup.aflax.onconnect(true);", 1000);
				return;
			}

			notesoup.aflax.connected = new Date();
			if (notesoup.debugmode) notesoup.say('Push Channel is go.');

			// force the activity indicator to update to show our stuatus
			//notesoup.updateActivityIndicator('', false);

			// Send a registration request
			this.subscribe('/folder/' + notesoup.foldername, this.handleNotification, this);
			if (notesoup.loggedin && notesoup.username)
				this.subscribe('/talk/' + notesoup.username, this.handleNotification, this);


			if (notesoup.autoLoadAvatar)
				notesoup.insertAvatar.defer(200, notesoup);
		}
		else {
			if (notesoup.debug)
				notesoup.say('Could not connect to notification server at ' + notesoup.pushhost + ':' + this.port, 'warning');
			//this.port = this.port + 1;	// try different shield harmonics
			this.connectionmaxfailurecount = this.connectionmaxfailurecount + 1;
			if (this.connectionmaxfailurecount < this.connectionmaxfailures) {
				window.setTimeout("notesoup.aflax.init();", this.failureretrytimeout);
			}
			else notesoup.say('Notification server not available.', 'warning');
		}
	},

	ondata: function(msg) {

		//notesoup.say('ONDATA: ' + msg);
		if (notesoup.debugmode > 2) notesoup.debug('Notification: ' + msg);

		this.resetConnectionTimer();

		var request = null;
		if (msg.charAt(0) == '{') {
			try {
				// one could write a small thesis on the practical issues with stuffing JSON through
				// a pipe "designed", you should forgive my french, for XML.
				// you will find a correspondingly nasty bit in pushserver.py
				//
				jsonmsg = msg.replace(/&zqx3;/g, '\\"');
				jsonmsg = jsonmsg.replace(/&zqx4;/g, '<');
				jsonmsg = jsonmsg.replace(/&zqx5;/g, "\\'");

				jsonmsg = jsonmsg.replace(/\n/g,'\\n');
				//var m = msg.split('\n');
				//if (m.length > 1) msg = m.join('\\n');

				request = Ext.util.JSON.decode(jsonmsg);

				// handle parse failure
				//notesoup.say('after parse, request=' + request + ' ... ' + notesoup.dump(request));
				if (request) return this.deliverNotification(request);
				else {
					notesoup.say('Sorry, cannot decipher notification: ' + jsonmsg, 'error');
				}

			} catch(e) {
				if (notesoup.debugmode) {
					notesoup.say('Exception parsing push command body: ' + e.message + ' at ' + e.at + ':' + jsonmsg, 'error');
					notesoup.print('Exception dump original message [msg]: (' + msg.length + ')<br/>' + notesoup.hexdump(msg));
					notesoup.print('Exception dump decoded message [jsonmsg]: (' + msg.length + ')<br/>' + notesoup.hexdump(jsonmsg));
				}
				else notesoup.say('Push OOPS: ' + e.message, 'error');
				return null;
			}
		}
		else {
			notesoup.say('Server says: ' + msg, 'error');
			notesoup.say(notesoup.hexdump(msg));
		}
		return null;
	},


	handleNotification: function(request) {

		if (!((request.channeluri == '/folder/' + notesoup.foldername) || 
				(notesoup.loggedin && notesoup.username && (request.channeluri == '/talk/' + notesoup.username)))) {
			notesoup.say('Ignoring notification for channel: ' + request.channeluri, 'warn');
			return;
		}

		var cmd = request['op'];
		var arg = request['data'];
		//notesoup.say('Executing push command: ' + cmd + ' arg: ' + arg);
		//notesoup.debug('Executing push command: ' + cmd + ' arg: ' + arg);
		//notesoup.notify(cmd, arg);

		try {

			if (cmd == 'updatenote') notesoup.updateNote(arg);
			else if (cmd == 'deletenote') notesoup.destroyNote(arg);
			else if (cmd == 'idle') { notesoup.aflax.onidle(request); }
			else if (cmd == 'show') {
				if (arg && arg.length) notesoup.frontstage.say(arg);
				else notesoup.frontstage.hide();
			}
			else if (cmd == 'flash') notesoup.frontstage.flash(arg.text, arg.color || notesoup.frontstage.color);
			else if (cmd == 'join') notesoup.aflax.onjoin(request);
			else if (cmd == 'leave') notesoup.aflax.onleave(request);
			else if (cmd == 'say') notesoup.aflax.onsay(request);
			else if (cmd == 'tell') notesoup.aflax.ontell(request);
			else if (cmd == 'ping') notesoup.aflax.onping(request);
			else if (cmd == 'pong') notesoup.aflax.onpong(request);
			else if (cmd == 'see') notesoup.aflax.onsee(request);
			else if (cmd == 'sync') notesoup.aflax.onsync(request);
			else if (cmd == 'rcon') notesoup.aflax.onrcon(request);
			else if (cmd == 'play') notesoup.aflax.onplay(request);
			else if (cmd == 'sendself') notesoup.aflax.onsendself(request);
			else notesoup.say('Unrecognized command from server: ' + msg, 'error');
		} catch(e) {
			notesoup.say('Error handling push command: ' + notesoup.dump(e), 'error');
		}
	},

	onclose: function() {
		notesoup.say('Connection to notification server is closed.', 'tell');
		notesoup.aflax.connection = null;
		window.setTimeout("notesoup.aflax.init();", 500);
	},

	send: function(msg) {

		// Silently ignore blanks
		if (msg.length <= 0) return;
		
		// Convert '<' to '&zqx4;' for the transport
		//var m = msg.split('<');
		//if (m.length > 1)
		//	msg = m.join('&lt;');
		msg = msg.replace(/</g, '&zqx4;');

		// Ensure null terminated
		if (msg[msg.length-1] != '\0') msg = msg + '\0';

		if (notesoup.aflax.connection) {
			notesoup.aflax.connection.send(msg);
		}
		else notesoup.say('Cannot send notification: server disconnected');
	},

	flashok: function() {
		if (notesoup.debugmode) notesoup.say('Flash is go.');
		notesoup.aflax.flashup = true;
		notesoup.aflax.init.defer(10, this);
		//notesoup.say('Personal notification server driver loaded...');
	},

	onjoin: function(request) {
		//notesoup.say('JOIN: ' + notesoup.dump(request));
		var handled = false;
		for (var n in notesoup.notes) {
			handled = handled || notesoup.notes[n].calleventhandler('onjoin', request);
		}
		if (!handled && notesoup.username && (request.data.username != notesoup.username)) {
			notesoup.sound.play('/sound/27354_junggle_accordeon_20.mp3');
			notesoup.say(request.data.username + ' has joined.');
		}
		notesoup.refreshAvatar();
	},

	onleave: function(request) {
		var handled = false;
		for (var n in notesoup.notes) {
			handled = handled || notesoup.notes[n].calleventhandler('onleave', request);
		}
		if (!handled && notesoup.username) {
			notesoup.sound.play('/sound/42700_K1m218_Crickets.mp3');
			notesoup.say(request.data.username + ' has left.');
		}
	},

	onsay: function(request) {

		// calculate rtt for the push message, if we sent it
		if (notesoup.aflax.say_sent_time) {
			notesoup.aflax.rttlast = Math.floor(new Date().getTime() - notesoup.aflax.say_sent_time);
			if (notesoup.debugMode) 
				notesoup.say('Notification rtt=' + notesoup.aflax.rttlast + 'ms');
		}

		var handled = false;
		for (var n in notesoup.notes) {
			handled = handled || notesoup.notes[n].calleventhandler('onsay', request);
		}
		if (!handled) {
			notesoup.sound.play('/sound/35383__UncleSigmund_2198B0_tweet.mp3');
			//notesoup.say(request.sender + ' says: ' + request.data, 'tell');
			notesoup.say(request.sender + ' says: ' + request.data);
		}
	},

	ontell: function(request) {
		var handled = false;
		for (var n in notesoup.notes) {
			handled = handled || notesoup.notes[n].calleventhandler('ontell', request);
		}
		if (!handled) notesoup.say(request.sender + ' whispers: ' + request.data, 'tell');
	},

	onping: function(request) {
		notesoup.say('Ping!');
		this.pingcount++;
		//notesoup.say(notesoup.dump(request), 'warning');
		notesoup.sound.play('/sound/6164__NoiseCollector.mp3');
		notesoup.postEvent(request.channeluri, 'pong', request);
		notesoup.refreshAvatar();
	},

	onpong: function(request) {

		// calculate rtt for the push message, if we sent it
		if (notesoup.aflax.ping_sent_time) {
			notesoup.aflax.rttlast = Math.floor((new Date().getTime() - notesoup.aflax.ping_sent_time)/2);
			notesoup.say('PONG rtt/2=' + notesoup.aflax.rttlast + 'ms from ' + request.sender);
		}
	},

	onsee: function(request) {
		window.open(request.data, 'Link from ' + request.sender, '', false);
	},

	onsync: function(request) {
		notesoup.say('Syncing...');
		notesoup.syncToServer();
	},

	onrcon: function(request) {
		notesoup.say('Executing remote command: ' + request.data);
		notesoup.doCommand(request.data);
	},

	onplay: function(request) {
		notesoup.say('Playing...');
		notesoup.sound.play(request.data);
	},
	
	/**
	*	Send an event to other instances of the same note running in other browsers.
	*/
	onsendself: function(request) {
		//notesoup.say('got send self!');
		var noteid = request.data.noteid;
		if (noteid in notesoup.notes) {
			var thenote = notesoup.notes[noteid];
			if (thenote.onsendself) {
				thenote.onsendself.apply(thenote, request.data.args);
			}
		}
	},

	onidle: function(request) {
		++this.idlecount;
		this.connectionConfirmed();
	},


	conncheckinterval: '5 minutes',
	conncheckcountdown: 30,
	
	idlereplyinterval: '6 seconds',
	idlereplycountdown: 0,
	
	verifyConnection: function() {
		//notesoup.say('ConnCheck: ' + this.conncheckcountdown + ' ' + this.idlereplycountdown, 'whisper');
	
		if (this.idlereplycountdown > 0) {
			if (--this.idlereplycountdown <= 0) {
				//notesoup.say('CONNECTION ERROR', 'error');
				if (notesoup.debugmode) {
					notesoup.sound.play('/sound/17468__cognito_perce_1C634D.mp3');
					notesoup.say('Push connection broken.  Re-starting... ' + notesoup.stringifyTimeDiff(notesoup.sessionTime()), 'tell');
				}
				notesoup.aflax.init();
			}
			else return;
		}
	
		if (--this.conncheckcountdown <= 0) {
			if (notesoup.debugmode > 2)
				notesoup.say('Checking idle connection...', 'tell');
			notesoup.postEvent('/folder/' + notesoup.foldername, 'idle', ''+notesoup.sessionTime());
			this.idlereplycountdown = Math.floor(notesoup.getDuration(this.idlereplyinterval) / 1000);
		}
		else return;

		this.resetConnectionTimer();
	},
	
	resetConnectionTimer: function() {
		this.conncheckcountdown = Math.floor(notesoup.getDuration(this.conncheckinterval) / 1000);
	},
	
	connectionConfirmed: function() {
		if (notesoup.debugmode > 2)
			notesoup.say('Connection confirmed. ', 'tell');
		this.idlereplycountdown = 0;
	},

	reinit: function() {
		if (this.initretries) this.initretries = this.initretries + 1;
		else this.initretries = 1;
		if (this.initretries < 10) {
			//notesoup.say('aflax retry...', 'warning');
			this.init.defer(500, this);
		}
		else {
			notesoup.say('Could not initialize push channel.  Please ensure you have Flash installed and reload.', 'error');
		}
	},

	init: function() {
		try {
			if (typeof(__flash__argumentsToXML) != 'function') {
				notesoup.say('oops push init: ' + typeof(__flash__argumentsToXML), 'warning');
				return this.reinit();
			}

			// strap server to be same as the http server
			if (!notesoup.pushhost) {
				notesoup.pushhost = document.location.href.split('/')[2].split(':')[0];			
			}

			//this.debug('Connecting to notification server at ' + this['server'] + ':' + this.port);
			notesoup.say('Opening Push Channel to ' + notesoup.pushhost);

			notesoup.aflax.connection = new AFLAX.Socket(notesoup.aflax.handle, notesoup.pushhost, this.port, 
				'notesoup.aflax.onconnect', 'notesoup.aflax.ondata', 'notesoup.aflax.onclose');
		} catch(e) {
			notesoup.say('oops push init 2: ' + notesoup.dump(e), 'error');
			this.reinit();
		}
	},

	flashinit: function() {
		if (notesoup.debugmode > 2)
			notesoup.say('Inserting flash push channel adapter...');
		if (!Ext.get('aflaxdiv')) {
			notesoup.say('Waiting for aflax div...');
			this.flashinit.defer(200, this);
			return;
		}
		if (!notesoup.aflax.handle || !notesoup.aflax.handle.addFlashToElement) {
			notesoup.say('Waiting for aflax init...');
			this.flashinit.defer(200, this);
			return;
		}
		try {
			notesoup.aflax.handle.addFlashToElement('aflaxdiv', 1, 1, '#ffffff', 'notesoup.aflax.flashok', true);
		} catch(e) {
			notesoup.say("flash init error: " + notesoup.dump(e), 'error');
		}
	}
};


/**
*	Public functions
*/
notesoup.set({

	folderFlash: function(str, color) { 
		if (!color) color = notesoup.frontstage.color || notesoup.ui.defaultColor;
		notesoup.postEvent('/folder/' + notesoup.foldername, 'flash', {text: str, color: color});
	},
	
	tell: function(user, str) { notesoup.postEvent('/talk/' + user, 'say', str); },

	folderShow: function(str) { notesoup.postEvent('/folder/' + notesoup.foldername, 'show', str); },
	folderSay: function(str) {
		// note the time for rtt calculation
		notesoup.aflax.say_sent_time = new Date().getTime();
		notesoup.postEvent('/folder/' + notesoup.foldername, 'say', str); 
	},
	folderPing: function(str) { 
		notesoup.aflax.ping_sent_time = new Date().getTime();	
		notesoup.postEvent('/folder/' + notesoup.foldername, 'ping', str); 
		// this after a while to avoid spurious replies on other guys' pings
		window.setTimeout("notesoup.aflax.ping_sent_time=null;", 5000);
	},
	folderSee: function(str) {
		this.say('Opening browser window on: ' + str);
		notesoup.postEvent('/folder/' + notesoup.foldername, 'see', str);
	},
	folderSync: function(str) {
		notesoup.say('Syncing remote workspaces...');
		notesoup.postEvent('/folder/' + notesoup.foldername, 'sync', str);
	},
	folderRcon: function(str) {
		notesoup.say('Sending to all stations: ' + str);
		notesoup.postEvent('/folder/' + notesoup.foldername, 'rcon', str);
	},
	folderRefresh: function(str) {
		notesoup.say('Refreshing all connected workspaces...');
		this.folderRcon('=notesoup.openFolder(notesoup.foldername);');
	},
	folderPlay: function(str) {
		notesoup.say('Playing on all stations: ' + str);
		notesoup.postEvent('/folder/' + notesoup.foldername, 'play', str);
	},


	/**
	*	Post a folder event to the event notification fabric.
	*	@param {string} folder the folder uri or virtual channel on which to post the event
	*	@param {string} opstring the operation tag ('ping', 'say', ...)
	*	@param {object} arg	arguments to be passed with the operation (the 'foo' in '/say foo')
	*/
	postEvent: function(channeluri, opstring, arg) {
	
		//notesoup.say('postEvent: ' + channeluri + ' ' + opstring + ' ' + notesoup.dump(arg));

		if (notesoup.aflax.connected) {
			var request = {
				method: 'notify',
				clientid: notesoup.pushClientID,
				channeluri: channeluri,
				op: opstring,
				data: arg
			};
			if (notesoup.loggedin) request.authtoken = document.cookie.split('=')[1];
			var jsonrequest = Ext.util.JSON.encode(request);
			//notesoup.say('Sending notification...' + jsonrequest);
			notesoup.aflax.send(jsonrequest);
			//notesoup.say('Notification sent.');
			return;
		}

		notesoup.postRequest({
			method:"postevent",
			params:{
				tochannel: channeluri,
				op: [opstring, arg, channeluri],
				clientid: this.pushClientID
			}
		},{
			// These are awfully noisy
			//requestMessage: 'Sending notification ' + opstring + '...',
			//successMessage: 'Sent.',
			failureMessage: 'Could not send notification.'
		});
	},
	
	lastSoundTime: 0,
	minSoundInterval: 10000,

	notify: function(op, arg) {
	},

	noisynotify: function(op, arg) {
		if ((op == 'deletenote') || (op == 'sendnote') || (op == 'sync')) {
			if (notesoup.sound && notesoup.sound.play) {
				if (new Date().getTime() > (this.lastSoundTime + this.minSoundInterval)) {
					//notesoup.say(op, 'tell');
					notesoup.sound.play('/sound/41344__ivanbailey__1.mp3');
					this.lastSoundTime = new Date().getTime();
				}
			}
		}
	}
});
