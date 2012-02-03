/**
*	soupnote.js - methods of the note
*
*	Copyright 2007, 2008 Bill Roy
*	This file is licensed under the Note Soup Client License
*	See http://notesoup.net/js/LICENSE
*/

/**
*	The soupnote Object, wherefrom all Notes are derived.
*	@constructor
*/
function soupnote(options) {
	this.set(options);
};


/**
*	extend the soup object by applying options from the passed-in dictionary
*	@param {object} options	a dictionary of extensions to the soup object
*/
soupnote.prototype.set = function(options) {
	for (var o in options) {
		if (notesoup.debugmode > 6) 
			notesoup.debug('soupnote.set option: ' + o + ' ' + options[o]);
		this[o] = options[o];
	}
};


/**
*	Scripty stuff
*/
/**
*	run a the note's text field as a script
*/
soupnote.prototype.run = function() {
	return this.calleventhandler('text');	// just pass the text field in as a script...
};


/**
*	eval a string with "this" equal to the note
*	@param {string} str	the string to evaluate
*/
soupnote.prototype.eval = function(str) {

	if (!notesoup.runScripts) return null;
	try {
		if (typeof(str) == 'string') return eval(str);
		if (typeof(str) == 'function') return str.apply(this);
		notesoup.say('oops eval','error');
	} catch (e) {
		notesoup.say('Script error: ' + notesoup.dump(e) + ' in ' + this.id + '.eval(' + str + ')');	
	}
};


/**
*	call a method of the note, passing arguments
*	if the method is a function we call it as normal
*	if the method is a string we eval it with 'this' set to the note
*	this lets us persist function-like objects on notes
*	(which otherwise our JSON storage does not persist)
*	which is a security consideration, isn't it
*	@param {string} handlername	the method of the note to call
*	@param {any} arg an argument to pass to the method
*/
soupnote.prototype.calleventhandler = function(handlername, arg) {

	if (!notesoup.runScripts) return null;

	if (handlername in this) {
		//notesoup.updateActivityIndicator('ontick',true);
		if (notesoup.debugmode > 6) {
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
			notesoup.say('Script error: ' + e + ' in ' + this.id + '.' + handlername + '..in...' + this[handlername], 'error');
		}
		//notesoup.updateActivityIndicator('ontick',false);
	}
	return false;
};

/**
*	return a string containing the JSON representation of a note
*
*/
soupnote.prototype.toJSON = function() {
	return Ext.util.JSON.encode(this);
};

/**
*	equivalent to toJSON, for those who may expect it
*/
soupnote.prototype.toString = function() {
	return this.toJSON();
};


/**
*	Return the content DIV associated with this note
*
*	=$n('stage').getContentDiv().innerHTML = '<h1>Hello, world!</h1>';
*/
soupnote.prototype.getContentDiv = function() {
	return $(this.id + notesoup.ui.contentSuffix);
};


/**
*	Set the innerHTML of the content DIV associated with this note
*	@params {string} markup	the html with which to overwrite the element
*	=$n('stage').setContentDiv('<h1>Hello, world!</h1>');
*/
soupnote.prototype.setContentDiv = function(markup) {
	var thediv = this.getContentDiv();
	if (!thediv) {
		//notesoup.say('div not ready');
		return;
	}

	var t = new Ext.Template(markup);
	t.overwrite(thediv, this);

	//this.getContentDiv().innerHTML = markup;
	//this.syncDivs();
};


/**
*	save the note
*	@param {string} tofolder	optional destination folder
*/
soupnote.prototype.save = function(tofolder) {
	//notesoup.say('save ' + this.id + ' ' + this.text, 'tell');
	notesoup.saveNote(this, tofolder ? tofolder : notesoup.foldername);
};


/**
*	delete the note (which is to say, issue the command to send it to the trash folder)
*	the server sends a deleteNote when the move is complete
*/
soupnote.prototype.destroy = function() {
	notesoup.deleteNote(this.id);
};


/**
*	bring the note to the frontmost display zIndex
*/
soupnote.prototype.toFront = function() {
	this.zIndex = notesoup.ui.getTopZ();
	$(this.id + notesoup.ui.divSuffix).style.zIndex = this.zIndex;
};


/**
*	push the note back to the backmost (zeroeth) display zIndex
*/
soupnote.prototype.toBack = function() {
	this.zIndex = 0;
	$(this.id + notesoup.ui.divSuffix).style.zIndex = 0;
};


/**
*	Append text to a note's text field
*	@param {string}	thetext	the text to append
*
*	=$n('log').append('hello world')
*/
soupnote.prototype.append = function(thetext) {
	notesoup.appendToNote(thetext, this.id);
};


