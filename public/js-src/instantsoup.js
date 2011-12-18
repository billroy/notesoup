/*
	instantsoup.js: Note Soup Bookmarklet Injection and Startup
	Copyright (c) 2007, Bill Roy
	This file is licensed under the Note Soup License
	See the file LICENSE that comes with this distribution

	Here is bookmarklet code to start this script from an arbitrary web page:
	javascript:function%20boot(url){var%20s=document.createElement('script');s.setAttribute('language','javascript');s.setAttribute('src',url);document.body.appendChild(s);}boot('http://localhost/~bill/stikiwiki/js-src/instantsoup.js');

	TODO:
	- baseurl ugliness
		- here
		- notesoup.js/postRequest
		- in the startup bookmarklet
		- passed into ns.init below for image file url's
	- generate draggable bookmarklet in the UI somewhere (pending URI issue)
	- cleaner exit.  leaves junk around in safari.  can't restart.
	- load over empty page fails because there's no head
*/
var instantsoup = {

	version: 'instantsoup v0.1j: ',
	baseuri: 'http://localhost/~bill/stikiwiki/',
	//baseuri: 'http://sandbox.notesoup.net/',
	verbose: false,
	cleanuplist: [],

	loadScript: function(scripturl) {
		var parentelement = document.getElementsByTagName('head')[0] || document.body;
		try {
			var scriptelement = document.createElement('script');
			scriptelement.type = 'text/javascript';
			scriptelement.src = this.baseuri + scripturl;
			parentelement.appendChild(scriptelement);
		} catch (e) {
			alert('Exception loading: ' + scripturl, 'error');
		}
		this.cleanuplist.push(scriptelement);
		return true;
	},

	loadStyle: function(cssurl) {
		// TODO: Handle no-head (blank doc) case?
		var parentelement = document.getElementsByTagName('head')[0] || document.body;
		try {
			var linkelement = document.createElement('link');
			linkelement.type = 'text/css';
			linkelement.rel = 'stylesheet';
			linkelement.href = this.baseuri + cssurl;
			parentelement.appendChild(linkelement);
		} catch (e) {
			alert('Exception loading: ' + cssurl + ' ' + e, 'error');
		}
		this.cleanuplist.push(linkelement);
		return true;
	},
	
	makeDiv: function(divname, classname, prepend) {
		//if (document.getElementByID(divname) != undefined) return true;
		var newdiv = document.createElement('div');
		newdiv.id = divname;
		if (classname) newdiv.className = classname;
		//document.body.appendChild(newdiv);

		var f = document.body.firstChild;
		if (f && prepend) document.body.insertBefore(newdiv, f);
		else document.body.appendChild(newdiv);
		this.cleanuplist.push(newdiv);
		return true;
	},
	
	waitFor: function(s) {
		if (typeof(s) == 'string') return eval(s);
		if (typeof(s) == 'function') return s();
		alert('waitFor oops');
		return false;
	},

	say: function(s) {
		s = instantsoup.version + s;
		//console.log(s); 
		window.status = s;
		return true;
	},

	bootcount: 0,
	bootcountmax: 1000,

	bootstage: 0,
	endBoot: function() {this.bootstage = this.bootrecipe.length;},

	bootrecipe: [
		'instantsoup.say("Instant Soup here!  ...booting from ' + this.baseuri + ' ...");',
		//'instantsoup.makeDiv("notezone", "notezone", true);',
		'instantsoup.makeDiv("toolbar", "toolbar", true);',
		'instantsoup.makeDiv("notificationwindow", "notificationwindow");',
		'instantsoup.makeDiv("notegrid");',
		'instantsoup.loadStyle("resources/css/ext-all.css");',
		'instantsoup.loadStyle("css/notesoup.css");',
		'instantsoup.loadScript("js/ext-base.js");',
		'instantsoup.waitFor("(typeof(Ext) == \'object\')");',
		'instantsoup.loadScript("js/ext-all-debug.js");',
		'instantsoup.waitFor("(typeof(Ext.onReady) == \'function\')");',
		//'Ext.onReady(function() {instantsoup.ExtReady = true;}, instantsoup, true);',
		//'instantsoup.waitFor("instantsoup.ExtReady");',
		'instantsoup.loadScript("js/miso.js");',
		'instantsoup.waitFor("(typeof(notesoup) == \'object\')");',
		'instantsoup.waitFor("(typeof(notesoup.initialize) == \'function\')");',
		'instantsoup.waitFor("(typeof(notesoup.ui) == \'object\')");',
		'instantsoup.waitFor("(typeof(notesoup.ui.initialize) == \'function\')");',
		'notesoup.initialize({username:"user", foldername: "user/inbox", frombookmarklet: true, syncInterval: 60, imageHost: instantsoup.baseuri});true;',
		'instantsoup.waitFor("notesoup.initialized");',
		'instantsoup.say("Boot complete.");'
	],
	
	tryagainlater: function(timeout) {
		if (this.verbose) this.say('tryagainlater...');
		return window.setTimeout('instantsoup.boot();', timeout || 10);
	},
	
	boot: function() {
	
		if (++this.bootcount > this.bootcountmax) {
			alert('Boot failure - timeout at stage: ' + this.bootstage + ': ' + this.bootrecipe[this.bootstage]);
			this.endBoot();
			return;
		}

		while (this.bootstage < this.bootrecipe.length) {
			try {
				if (this.verbose) this.say('' + this.bootstage + ': ' + this.bootrecipe[this.bootstage] + ' ' + this.bootcount);
				// these two lines are the state engine, grasshopper
				if (eval(this.bootrecipe[this.bootstage])) this.bootstage++;
				else return this.tryagainlater();
			} catch (e) { 
				alert('Boot failure - exception: ' + e.message + ' at line ' + e.linenumber + ' in stage ' + this.bootstage + ' ' + this.bootrecipe[this.bootstage] + ' ' + e.stack); 
				this.endBoot();
			};
		}
	},
	
	cleanup: function() {
		for (var i=this.cleanuplist.length-1; i>=0; i--) {
			if (this.verbose) this.say('deleting item ' + i);
			Ext.get(this.cleanuplist[i]).remove();
		}
		this.say('So long!');
	}
};
instantsoup.boot();
