/*
	soupnote.js

	Copyright (c) 2007, Bill Roy
	This file is licensed under the Note Soup License
	See the file LICENSE that comes with this distribution
*/

// The soupnote Object, wherefrom all Notes are derived.

function soupnote(options) {
	this.set(options);
};


soupnote.prototype.set = function(options) {
	for (var o in options) {
		if (notesoup.debugmode > 6) 
			notesoup.debug('soupnote.set option: ' + o + ' ' + options[o]);
		this[o] = options[o];
	}
};


// Scripty stuff
soupnote.prototype.run = function() {
	return this.calleventhandler('text');	// just pass the text field in as a script...
};

// A way to eval a string with "this" equal to the note
soupnote.prototype.eval = function(str) {

	if (!notesoup.runScripts) return null;

	try {
		return eval(str);
	} catch (e) {
		notesoup.say('Script error: ' + notesoup.dump(e) + ' in ' + this.id + '.eval(' + str + ')');	
	}
};

soupnote.prototype.calleventhandler = function(handlername, arg) {

	if (!notesoup.runScripts) return null;

	if (handlername in this) {
		//notesoup.updateActivityIndicator('ontick',true);
		if (notesoup.debugmode > 6) {
			notesoup.debug('Event: ' + this.id + '.' + handlername + '=' + this[handlername]);
			notesoup.alert('Event: ' + this.id + '.' + handlername + '=' + this[handlername]);
		}

		try {
			if (typeof(this[handlername]) == 'string') {
				//return eval(this[handlername]);
				// strip html
				return eval(Ext.util.Format.stripTags(this[handlername]));
			}
			else if (typeof(this[handlername]) == 'function') {
				return this[handlername](arg);
			}
			else throw('Unknown handler type');
		} catch(e) {
			notesoup.stopScripts();
			notesoup.alert('Script error: ' + e + ' in ' + this.id + '.' + handlername + '..in...' + this[handlername]);
		}
		//notesoup.updateActivityIndicator('ontick',false);
	}
};

soupnote.prototype.toJSON = function() {
	return Ext.util.JSON.encode(this);
};

soupnote.prototype.toString = function() {
	return this.toJSON();
};


// Return the content DIV associated with this note
//
// =$n('stage').getContentDiv().innerHTML = '<h1>Hello, world!</h1>';
//
soupnote.prototype.getContentDiv = function() {
	return $(this.id + notesoup.ui.contentSuffix);
	//var win = Windows.getWindow(this.id + '_win');
	//return win.getContent();
};


// Set the innerHTML of the content DIV associated with this note
//
// =$n('stage').setContentDiv('<h1>Hello, world!</h1>');
//
soupnote.prototype.setContentDiv = function(markup) {
	var t = new Ext.Template(markup);
	t.overwrite(this.getContentDiv(), this);
	//this.getContentDiv().innerHTML = markup;
	//this.syncDivs();
};


// Refresh the UI representation of this note
soupnote.prototype.show = function() {
	if (!notesoup.ui.existsDOMNote(this)) notesoup.ui.createDOMNote(this);
	this.onrender();
	if ('showme' in this) delete this.showme;
};

soupnote.prototype.save = function(tofolder) {
	notesoup.saveNote(this, tofolder);
};

soupnote.prototype.toFront = function() {
	this.zIndex = notesoup.ui.getTopZ();
	$(this.id + notesoup.ui.divSuffix).style.zIndex = this.zIndex;
};

soupnote.prototype.toBack = function() {
	this.zIndex = 0;
	$(this.id + notesoup.ui.divSuffix).style.zIndex = 0;
};

// Append text to a note
//	=$n('log').append('hello world')
soupnote.prototype.append = function(thetext) {
	notesoup.appendToNote(thetext, this.id);
};

// flash a special effect flourish highlighting the note in the specified color
soupnote.prototype.flash = function(theColor) {
	if (notesoup.syncCount < 2) return;
	window.setTimeout(
		'Ext.get(' + this.id + notesoup.ui.contentSuffix + ').frame("' + theColor + '", 1);', 50);
};