/**
*	Flash a special effect flourish highlighting the note in the specified color
*	@param {string} theColor	the color to flash
*	@param {integer} frameCount	the number of flashes (more than 3 is excessive)
*/
soupnote.prototype.flash = function(theColor, frameCount) {
	if (!theColor) theColor = 'red';
	if (!frameCount) frameCount = 1;
	if (notesoup.syncCount < 1) return;
	var outerDiv = Ext.get(this.id + notesoup.ui.divSuffix);
	if (outerDiv) {
		outerDiv.syncFx();
		outerDiv.frame(theColor, frameCount);
	}
	//window.setTimeout('Ext.get(' + this.id + notesoup.ui.divSuffix + ').frame("' + theColor + '", 1);', 100);
};


/**
*	Move a note an increment dx,dy
*/
soupnote.prototype.bump = function(dx, dy, skuffle) {
	var thisDiv = Ext.get(this.id + notesoup.ui.divSuffix);
	this.xPos = Math.max(0, this.xPos + dx);
	this.yPos = Math.max(0, this.yPos + dy);
	thisDiv.moveTo(this.xPos, this.yPos, {duration: notesoup.ui.defaultEffectsDuration});
	if (skuffle) this.skuffle(this.xPos, this.yPos);
};


/**
*	Move a note to x,y
*/
soupnote.prototype.moveTo = function(x, y) {
	var thisDiv = Ext.get(this.id + notesoup.ui.divSuffix);
	this.xPos = x;
	this.yPos = y;
	thisDiv.moveTo(this.xPos, this.yPos, {duration: notesoup.ui.defaultEffectsDuration});
};


/**
*	return true if the passed in point (x,y) is inside this note
*/
soupnote.prototype.isIn = function(x, y) {
	return ((x >= this.xPos) && (x <= (this.xPos + this.width)) && 
		(y >= this.yPos) &&  (y <= (this.yPos + this.height)));
};


/**
*	Make room for a note by pushing the notes below it out of the way a bit.
*	@param	{integer}	myNewX	new xpos for the note when all is done
*	@param	{integer}	myNewY	new ypos for the note when all is done
*/
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


/**
*	Return a list of the fields in this note; functions are not included.
*/
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


/**
*	Set the render function for the note; shows the note as a side-effect.
*	@param {function}	renderFunc
*/
soupnote.prototype.setRenderFunc = function(renderFunc) {
	this.onrender = renderFunc;
	//this.showme = true;
	this.show();
};


/**
*	Refresh the UI representation of this note.
*/
soupnote.prototype.show = function() {

	try {
		if (!notesoup.ui.existsDOMNote(this)) notesoup.ui.createDOMNote(this);

		this.rendercontainer();

		// old-school direct display method: renders directly to the div
		if (typeof(this.onrender) == 'function') this.onrender();

		//else if (typeof(this.render) == 'function') {	
		//	var elt = Ext.get(this.id);
		//	if (elt) elt.update(this.render(), true);	// true to load scripts
		//	else return;
		//}
	
		else {									// by default, this is how we do it
			var elt = Ext.get(this.id);
			//console.log('.show id=' + this.id);
			//console.dir(this)
			if (elt) {
				//var markup = this.rendernote();
				//alert(markup.replace(/</g, '&lt;'));
				//console.log('render: ' + (this.notename || this.id || '?'));
				//elt.update(this.rendernote(), true, function() {notesoup.say('rendered');});	// true to load scripts
				//elt.update.defer(5, elt, [this.rendernote(), true]);	// true to load scripts
				//elt.update(this.rendernote(), notesoup.notes[this.id]);	// true to load scripts

				var script = 'var note=notesoup.notes["' + this.id + '"];';
				elt.update(this.rendernote(), script);	// true to load scripts
			}
			else {
				notesoup.say('oops elt update', 'error');
				return;
			}
		}
	} catch (e) {
		var name = this.notename || 'untitled';
		notesoup.say('Exception rendering note ' + name + '(' + this.id + '): ' + notesoup.dump(e), 'error');
	}
	delete this.showme;

	// call the afterrender hook, if present
	if (typeof(this.afterrender) == 'function') this.afterrender();

	// some final thoughts
	if ((navigator.userAgent.search('iPhone') >= 0) || (navigator.userAgent.search('pera') >= 0)) {
		Ext.get(this.id + '_menu').on('click', notesoup.ui.showNoteMenu);
	}
	this.syncHeight.defer(20, this);
};


