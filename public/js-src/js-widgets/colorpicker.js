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

	dirty: 1,

	ontick: function() {
		if (!this.dirty) return;
		if (--this.dirty > 0) return;
		delete this.dirty;
		this.renderpicker();
	},

	afterrender: function() {
		this.dirty = 1;		// defer re-rendering for race condition
	},

	renderpicker: function() {
		var container = this.getContentDiv();
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
		this.setContentDiv(pickertemplate);

		var self = this;
		var picker = ColorPicker(
			document.getElementById('slide-' + this.id),
			document.getElementById('picker-' + this.id),
			function(hex, hsv, rgb) {
				//console.log(hsv.h, hsv.s, hsv.v);
				//console.log(rgb.r, rgb.g, rgb.b);
				if (self.target == 'background') {
					document.body.style.background = hex;
					notesoup.setFolderBackground(hex, notesoup.foldername);
					self.sendself.defer(20, self, ['setbackground', hex]);
				}
				else if (self.target == 'newnotes') {
					notesoup.ui.defaultNoteColor = hex;
					notesoup.say('Default color set to: ' + notesoup.ui.defaultNoteColor);
					notesoup.ui.commandbar.getEl().dom.style.background = notesoup.ui.defaultNoteColor;
					notesoup.ui.commandbar.focus();
				}
				else if (self.target == 'note') {
					if (notesoup.notes.hasOwnProperty(self.targetnoteid)) {
						var thenote = notesoup.notes[self.targetnoteid];
						thenote.think(hex);
						thenote.setColor(hex);
					}
					else notesoup.say('You selected: ' + hex);
				}
				else notesoup.say('You chose: ' + hex);
			});

/***
		if (self.target == 'background') {
		}
		else if (self.target == 'newnotes') {
			picker.setHex(notesoup.ui.defaultNoteColor);
		}
		else if (self.target == 'note') {
			if (notesoup.notes[this.targetnoteid]) {
				var thenote = notesoup.notes[this.targetnoteid];
				if (thenote.hasOwnProperty('bgcolor')) {
					picker.setHex(thenote.bgcolor);
				}
			}
		}
		else {
		}
***/

	},

	setbackground: function(background) {
		notesoup.showFolderBackground(background);
	},

	done: function() { 
		notesoup.say('Bye!');
		this.destroy(); 
	}
});
</script>