// move a note an increment dx,dy
soupnote.prototype.bump = function(dx, dy) {
	var thisDiv = Ext.get(this.id + notesoup.ui.divSuffix);
	this.xPos = Math.max(0, this.xPos + dx);
	this.yPos = Math.max(0, this.yPos + dy);
	thisDiv.moveTo(this.xPos, this.yPos, {duration: 0.15});
	this.skuffle(this.xPos, this.yPos);
};

soupnote.prototype.isIn = function(x, y) {
	return ((x >= this.xPos) && (x <= (this.xPos + this.width)) && 
		(y >= this.yPos) &&  (y <= (this.yPos + this.height)));
};


// Make room for a note by pushing the notes below it out of the way a bit.
//
soupnote.prototype.skuffle = function(myNewX, myNewY) {
	var thenote = this;
	if (!(thenote.height > 20)) notesoup.say("OOPS: thisnote.height < 20 in skuffle: [" + thenote.height + "]");
	var myCenterX = myNewX + (thenote.width/2);
	var myCenterY = myNewY + (thenote.height/2);
	//var myRadius = Math.sqrt((thenote.width * thenote.width) + (thenote.height * thenote.height));

	for (var n in notesoup.notes) {
		if (n == thenote.id) continue; // ;)
		var othernote = notesoup.notes[n];
		if (!(othernote.height > 20)) notesoup.say("OOPS: othernote.height < 20 in skuffle: [" + othernote.height + "]");
		var otherCenterX = othernote.xPos + (othernote.width/2);
		var otherCenterY = othernote.yPos + (othernote.height/2);

		var rawdx = otherCenterX - myCenterX;
		var rawdy = otherCenterY - myCenterY;
		var ourSeparation = Math.sqrt((rawdx * rawdx) + (rawdy * rawdy));
		if (othernote.isIn(myNewX, myNewY) || 
			othernote.isIn(myNewX + this.width, myNewY) || 
			othernote.isIn(myNewX, myNewY + this.height) || 
			othernote.isIn(myNewX + this.width, myNewY + this.height)) {
//		if (ourSeparation < myRadius) {
			var scaleFactor = 5;
			var dx = scaleFactor * (rawdx / ourSeparation);
			var dy = scaleFactor * (rawdy / ourSeparation);
			othernote.bump(dx, dy);
		}
	}
};

soupnote.prototype.fields = function() {
	var fieldlist = [];
	for (var f in this)
		if (typeof(this[f]) != 'function')
			fieldlist.push(f);

	return fieldlist.sort();
};


//soupnote.prototype.ontick = function() {
//	for (var n in notesoup.notes) {
//		if (n == this.id) continue; // ;)
//		var othernote = notesoup.notes[n];
//		if (othernote.isIn(this.xPos - 15, this.yPos)) return;
//	}
//	this.bump(-10, 0);
//};

soupnote.prototype.setRenderFunc = function(renderFunc) {
	this.onrender = renderFunc;
	this.showme = true;
};

soupnote.prototype.onrender = function() {

	if (notesoup.debugmode) notesoup.debug('default-render ' + this.id);

	var theDiv = Ext.get(this.id);
	var outerDiv = Ext.get(this.id + notesoup.ui.divSuffix);
	outerDiv.setXY([this.xPos, this.yPos], {duration: 0.8});
	outerDiv.setSize(this.width, this.height, {duration: 0.8});

	this.displayText = this.text || '<br/>';

	if ((this.notetype == 'proxy') && !(this.proxysavethrough == true)) {

		isHardProxy = true;

		// Handle remote vs. local 'proxyfor' URI: local objects are mounted at /object/username/foldername/objectname
		var src = '';
		if ((this.proxyfor.substring(0, 5) == 'http:') || (this.proxyfor.substring(0, 6) == 'https:')) {
			src = this.proxyfor;
		}
		else src = '/data/soupbase/' + this.proxyfor;

		// Special handling for images
		if (notesoup.ui.isImageFile(src)) {
			this.displayText = "<a href='" + src + "' target='_blank'><img src='" + src + "' style='width:100%;'/></a>" + this.displayText;
		}
		else {
			this.displayText = this.displayText + "<br/><a href='" + src + "' target='_blank'>" + src + "</a>"
		}
	}

	if (this.opacity != undefined) {
		outerDiv.setStyle('opacity', '' + this.opacity);
		//theDiv.dom.style.opacity = this.opacity;
	}

	if (!('zIndex' in this) || (typeof(this.zIndex) != 'number') || 
		(this.zIndex < 0)) {
		if ('zIndex' in this) notesoup.say('Bogus zIndex fixed for: ' + this.id);
		this.toFront();
	}
	else outerDiv.setStyle('zIndex', this.zIndex);

	notesoup.ui.noteTemplate.overwrite(theDiv.dom, this);
	delete this.displayText;

	//this.syncDivs();

	Ext.get(this.id + '_menu').on('click', notesoup.ui.showNoteMenu);
	if (navigator.userAgent.search('iPhone') < 0) Ext.get(this.id + '_menu').hide()

	//this.flash('#000080');

	// Eval the script fragments: set up 'this' to be the note
	////setTimeout(function() {divmarkup.evalScripts()}, 25);		// makes 'this' = 'window'
	//setTimeout(function() {
	//	divmarkup.extractScripts().map( function(script) { return this.eval(script); });
	//}, 25);

};