/**
*	Render the note container, independent of the contents.
*/
soupnote.prototype.rendercontainer = function() {

	if (notesoup.debugmode) notesoup.debug('soupnote.prototype.rendercontainer ' + this.id);

	var container = Ext.get(this.id + notesoup.ui.divSuffix);
	if (!container) notesoup.say('container not ready: ' + this.id, 'warning');
	if (container) {
		container.setXY([this.xPos, this.yPos], this.isGuest ? false : {duration: notesoup.ui.defaultEffectsDuration});

		//container.setSize(this.width, this.height, {duration: notesoup.ui.defaultEffectsDuration});
		//container.setSize(this.width, {duration: notesoup.ui.defaultEffectsDuration});
		//container.setWidth(this.width, false);
		//Ext.get(this.id + '_rz').resizeTo(this.height, this.width);

		if (this.opacity) container.setStyle('opacity', '' + this.opacity);
		if (this.zIndex) {
			if (typeof(this.zIndex) == 'string') this.zIndex = parseInt(this.zIndex);
			container.setStyle('zIndex', this.zIndex);
		}
		else this.toFront();
		container.on('dblclick', function(e) {
			var thenote = notesoup.notes[notesoup.ui.getNoteIDFromWindowID(this.id)];
			if (thenote.notetype == 'proxy') {
				window.open(thenote.proxyfor);
			}
			else if (thenote.onrender == soupnote.prototype.onrender) {
				thenote.edit(e);
			}
			return true;
		});
	}

	if (this.notename) {
		title = Ext.get(this.id + '_title');
		if (title) title.update(this.notename);
	}

	var content = Ext.get(this.id + notesoup.ui.contentSuffix);
	if (content) {
		content.setStyle('background', this.bgcolor || notesoup.ui.defaultNoteColor);	
		//content.setWidth(this.width, {duration: 0.35});
	}
	//this.syncHeight.defer(20, this);
};


/**
*	Set the opacity of the container.  The note.opacity is not touched.
*
*	@param {number} opacity
*/
soupnote.prototype.setOpacity = function(opacity) {
	var container = Ext.get(this.id + notesoup.ui.divSuffix);
	if (container) container.setStyle('opacity', '' + opacity);
};


/**
*	Set the size of the note container
*	@param {number} width
* 	@param {number} height
*/
soupnote.prototype.resizeTo = function(width, height) {
	var resizer = this.getEphemeral('extResizer');
	if (resizer) resizer.resizeTo(width, height);
	else notesoup.say('oops resizeTo', 'error');
};



/**
*	Generate and return the default markup to render a note.
*/
soupnote.prototype.rendernote = function() {

	if (notesoup.debugmode) notesoup.debug('soupnote.prototype.render ' + this.id);

	this.displayText = this.text || '<br/>';
	//if (this.displayText.search('<script') < 0) {
	//	//this.displayText = this.displayText.replace('\n', '<br/>');
	//	this.displayText = this.displayText.replace(/\n/g, '<br/>');
	//}	
	if (this.displayText.search('<') < 0) {
		this.displayText = this.displayText.replace(/\n/g, '\n<br/>');
	}	

	this.displaybg = this.bgcolor || notesoup.ui.defaultNoteColor;

	var thumb = false;
	var isimage = this.isimage;
	var isfolder = false;
	var isdoor = false;
	var islink = false;
	var template = notesoup.ui.noteTemplate;	// until proven otherwise

	if (this.template) {
		//if (notesoup.debugmode > 3)
		//	notesoup.say('Render with template: ' + this.template);

		// TODO: For performance, cache the template!

		template = new Ext.Template(this.template);
	}

	else if ((this.notetype == 'proxy') && !(this.proxysavethrough == true)) {

		// Handle remote vs. local 'proxyfor' URI: local objects are mounted at /object/username/foldername/objectname
		var src = '';
		if ((this.proxyfor.substring(0, 5) == 'http:') || (this.proxyfor.substring(0, 6) == 'https:')) {
			src = this.proxyfor;
			thumb = true;
		}
		else if (this.proxyfor.substring(0,5) == 'data:') {
			src = this.proxyfor;
			isimage = true;
		}
		else if (this.proxyfor.substring(0, 8) == '/folder/') {
			src = notesoup.imageHost + 'images/UII_Icons/80x80/exit.png';		//this.proxyfor;
			isimage = true;
			islink = true;
		}
		//else src = '/object/' + this.proxyfor;
		else src = this.proxyfor;

		// Special handling for images
		if (isimage || notesoup.ui.isImageFile(src)) {
			if (this.noframe || notesoup.noframe) {
				this.displayText = src;
				template = new Ext.Template([
					islink ? '<a href="{proxyfor}" target="_blank">' : '',
						'<img id="', this.getFieldID('image'),
							//'" src="{displayText}" width="' + this.width + '" onmousedown="return false;" ondragstart="return false;" />',
							'" src="{displayText}" width="' + this.width + '" />',
					islink ? '</a>' : '',
					"<div style='background:{displaybg}'>",
						"{notename}<br/>",
						"<div id='", this.id, "'_content'></div>",
					"</div>"
					].join(''));
			}
			else {
				this.displayText = [
					islink ? '<a href="' + src + '" target="_blank">' : '',
						//'<img src="', src, '" style="width:100%;" onmousedown="return false;" ondragstart="return false;"/>',
						'<img src="', src, '" style="width:100%;" />',
					islink ? '</a>' : ''
				].join('');

				if (('text' in this) && this.text && (this.text.length > 0)) this.displayText += '<hr/>' + this.text;
			}
		}
		else if (notesoup.ui.isMP3File(src)) {
			this.displayText = [
				'<img src="', notesoup.imageHost, 'images/UII_Icons/48x48/sound.png" onmousedown="return false;" ondragstart="return false;"/>',
				src,
				'<hr/><center>',
				'<input type="submit" value="play" onclick="notesoup.folderPlay(\'', src, '\');"/>',
				'</center><br/>'
			].join('');
		}
		else if (thumb) {	// thumbnail via ast service at /thumbnail
			//this.displayText = "<a href='" + src + "' target='_blank'><img src='/thumbnail?size=Large&uri=" + src + "' style='width:100%;'/></a>" + this.displayText;
			this.displayText = "&nbsp;<p><center><a href='" + src + "' target='_blank'><img src='/thumbnail?size=Large&uri=" + src + "'/></a></center>" + this.displayText;
			if (('text' in this) && this.text && (this.text.length > 0)) this.displayText += '<hr/>' + this.text;
		}
		else {
			var sparts = src.split('/');
			var filename = sparts[sparts.length - 1];
			this.displayText = [
				"<a href='" + src + "' target='_blank'>",
					'<img src="', 
						notesoup.imageHost, isdoor ? 'images/UII_Icons/80x80/exit.png' : 'images/UII_Icons/48x48/file.png',
					//'" onmousedown="return false;" ondragstart="return false;" />',
					'" />',
				"</a>", filename].join('');
			if (('text' in this) && this.text && (this.text.length > 0)) this.displayText += '<hr/>' + this.text;

		}
	}

	var markup = template.applyTemplate(this);
	delete this.displayText;
	delete this.displaybg;
	return markup;
};


