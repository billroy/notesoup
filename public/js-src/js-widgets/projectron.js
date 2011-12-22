<script type='text/javascript'>
/**
*	projectron.js - Note Soup projector widget
*
*	Copyright 2007, 2008 Bill Roy
*	This file is licensed under the Note Soup Client License
*	See http://notesoup.net/js/LICENSE
*/
try {var note = notesoup.ui.getEnclosingNote(this);
note.set({
	init: function() {
		this.debug = false;
		this.reset();
		this.show();

		if (this.debug) {
			notesoup.notificationLife = 50000;	// ms the message stays visible
		}
	},

	push: function(text) {
		var lines = text.split('\n');
		if (!this.payload) this.payload = [];
		while (lines.length) this.payload.push(lines.shift());
		//for (var l=0; l < lines.length; l++) this.payload.push(lines[l]);
	},

	put: function(text) {
		delete this.payload;
		this.payloadoffset = 0;
		this.push(text);
	},

	evaluate: function(cmd) {
		try {
			eval(cmd);
		} catch(e) {
			notesoup.say('Error evaluating expression [' + cmd + '] at line: ' + (this.payloadoffset-1) + ' ' + this.payload[this.payloadoffset-1] + ' :: ' + notesoup.dump(e), 'error');
			this.pause();
		}
	},
	
	docommand: function(cmd) {
		try {
			notesoup.doCommand(cmd);
		} catch(e) {
			notesoup.say('Error executing command [' + cmd + '] at line: ' + (this.payloadoffset-1) + ' ' + this.payload[this.payloadoffset-1] + ' :: ' + notesoup.dump(e), 'error');
			this.pause();
		}
	},
	
	setholdtime: function(dt) {
		this.holdtime = new Date().getTime() + dt;
		if (this.debug) notesoup.say('SET HOLDTIME: ' + (dt/1000));
	},
	
	flash: function(text) {
		notesoup.frontstage.flash(text);
	},

	marquee: function(text) {
		notesoup.marquee.push(text);
	},

	processline: function() {
	
		if (this.payloadoffset >= this.payload.length) {
			// return from subroutine?
			if (this.callstack.length > 0) {
				var ret = this.callstack.pop();
				this.payloadoffset = ret.payloadoffset;
				this.payload = ret.payload;
				if (this.debug) notesoup.say('Returned from: ' + ret.callee);
				return null;
			}
			notesoup.say('Done: ' + notesoup.stringifyTimeDiff(new Date().getTime() - this.starttime));
			notesoup.say('Done: ' + notesoup.stringifyTimeDiff(new Date().getTime() - this.starttime), 'whisper');
			this.running = false;
			this.payloadoffset = 0;
			return;
		}

		var p = this.payload[this.payloadoffset++];
		if (p.length <= 0) return;
		if (this.debug) notesoup.say('STEP: ' + (this.payloadoffset-1) + ' ' + this.payload.length + ' ' + p, 'tell');

		switch(p.charAt(0)) {

			case '@':		// call subroutine
				var callee = p.substring(1);
				var thenote = notesoup.getImport(callee);
				if (this.debug) notesoup.say('@CALL: ' + notesoup.dump(thenote));
				if (thenote < 0) {			// still trying
					this.holdcondition = '(typeof(notesoup.getImport("' + callee + '")) == "object")';
					--this.payloadoffset;	// redo this step
				}
				else if (thenote && thenote.text) {
					if (this.debug) notesoup.say('CALL: ' + callee);
					this.callstack.push({
						callee:  callee,
						payloadoffset: this.payloadoffset,
						payload: this.payload
					});
					this.put(thenote.text);
				}
				else {
					notesoup.say('Projectron: Subroutine not found: ' + callee, 'error');
					this.pause();
				}
				return;

			case '~':		// timed wait or condition wait
				p = p.substring(1);
				if ((p.charAt(0) >= '0') && (p.charAt(0) <= '9')) {
					var dt = notesoup.getDuration(p);
					if ((dt < 400) && (p.charAt(0) != '0')) dt *= 1000;
					this.setholdtime(dt);
				}
				else {
					this.holdcondition = p;
					if (this.debug) notesoup.say('SET HOLDCONDITION: ' + this.holdcondition);
				}
				return;
			
			case '=':
				this.sendself('evaluate', p.substring(1));
				return;
	
			case '.':
				this.sendself('evaluate', 'notesoup' + p);
				return;
	
			case '!':
				//this.sendself('docommand', p.substring(1)); 
				notesoup.doCommand(p.substring(1)); 
				return;
	
			case '[':
				this.sendself('marquee', p.substring(1));
				this.setholdtime(1000);
				this.holdcondition = '!notesoup.marquee.payload';
				break;

			default:
				this.sendself('flash', p);
				this.setholdtime(notesoup.frontstage.lingertime + 350);	// 350 for Ext decay animation
				return;
		}
	},

	holding: function() {
		if (!this.holdcondition) return false;
		if (this.debug) notesoup.say('HOLDING: ' + this.holdcondition);
		var result = null;
		try { 
			result = eval(this.holdcondition);
		} catch (e) { 
			notesoup.say('Error evaluating hold condition: ' + notesoup.dump(e), 'error');
			this.pause();
			return true;
		}
		if (result) {
			delete this.holdcondition;
			return false;
		}
		return true;
	},

	ontick: function() {
		if (!this.running) return;

		if (this.holdtime) {
			if (new Date().getTime() < this.holdtime) {
				notesoup.say('Timed hold remaining: ' + notesoup.stringifyTimeDiff(this.holdtime - new Date().getTime()), 'whisper');
				return;
			}
			notesoup.say('', 'whisper');
			delete this.holdtime;
		}
		
		if (this.holding()) {
			notesoup.say('Holding for condition: ' + this.holdcondition, 'whisper');
			return;
		}

		while (this.running && !this.holdtime && !this.holding()) this.processline();
	},


	savevalue: function() {
		var inputcontrol = Ext.get(this.getFieldID('input'));
		if (inputcontrol) {
			this.value = inputcontrol.getValue();
			this.save();
			this.think('saved.');
		}
	},

	run: function() {
		this.reset();
		this.starttime = new Date().getTime();
		//this.put($n('preso').text);
		this.put(Ext.get(this.getFieldID('input')).getValue());
		this.running = true; 
	},
	
	pause: function() { this.running = false; },

	reset: function() {
		this.pause();
		this.callstack = [];
		this.payloadoffset = 0;
		delete this.holdtime;
		delete this.holdcondition;
	},

	clean: function() {
		this.reset();
		for (var n in notesoup.notes) {
			if (notesoup.notes[n].imports || (n == this.id) || (notesoup.notes[n].notename == 'preso')) continue;
			notesoup.deleteNote(n);
		}
	},

	makeButton: function(buttonname, funcname) {
		return [
			'<input type="submit" value="', buttonname, '"',
			' onclick="notesoup.ui.getEnclosingNote(this).', funcname, '();"/>'
		].join('');
	},

	buttons: [
		['save', 'savevalue'],
		['run', 'run'],
		['pause', 'pause'],
		['reset', 'reset'],
		['clean', 'clean']
	],

	onrender: function() {
		var o = [];
		o.push('<br/>',
			//'Run:&nbsp;',
			//'<input type="text" name="', this.getFieldID('input'),
			//'" size="30" id="', this.getFieldID('input'), '" value="@@preso" /><hr/>'
			'<textarea name="', this.getFieldID('input'),
			'" cols="40" rows="10" id="', this.getFieldID('input'), '">',
			this.value || '@@preso',
			'</textarea>',
			'<hr/>'
		);

		o.push('<center>');
		for (var i=0; i<this.buttons.length; i++) {
			o.push(this.makeButton(this.buttons[i][0], this.buttons[i][1]));
		}
		o.push('</center>');
		this.setContentDiv(o.join(''));
	}
});
note.init();} catch(e) {notesoup.say('widget load error: ' + notesoup.dump(e), 'error');}
</script>
Loading...