soupnote.prototype.fieldeditor = function() {

	var FieldRecord = Ext.data.Record.create([
		{name: 'name', mapping: 'name'},
		{name: 'value', mapping: 'value'}
	]);

	var fieldlist = this.fields();
	var fieldrecords = [];
	for (var i=0; i < fieldlist.length; i++) {
		fieldrecords.push({name: fieldlist[i], value: this[fieldlist[i]]});
	}

	var ds = new Ext.data.Store({
		proxy: new Ext.data.MemoryProxy(fieldrecords),
		reader: new Ext.data.ArrayReader({id:'name'}, FieldRecord)
	});
	ds.load();

	var cm = new Ext.grid.ColumnModel([
		{header: "Name", dataIndex: 'name'},
		{header: "Value", dataIndex: 'value',
			editor: new Ext.grid.GridEditor(new Ext.form.TextArea({
				grow: true,
				allowBlank: true
           }))}
	 ]);
	cm.defaultSortable = true;

	var f = new Ext.form.Form({labelAlign: 'top', hideLabels:true});
	f.fieldset({id: this.id + '_grid', legend: ''});
	f.addButton('Add field...', this.addfield, this);
	f.addButton('Done', this.endfieldeditor, this);

	var contentid = this.id + notesoup.ui.contentSuffix;
	var contentdiv = Ext.get(contentid);
	contentdiv.dom.innerHTML = '';
	f.render(contentdiv);
	if (this.bgcolor) $(this.id + notesoup.ui.contentSuffix).style.background = this.bgcolor;

	var gridHole = Ext.get(this.id + '_grid');
	var gridDiv = gridHole.createChild({tag: 'div'});
	
    var grid = new Ext.grid.EditorGrid(gridDiv, {
        ds: ds,
        cm: cm,
        minColumnWidth: 15,
        autoHeight: true,
        autoSizeColumns: true,
        autoSizeHeaders: true,
        enableColumnMove: true, 
        stripeRows: true,
        enableColLock:false
    });
	grid.render();
	grid.on('afteredit', function(o) {
		notesoup.say('afteredit: ' + this.id + ' ' + o.record.get('name') + ' ' + o.field + ' ' + o.value + ' ' + o.originalValue + ' ' + o.row + ' ' + o.column);
		var field = o.record.get('name');
		if (field == 'id') {
			notesoup.renameNote(this, o.value);
		}
		else {
			notesoup.say('Setting ' + field + ' to ' + o.value);
			this[field] = o.value;
			//this.show();
			this.save();
		}
	}, this);

	this.editing = true;
};

soupnote.prototype.endfieldeditor = function() {
	delete this.editing;
	this.onrender = soupnote.prototype.onrender;
	this.showme = true;
};

soupnote.prototype.addfield = function() {
	var newfield = notesoup.prompt('New field name:', '');
	if ((newfield.length > 0) && (!(newfield in this))) {
		this[newfield] = '';
		this.showme = true;
	}
};

soupnote.prototype.plaintexteditor = function() {
	return this.setupeditor(true);
};

soupnote.prototype.htmleditor = function() {
	return this.setupeditor(false);
};

