<script type='text/javascript'>
/**
*	colorpicker.js - Note Soup color picker widget
*
*	Copyright 2012 Bill Roy
*	This file is licensed under the Note Soup Client License
*	See http://notesoup.net/js/LICENSE
*
*	Based on the FlexiColorPicker: https://github.com/DavidDurman/FlexiColorPicker
*

{imports: '/js-src/js-widgets/newnotecolor.js'}

*/
note.set({
	notename: 'New Note Color',
	bgcolor: '#FFFFFF',
	width: 300,

	ontick: function() {
		if (this.dirty) {
			this.show.defer(20, this);
			this.makepicker.defer(200, this);
			delete this.dirty;
		}
	},

	init: function() {
		if (this.initialized) return;
		this.dirty = true;
		//this.show.defer(20, this);
		//this.makepicker.defer(200, this);
		this.initialized = true;
	},

	makepicker: function() {
		var container = this.getContentDiv;
		if (container == undefined) {
			notesoup.say('Waiting for container...');
			this.makepicker.defer(20, this);
			return;
		}
		Ext.DomHelper.insertHtml('afterbegin', container, [
			"<div class='picker' id='picker",
			"-" + this.id,
			"'></div>",
			"<div class='silde' id='slide",
			"-" + this.id,
			"'></div>"
		].join(''));


		notesoup.say('Pick a color...');
		var picker = ColorPicker(
			document.getElementById('slide-' + this.id),
			document.getElementById('picker-' + this.id),
			function(hex, hsv, rgb) {
				console.log(hsv.h, hsv.s, hsv.v);
				console.log(rgb.r, rgb.g, rgb.b);
				//document.body.style.backgroundColor = hex;
				notesoup.ui.defaultNoteColor = hex;
				notesoup.say('Default color set to: ' + notesoup.ui.defaultNoteColor);
				notesoup.ui.commandbar.getEl().dom.style.background = notesoup.ui.defaultNoteColor;
				notesoup.ui.commandbar.focus();
			});
		picker.setHex(notesoup.ui.defaultNoteColor);
	},

	click: function() { 
		notesoup.say('Bye!.');
		this.destroy(); 
	}
	
});
note.init();
</script>

<style type="text/css">
	.picker { 
		width: 190px; height: 190px; 
		float:left;
		cursor: crosshair
	}
	.slide { 
		width: 30px; height: 190px; 
		overflow:hidden;
		cursor: crosshair
	}
</style>

<center>
	<input type='submit' value='done' onclick='notesoup.ui.getEnclosingNote(this).click();'/>
</center>