/**
*	Adjust the outer div from our host UI to match the note height.
*/
soupnote.prototype.syncHeight = function() {

	//Ext.get(this.id + notesoup.ui.divSuffix).autoHeight(false, 0);  // onComplete, easing	

	//// reset outer div to autosized inner container
	var bottomright = Ext.get(this.id + '_br');
	var outerDiv = Ext.get(this.id + notesoup.ui.divSuffix);
	//if (!outerDiv) outerDiv = Ext.get(this.id);	// porthole
	if (bottomright && outerDiv) {
		this.height = (bottomright.getTop() + bottomright.getHeight()) - outerDiv.getTop() + 1;
		//outerDiv.setHeight(this.height, {duration: notesoup.ui.defaultEffectsDuration});
		outerDiv.setHeight(this.height);
	}
};

soupnote.prototype.slamHeight = function(h) {
	if (h) this.height = h;
	var outerDiv = Ext.get(this.id + notesoup.ui.divSuffix);
	if (outerDiv) {
		outerDiv.setHeight(this.height, {duration: notesoup.ui.defaultEffectsDuration});
	}
};



/**
*	Default renderproc for a note: show the note text and set up for editing.
*/
soupnote.prototype.deprecated_onrender = function() {

	Ext.get(this.id).update(this.getMarkup(), true);	// true to load scripts

	if (navigator.userAgent.search('iPhone') >= 0) {
		//Ext.get(this.id + '_menu').hide();
		Ext.get(this.id + '_menu').on('click', notesoup.ui.showNoteMenu);
	}

	// Eval the script fragments: set up 'this' to be the note
	////setTimeout(function() {divmarkup.evalScripts()}, 25);		// makes 'this' = 'window'
	//setTimeout(function() {
	//	divmarkup.extractScripts().map( function(script) { return this.eval(script); });
	//}, 25);
};


/**
*	Initiate text editing on the note.
*	@param {boolean} usePlaintext	optional flag to specify the plaintext instead of the HTML editor
*/
soupnote.prototype.edit = function(e) {
	this.toFront();

	if (e.ctrlKey) return this.editTitle();

	var usePlaintext = e.shiftKey;
	if (!this.editing) {
		this.setRenderFunc(usePlaintext ? soupnote.prototype.plaintexteditor : soupnote.prototype.htmleditor);
	}
};


/**
*	Start up the field editor on the note.
*/
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


	var editWidth = Math.max(300, this.width || 0);
	var editHeight = Math.max(250, this.height || 0);
	this.setEphemeral('savedWidth', this.width);
	this.setEphemeral('savedHeight', this.height);
	this.resizeTo(editWidth, editHeight);


	var cm = new Ext.grid.ColumnModel([
		{header: "Field Name", dataIndex: 'name'},
		{header: "Field Value", dataIndex: 'value',
			editor: new Ext.grid.GridEditor(new Ext.form.TextArea({
				grow: true,
				//does nothing: width: 300,		//editWidth,
				allowBlank: true
           }))}
	 ]);
	cm.defaultSortable = true;

	var fieldForm = new Ext.FormPanel( {
		labelAlign: 'top', 
		hideLabels:true,
		items: [{
			xtype: 'editorgrid',
			ds: ds,
			cm: cm,
			id: this.getFieldID('editorgrid'),
			minColumnWidth: 15,
			autoHeight: true,
			autoSizeColumns: true,
			autoSizeHeaders: true,
			enableColumnMove: true, 
			stripeRows: true,
			enableColLock:false,
			listeners: {
				'validateedit': {
					fn: this.validateedit,
					scope: this
				}
			}
		}],
		buttons: [{
			text: 'Add Field...',
			handler: this.addfield,
			scope: this
		}, {
			text: 'Done',
			handler: this.endfieldeditor,
			scope: this
		}]
	});

	var contentid = this.id + notesoup.ui.contentSuffix;
	var contentdiv = Ext.get(contentid);
	if (contentdiv) {
		contentdiv.dom.innerHTML = '';
		fieldForm.render(contentdiv);
		$(this.id + notesoup.ui.contentSuffix).style.background = this.bgcolor || notesoup.ui.defaultNoteColor;
	}
	this.setEphemeral('fieldForm', fieldForm);

	this.editing = true;
};