soupnote.prototype.setupeditor = function(rawEdit) {

	var e = new Ext.form.Form({labelAlign: 'top', hideLabels:true});

	var editor = rawEdit ? new Ext.form.TextArea( {
		clientID: this.id,
		hideLabels: true,
		width: this.width - 28,
		height: Math.max(100, this.height)
	}) : 
	new Ext.form.HtmlEditor({
		clientID: this.id,
		hideLabels: true,
		width: this.width - 28,
		height: Math.max(100, this.height - 85)
	});
	editor.setValue(this.text);
	e.container({}, editor).hideLabels = true;
	e.addButton('Save', notesoup.endhtmleditorSave, editor);
	e.addButton('Cancel', notesoup.endhtmleditorCancel, editor);

	var contentid = this.id + notesoup.ui.contentSuffix;
	var contentdiv = Ext.get(contentid);
	contentdiv.dom.innerHTML = '';
	e.render(contentdiv);

	//var syncLater = 'notesoup.notes["' + this.id + '"].syncDivs();'
	//window.setTimeout(syncLater, 500);
	this.editing = true;
};

notesoup.endhtmleditorSave = function() { 
	return notesoup.notes[this.clientID].endhtmleditor(true, this.getValue());
}
notesoup.endhtmleditorCancel = function() { 
	return notesoup.notes[this.clientID].endhtmleditor(false, '');
}

soupnote.prototype.endhtmleditor = function(saveChanges, newValue) {
	delete this.editing;
	this.onrender = soupnote.prototype.onrender;
	if (saveChanges) {
		this.text = newValue;
		this.save();
	}
	this.showme = true;
};

soupnote.prototype.syncDivs = function() {

	//Ext.get(this.id + notesoup.ui.divSuffix).autoHeight(false, 0);  // onComplete, easing	

	//// reset outer div to autosized inner container
	var bottomright = Ext.get(this.id + '_br');
	var outerDiv = Ext.get(this.id + notesoup.ui.divSuffix);
	this.height = (bottomright.getTop() + bottomright.getHeight()) - outerDiv.getTop() + 1;
	outerDiv.setHeight(this.height);
};


// mouseover for content scrolling not quite working
// when set to content div, only reports out when over text
// over an image proxy, essentially no notifications are generated.
// need solution that tracks while over anything - possibly put up a div to track over?
//
//=Ext.get($n('test').id+notesoup.ui.contentSuffix).on('mouseover', soupnote.prototype.xtrack, $n('test'))
//
soupnote.prototype.xtrack = function(event) {
	var mousex = event.getPageX();
	var target = Ext.get(event.getTarget());
	var targetx = target.getX();
	var targetwidth = target.getWidth();

	if ((mousex < targetx) || (mousex > (targetx + targetwidth))) return -1;
	var xtrackpct = 100 * ((mousex-targetx) / targetwidth);
	notesoup.whisper(xtrackpct);
};


//=$n('alpha').getFeed('http://slashdot.org/index.xml');
soupnote.prototype.getFeed = function(feedurl) {
	Ext.Ajax.request({
		method: 'GET',
		url: 'http://pingdog.net/getfeed/getfeed.py',
		params: {rssuri: feedurl},
		success: this.getFeedHandler,
		scope: this
	});
	notesoup.say('Feed request sent...');

};

soupnote.prototype.getFeedHandler = function(response, success, options) {
	if (success) {
		notesoup.say('Well we got our RSS data back...');
		this.text = response.responseText;
		this.show();
	} else this.say('Error fetching feed.', 'error');
};

// $n returns the note whose title is passed in the argument
// the first match is returned, so the results are unpredictable if there
// are multiple notes with the same title
notesoup.$n = function(notename) {
	for (var n in notesoup.notes) {
		if (notesoup.notes[n].notename == notename)
			return notesoup.notes[n];
	}
	//throw('No such note: ' + notename);
	return undefined;
};

$n = notesoup.$n;		// for convenience

soupnote.prototype.print = function(s) {
	if (!this.stdout) {
		var winname = 'Note Soup Output';
		if (this.notename) winname += ' for ' + this.notename;
		this.stdout = window.open('','notesoup-output', 'resizable=1,scrollable=1,width=600,height=400');
	}
	if (!this.stdout) alert('oops print');
	this.stdout.document.write(s + '<br/>\n');
};

soupnote.prototype.flushprint = function(opts) {
	if (this.stdout) {
		this.stdout.document.close();
		delete this.stdout;
	}
};

// end of soupnote.js
