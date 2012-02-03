<script type='text/javascript'>
/**
*	newnotecolor.js - Note Soup color picker widget for new notes
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
	dirty: true,

	ontick: function() {
		if (!this.dirty) return;
		if (--this.dirty > 0) return;
		delete this.dirty;
		this.renderpicker();
	},

	afterrender: function() {
		this.dirty = 1;
		//this.renderpicker();
	},

	renderpicker: function() {
		var container = this.getContentDiv();
		//notesoup.say('Rendering into container: ' + typeof(container), 'tell');
		if (container == undefined) {
			notesoup.say('Waiting for container...');
			this.renderpicker.defer(20, this);
			return;
		}
		var sliderwidth = 30;
		var pickersize = this.width - sliderwidth - 28;
		var pickertemplate = [
			"<div class='colorpicker' id='cpick", "-" + this.id, "'>",
				"<div class='picker' id='picker", "-" + this.id, 
					"' style='width:", "" + pickersize, 
					"px; height:", "" + pickersize, "px'></div>",
				"<div class='slide' id='slide", "-" + this.id, 
					"' style='width:", "" + sliderwidth, 
					"px; height:", "" + pickersize, "px'></div>",
			"</div>",
			"<center>",
				"<input type='submit' value='done' onclick='notesoup.ui.getEnclosingNote(this).done();'/>",
			"</center>"
		].join('');
		console.log(pickertemplate);
		this.setContentDiv(pickertemplate);

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
				//document.body.style.background = hex;
			});
		picker.setHex(notesoup.ui.defaultNoteColor);
	},

	done: function() { 
		notesoup.say('Bye!');
		this.destroy(); 
	}
});
</script>