soupnote.prototype.validateedit = function(o) {
	//notesoup.say('afteredit: ' + this.id + ' ' + o.record.get('name') + ' ' + o.field + ' ' + o.value + ' ' + o.originalValue + ' ' + o.row + ' ' + o.column);
	var field = o.record.get('name');
	if (field == 'id') {
		//notesoup.renameNote(this, o.value);
		notesoup.say('Sorry, the id field is read-only.', 'error');
	}
	else {
		notesoup.say('Setting ' + field + ' to ' + o.value);
		this[field] = o.value;
		//this.show();
		this.save();
	}
	return true;
};


/**
*	Exit the field editor.
*/
soupnote.prototype.endfieldeditor = function() {
	delete this.editing;
	this.onrender = soupnote.prototype.onrender;
	this.show();
	this.resizeTo(this.getEphemeral('savedWidth') || notesoup.defaultNoteWidth,
		this.getEphemeral('savedHeight') || notesoup.defaultnoteHeight);
};


/**
*	Add a field to the note.  Used by the Field Editor.  The note is not saved.
*/
soupnote.prototype.addfield = function() {
	var newfield = notesoup.prompt('New field name:', '');
	if ((newfield.length > 0) && (!(newfield in this))) {
		this[newfield] = '';
		this.save();
	}
};


/**
*	Start editing with the plaintext editor.
*/
soupnote.prototype.plaintexteditor = function() {
	return this.setupeditor(true);
};


/**
*	Start editing with the HTML editor.
*/
soupnote.prototype.htmleditor = function() {
	return this.setupeditor(false);
};


/**
*	Worker function to start up the editor.
*/
soupnote.prototype.setupeditor = function(rawEdit) {

	var editWidth = Math.max(400, this.width || 0);
	var editHeight = Math.max(300, this.height || 0);
	this.setEphemeral('savedWidth', this.width);
	this.setEphemeral('savedHeight', this.height);

	this.editing = true;	// before resizeTo so's we don't save()
	this.resizeTo(editWidth, editHeight);

	var editForm = new Ext.FormPanel({
		hideLabels:true,
		width: editWidth - 20,
		border: false,
		bodyBorder: false,
		bodyStyle: 'background:' + (this.bgcolor || notesoup.ui.defaultNoteColor),
		items: [{
			xtype: rawEdit ? 'textarea' : 'htmleditor',
			id: this.getFieldID('editor'),
			hideLabels: true,
			width: editWidth - 36,
			height: rawEdit ? editHeight : editHeight - 85
		}],
		buttons: [{
			text: 'Save',
			handler: this.endEditSave,
			scope: this
		},{
			text: 'Cancel', 
			handler: this.endEditCancel,
			scope: this
		}],
		keys: [{
			key: 's',
			ctrl: true,
			handler: this.endEditSave,
			scope: this
		},{
			key: '~',
			handler: this.endEditCancel,
			scope: this
		}]
	});
	this.setEphemeral('editForm', editForm);
	this.setField('editForm', 'editor', this.text || '');

	var contentid = this.id + notesoup.ui.contentSuffix;
	var contentdiv = Ext.get(contentid);
	contentdiv.dom.innerHTML = '';
	editForm.render(contentdiv);
};


/**
*	End editing and save changes.
*/
soupnote.prototype.endEditSave = function(e) { 
	if (e && e.stopEvent) e.stopEvent();
	return this.endEdit(true, this.getField('editForm', 'editor'));
};

/**
*	End editing and discard changes.
*/
soupnote.prototype.endEditCancel = function(e) { 
	if (e && e.stopEvent) e.stopEvent();
	return this.endEdit(false, '');
};


/**
*	End editing worker.
*/
soupnote.prototype.endEdit = function(saveChanges, newValue) {

	this.resizeTo(this.getEphemeral('savedWidth') || notesoup.defaultNoteWidth,
		this.getEphemeral('savedHeight') || notesoup.defaultnoteHeight);
	delete this.editing;	// after resizeTo so's not to trigger save()

	this.onrender = soupnote.prototype.onrender;
	if (saveChanges) {
		// Prune off the nbsp that Ext's text edit sometimes provides
		if ((newValue.length >= 2) && (newValue.charCodeAt(0) == 0xc2) 
			&& (newValue.charCodeAt(1) == 0xa0)) this.text = newValue.substr(2);
		else this.text = newValue;

		// If this note originated as an import, and we just edited it,
		// remove the import specifier
		delete this.imports;

		this.save();
	}
	else this.show();
};


