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

{imports: '/js-src/js-widgets/colorpicker.js'}

*/
notesoup.say('Hi!');
note.set({

	width: 280,
	nosave: true,
	//noframe: true,

	init: function() {
		Ext.get('colorpicker').show();
		notesoup.say('Pick a color...');
		ColorPicker(
			document.getElementById('slide'),
			document.getElementById('picker'),
			function(hex, hsv, rgb) {
				console.log(hsv.h, hsv.s, hsv.v);
				console.log(rgb.r, rgb.g, rgb.b);
				//document.body.style.backgroundColor = hex;
				notesoup.ui.defaultNoteColor = hex;
				notesoup.say('Default color set to: ' + notesoup.ui.defaultNoteColor);
				notesoup.ui.commandbar.getEl().dom.style.background = notesoup.ui.defaultNoteColor;
				notesoup.ui.commandbar.focus();

				//Ext.get('colorpicker').hide();
			});
	},	

	click: function() { 
		notesoup.say('Bye!.');
		this.destroy(); 
	}
	
});
notesoup.say('Init:');
note.init();
notesoup.say('Init done.');
</script>

<style type="text/css">
	#picker { width: 200px; height: 200px; cursor: crosshair }
	#slide { width: 30px; height: 200px; position:absolute;left:212px;top:12px; cursor: crosshair }
</style>

<div id='colorpicker'>
	<div id="picker-wrapper">
		<div id="picker"></div>
		<div id="picker-indicator"></div>
	</div>
	<div id="slide-wrapper">
		<div id="slide"></div>
		<div id="slide-indicator"></div>
	</div>
</div>
<center>
	<input type='submit' value='done' onclick='notesoup.ui.getEnclosingNote(this).click();'/>
</center>
