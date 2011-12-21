/**
*	notesoup-push-socketio.js: socket.io push socket interface
*
*	Copyright 2007-2011 Bill Roy
*	This file is licensed under the Note Soup Client License
*	See http://notesoup.net/js/LICENSE
*/
/** @constructor */
notesoup.push = {

	socket: null,
	connected: false,

	init: function() {

		// Socket IO is our push matrix
		
		this.socket = io.connect('http://localhost');	// todo: server?
		this.socket.on("connect", this.onconnect);
		this.socket.on("message", this.ondata);

//		notesoup.socket.say = function(data) {
//			notesoup.socket.emit("tell", data);
//		};

	},

	// callback on connection
	onconnect: function(msg) {

		notesoup.push.connected = new Date();
		if (notesoup.debugmode) notesoup.say('Push Channel is go.');

		// force the activity indicator to update to show our stuatus
		//notesoup.updateActivityIndicator('', false);

		// Send a registration request
		notesoup.push.subscribe('/folder/' + notesoup.foldername, notesoup.push.handleNotification, this);
		if (notesoup.loggedin && notesoup.username)
			this.subscribe('/talk/' + notesoup.username, notesoup.push.handleNotification, this);

		if (notesoup.autoLoadAvatar)
			notesoup.insertAvatar.defer(200, notesoup);
	},


	send: function(msg) {

		// Silently ignore blanks
		if (msg.length <= 0) return;

		if (this.connected) this.socket.emit(msg);
		else notesoup.say('Cannot send notification: server disconnected');
	},

	// message callback
	ondata: function(msg) {

		notesoup.say('ONDATA: ' + msg);
		if (notesoup.debugmode > 2) notesoup.debug('Notification: ' + msg);

		if (msg.charAt(0) != '{') {
			notesoup.say('Server says: ' + msg, 'error');
			notesoup.say(notesoup.hexdump(msg));
		}

		var request = Ext.util.JSON.decode(jsonmsg);
		if (request) return notesoup.push.deliverNotification(request);
		else {
			notesoup.say('Sorry, cannot decipher notification: ' + jsonmsg, 'error');
		}
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
			else if (cmd == 'show') {
				if (arg && arg.length) notesoup.frontstage.say(arg);
				else notesoup.frontstage.hide();
			}
			else if (cmd == 'flash') notesoup.frontstage.flash(arg.text, arg.color || notesoup.frontstage.color);
			else if (cmd == 'join') this.onjoin(request);
			else if (cmd == 'leave') this.onleave(request);
			else if (cmd == 'say') this.onsay(request);
			else if (cmd == 'tell') this.ontell(request);
			else if (cmd == 'ping') this.onping(request);
			else if (cmd == 'pong') this.onpong(request);
			else if (cmd == 'see') this.onsee(request);
			else if (cmd == 'sync') this.onsync(request);
			else if (cmd == 'rcon') this.onrcon(request);
			else if (cmd == 'play') this.onplay(request);
			else if (cmd == 'sendself') this.onsendself(request);
			else notesoup.say('Unrecognized command from server: ' + msg, 'error');
		} catch(e) {
			notesoup.say('Error handling push command: ' + notesoup.dump(e), 'error');
		}
	},

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
		this.send(jsonrequest);

		for (var i=0; i<this.subscriptions.length; i++) {
			if (channeluri == this.subscriptions[i].channeluri) {
				//notesoup.say('oops: duplicate subscription ' + channeluri, 'tell');
				return;
			}
		}

		this.subscriptions.push({
			channeluri: channeluri,
			handler: handler || notesoup.push.handleNotification,
			handlerScope: handlerScope || notesoup.push
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
		if (notesoup.push.say_sent_time) {
			notesoup.push.rttlast = Math.floor(new Date().getTime() - notesoup.push.say_sent_time);
			if (notesoup.debugMode) 
				notesoup.say('Notification rtt=' + notesoup.push.rttlast + 'ms');
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
		if (this.ping_sent_time) {
			this.rttlast = Math.floor((new Date().getTime() - this.ping_sent_time)/2);
			notesoup.say('PONG rtt/2=' + notesoup.push.rttlast + 'ms from ' + request.sender);
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
		notesoup.push.say_sent_time = new Date().getTime();
		notesoup.postEvent('/folder/' + notesoup.foldername, 'say', str); 
	},
	folderPing: function(str) { 
		notesoup.push.ping_sent_time = new Date().getTime();	
		notesoup.postEvent('/folder/' + notesoup.foldername, 'ping', str); 
		// this after a while to avoid spurious replies on other guys' pings
		window.setTimeout("notesoup.push.ping_sent_time=null;", 5000);
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

		if (notesoup.push.connected) {
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
			notesoup.push.send(jsonrequest);
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