/**
*	Work in progress.
*/
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


/**
*	Fetch a URL into the note.
*	@params	url	the url to fetch
*	=$n('alpha').geturl('http://slashdot.org');
*	=$n('fonx').geturl('http://pingdog.net/countdown/cd.html')
*/
soupnote.prototype.geturl = function(url) {

	//notesoup.say('Fetching url: ' + url);
	var request = {
		method:"geturl",
		params:{ 
			url: url
		}
	};
	
	notesoup.postRequest(request, {
		successProc: this.getURLHandler,
		successProcScope: this,
		failureMessage: 'Could not fetch url.'
	}, true);		// true to force raw fetch
};

/**
*	Handler for geturl: process incoming data.  Override this for interesting fun.
*/
soupnote.prototype.getURLHandler = function(response, success, options) {
	if (success) {
		//notesoup.say('Fetch complete.');
		this.text = response.responseText;
	} else {
		notesoup.say('Error fetching url.', 'error');
	}
	this.show();
};


/** 
*	Feed cache
*	@constructor 
*/
notesoup.feedcache = {};


/**
*	Fetch a newsfeed in feedparser format (http://feedparser.org)
*	@param	{string} feedurl	the url to of the feed
*
*	=$n('alpha').getFeed('http://slashdot.org/index.xml');
*	=$n('alpha').getFeed('http://www.washingtonpost.com/wp-dyn/rss/linkset/2005/03/24/LI2005032400102.xml');
*	=$n('alpha').ontick="if (!('e' in this) || (this.e >= this.feed.entries.length)) this.e = 0;this.text = this.feed.entries[this.e++].summary||'huh?';this.show();"
*	=$n('beta').getFeed('http://forums.watchuseek.com/external.php?type=RSS2&amp;forumids=29')
*	feed://forums.watchuseek.com/external.php?type=RSS2&amp;forumids=29
*	feed://www.washingtonpost.com/wp-dyn/rss/linkset/2005/03/24/LI2005032400102.xml
*/
soupnote.prototype.getFeed = function(feedurl) {
	this.refreshtimelimit = 5 * 60;
	this.refreshcountdown = this.refreshtimelimit;
	this.entrytimelimit = 10;
	this.entrycountdown = 0;
	this.entry = -1;
	this.feedurl = feedurl;
	Ext.Ajax.request({
		method: 'GET',
		url: '/getfeed',
		params: {url: feedurl},
		disableCaching: false,
		success: this.getFeedHandler,
		scope: this
	});
	notesoup.say('Feed request sent...');
	//this.setContentDiv('Loading...');
	this.showLoading.createDelegate(this).defer(10);
};


/**
*	Format and display the specified rss feed item.
*	@param {number} entry	the index of the entry in feed[entries]
*/
soupnote.prototype.formatRSSItem = function(entry) {
	var t = '<b>' + entry['title'] + ': </b>' + entry['summary'];
	t += '<a href="' + entry['link'] + '" target="_blank"><img src="' + notesoup.imageHost + 'images/famfamfam.com/link.png"></a>';
	t += '<hr/>';
	t += '<h5>Updated: ' + entry['updated'] + '</h5>';
	return t;
};


/**
*	Handler for getfeed: process incoming feed data.
*	@param {object} response	the response object
*	@param {boolean} success	true if we got a feed back
*/
soupnote.prototype.getFeedHandler = function(response, success) {
	if (success) {
		this.setContentDiv('Feed data received.');
		var feed = Ext.util.JSON.decode(response.responseText);
		if (feed.bozo) {
			this.setContentDiv('Server reports a format error in feed data.');
			return;
		}
		notesoup.feedcache[this.feedurl] = feed;
		this.notename =	feed.feed.title || this.notename || '';
		notesoup.say('Received ' + feed.entries.length + ' entries');
		this.refreshcountdown = Math.max(this.refreshtimelimit, feed.entries.length * this.entrytimelimit);

		if (!this.onload) {
			this.onload = '{this.getFeed(this.feedurl);}';
			this.save();
		}

		this.ontick = function() {
			//notesoup.say('tick: ' + this.refreshcountdown + ' ' + this.entrycountdown, 'whisper');
			if (--this.refreshcountdown <= 0) {
				this.refreshcountdown = this.refreshtimelimit;
				this.entrycountdown = this.entrytimelimit;
				notesoup.say('Refreshing ' + this.notename + '...');
				return this.getFeed(this.feedurl);
			}
			if (--this.entrycountdown <= 0) {
				this.entrycountdown = this.entrytimelimit;
				if (++this.entry >= notesoup.feedcache[this.feedurl].entries.length) this.entry = 0;
				this.setContentDiv(this.formatRSSItem(notesoup.feedcache[this.feedurl].entries[this.entry]));
			}
		};
	} else this.setContentDiv('Error fetching feed.');
};

/*
notesoup.registeredCommands.push(['feed://', 'Create an RSS feed widget', 
	function(feedurl) {
		notesoup.say('Creating RSS note...');
		notesoup.saveNote({
			feedurl: 'http://' + feedurl.substr(7),
			refreshcountdown: 60,
			refreshtimelimit: 60,
			entrytimelimit: 10,
			entrycountdown: 10,
			entry: 0,
			width: 300,
			height: 400,
			bgcolor: '#f8f8ff',
			onload: 'this.getFeed(this.feedurl);'
		});
	}]);
*/



/**
*	notesoup.$n returns the note whose title is passed in the argument.
*	If there are multiple matching notes, it is considered an error.
*	An error message is displayed and the conflicting notes are flashed.
*	@param {string} notename	the note title to search for
*/
notesoup.$n = function(notename) {
	var notelist = [];
	for (var n in notesoup.notes) {
		if (notesoup.notes[n].notename == notename)
			notelist.push(n);
	}
	switch (notelist.length) {
		case 0: return undefined;
		case 1: return notesoup.notes[notelist[0]];
		default:
			notesoup.say('Ambiguous formula reference to note: ' + notename, 'error');
			for (var i=0; i < notelist.length; i++)
				notesoup.notes[notelist[i]].flash('red', 3);
			return undefined;
	}
};

notesoup.$nq_TRYAGAINLATER = -1;
notesoup.$nq_NOTFOUND = null;

notesoup.$nq = function(query, folder, forcerefresh) {
	if (!folder) folder = notesoup.foldername;
	if (folder == notesoup.foldername) return $n(query);

	if (!notesoup.foldercache) notesoup.foldercache = {};

	if (forcerefresh || !notesoup.foldercache[folder]) {
		delete notesoup.foldercache[folder];
		notesoup.getNotes(folder);
		return notesoup.$nq_TRYAGAINLATER;
	}

	for (var n in notesoup.foldercache[folder].notes) {
		if (notesoup.foldercache[folder].notes[n].notename == query) {
			if (notesoup.debugmode > 4)
				notesoup.say('hit: ' + notesoup.dump(notesoup.foldercache[folder].notes[n]));
			return notesoup.foldercache[folder].notes[n];
		}
	}
	return notesoup.$nq_NOTFOUND;
};


/**
*	$n is a shortcut to notesoup.$n
*	$nq is a shortcut to notesoup.$nq
*/
var $n = notesoup.$n;
var $nq = notesoup.$nq;



/**
*	Print to a browser window.  Opens a window if needed.
*	@param	{string} s the string to print
*/
soupnote.prototype.print = function(s) {
	if (!this.stdout) {
		var winname = 'Note Soup Output';
		if (this.notename) winname += ' for ' + this.notename;
		this.stdout = window.open('','notesoup-output', 'resizable=yes,scrollbars=yes,width=600,height=400');
	}
	if (!this.stdout) alert('oops print');
	this.stdout.document.write(s + '<br/>\n');
};


/**
*	Finish printing to a browser window.  The next note.print() will open a new one.
*/
soupnote.prototype.flushprint = function() {
	if (this.stdout) {
		this.stdout.document.close();
		delete this.stdout;
	}
};


/**
*	cleanNote:	return a note stripped of its 'id' field and of any fields starting with '_'
*/
soupnote.prototype.cleanNote = function() {
	var cleanednote = {};
	for (var k in this) {
		if (k == 'id') continue;
		if (k == 'zIndex') continue;
		if (k == 'mtime') continue;
		if (k.charAt(0) == '_') continue;
		if (typeof(this[k]) == 'function') continue;
		cleanednote[k] = this[k];
	}
	return cleanednote;
};


/**
*	Ephemeral per-note storage: for things related to the note that we do not want persisted.
*	forms, for example
*	@constructor
*/
notesoup.ephemeral = {};


/**
*	Store a value in ephemeral per-note storage.
*	@param {string} key the key to store the data in
*	@param {string} value the data to store
*/
soupnote.prototype.setEphemeral = function(key, value) {
	//if (!'ephemeral' in notesoup) notesoup['ephemeral'] = {};
	if (!(this.id in notesoup.ephemeral)) notesoup.ephemeral[this.id] = {};
	notesoup.ephemeral[this.id][key] = value;
};


/**
*	Fetch a value from ephemeral per-note storage.
*	@param {string} key the key to fetch
*/
soupnote.prototype.getEphemeral = function(key, defaultvalue) {
	if (('ephemeral' in notesoup) && (this.id in notesoup.ephemeral) && (key in notesoup.ephemeral[this.id]))
		return notesoup.ephemeral[this.id][key];
	//if (notesoup.debugMode) notesoup.say('Ephemeral cache accessed before value set', 'warning');
	return defaultvalue;
};


/**
*	Release ephemeral storage for a note that is going away
*/
soupnote.prototype.clearEphemeral = function() {
	if (('ephemeral' in notesoup) && (this.id in notesoup.ephemeral))
		delete notesoup.ephemeral[this.id];
};


/**
*	Get the value of the note.  By default we return the text field.  Widgets will override.
*/
soupnote.prototype.getvalue = function() {
	return this.text || '';
};


/**
*	Set the value of the note.  By default we set the text field.  Widgets will override.
*	@param {string} value the value to set
*/
soupnote.prototype.setvalue = function(value) {
	this.text = value;
};



/**
*	Get the value of a note by title.
*/
notesoup.$nv = function(notename) {
	var note = $n(notename);
	if (note) return note.getvalue();
	//notesoup.say('Not found: $nv(' + notename + ')', 'error');
	// stop scripts?
	return undefined;
};


/**
* A shorthand to get the value of a note by title.
*/
var $nv = notesoup.$nv;


/**
*	Set the color of the note.
*	@params	{string} theColor a color string containing the new color for the note.  Examples: '#ff0000' is very red, as is 'red'.
*/
soupnote.prototype.setColor = function(theColor) {
	//notesoup.say('note.setColor: ' + typeof(theColor) + ' ' + theColor);
	// Change the note data and push the update to the server
	this.set({'bgcolor': theColor});
	this.save();
	this.show();
};


/**
*	Show a loading indicator
*/
soupnote.prototype.showLoading = function() {
	this.setContentDiv(notesoup.ui.loadingText);
};


/**
*	Send the note to a new folder
*	@param {string} tofolder The destination folder.
*/
soupnote.prototype.send = function(tofolder, deleteoriginal) {
	if (deleteoriginal == undefined) deleteoriginal = true;
	if (tofolder) {
		notesoup.sendNote(this.id, notesoup.foldername, tofolder, deleteoriginal);
	}
};


/**
*	Send a reply.
*/
soupnote.prototype.sendReply = function() {

	if (!notesoup.loggedin) {
		notesoup.say('You must be logged in to do that.');
		return;
	}

	var parts = '';
	var replyto = '';
	var replyfolder = '';

	if (this.from) {
		parts = this.from.split(' ');
		replyto = parts[0];
		replyfolder = parts[2];
	}
	else {
		replyto = prompt('Reply to whom?', '');
		if (!replyto) return;
		replyfolder = replyto.split('/')[0] + '/inbox';		
	}
	var reply = prompt('Reply to ' + replyto + '@' + replyfolder + ': ', '');
	if (!reply) return;

	// top-post the response
	this.notename = 'Reply from ' + notesoup.username;
	this.text = notesoup.username + ': ' + reply + '<hr/>' + this.text;
	notesoup.saveNote(this.cleanNote(), replyfolder);
	this.destroy();
	//this.save();
	//this.send.defer(2000, this, [replyfolder]);
};


/**
*	Ext form interface: field level access
*/
soupnote.prototype.set({

	getFieldID: function(fieldname) {
		return this.id + '_' + fieldname;
	},

	getField: function(formname, fieldname) {
		var theForm = this.getEphemeral(formname);
		if (theForm) {
			var field = theForm.findById(this.getFieldID(fieldname));
			if (field) return field.getValue();
		}
		notesoup.say('getField: not found: ' + this.id + '/' + formname + '/' + fieldname, 'error');
		return null;
	},

	setField: function(formname, fieldname, value) {
		var theForm = this.getEphemeral(formname);
		if (theForm) {
			var field = theForm.findById(this.getFieldID(fieldname));
			if (field) field.setValue(value);
			return;
		}
		notesoup.say('setField: not found: ' + this.id + '/' + formname + '/' + fieldname + '=' + value, 'error');
	},

	/**
	*	Simple UI to change the title of a note.
	*/
	editTitle: function(e) {
        Ext.MessageBox.show({
			title: 'Edit Title',
			msg: 'Enter a new title for this note:',
			scope: this,
			value: this.notename,
			width: 300,
			buttons: Ext.MessageBox.OKCANCEL,
			prompt: true,
			multiline: true,
			fn: function(btn, text) {
				if (btn == 'ok') {
					this.notename = text;
					this.save();
					this.show();
				}
			}
		});
	},


	think: function(msg, duration) {
		duration = duration || 3000;
		//notesoup.say('thinking: ' + msg);
		var t = new Ext.ToolTip({
			target: this.id,
			dismissDelay: duration,
			title: msg
		});
		t.targetXY = [this.xPos + 48, this.yPos+ 12];
		if (t) {
			t.showAt([this.xPos+48, this.yPos+12]);
			t.destroy.defer(duration + 20, t);
		}
		else notesoup.say('no tip');
	}
});
// end of soupnote.js
