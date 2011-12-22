<script type='text/javascript'>
/**
*	graphy.js - Note Soup graph paper widget
*
*	Copyright 2007, 2008 Bill Roy
*	This file is licensed under the Note Soup Client License
*	See http://notesoup.net/js/LICENSE
*/
var note = notesoup.ui.getEnclosingNote(this);
note.set({


	drawGraphPaper: function(xmin, ymin, xmax, ymax, bcolor, xminor, yminor, cminor, xsemi, ysemi, csemi, xmajor, ymajor, cmajor) {

		var ink = $n('Ink');
		ink.think('Some graph paper would be nice...');
		if (bcolor) ink.sendself('clearRect', xmin, xmax, ymin, ymax, bcolor);
		if (xminor) for (var x = xmin; x <= xmax; x += xminor) ink.sendself('drawline', x, ymin, x, ymax, cminor, .5);
		if (yminor) for (var y = ymin; y <= ymax; y += yminor) ink.sendself('drawline', xmin, y, xmax, y, cminor, .5);

		if (xsemi) for (var x = xmin; x <= xmax; x += xsemi) ink.sendself('drawline', x, ymin, x, ymax, csemi, 1);
		if (ysemi) for (var y = ymin; y <= ymax; y += ysemi) ink.sendself('drawline', xmin, y, xmax, y, csemi, 1);

		if (xmajor) for (var x = xmin; x <= xmax; x += xmajor) ink.sendself('drawline', x, ymin, x, ymax, cmajor, 2);
		if (ymajor) for (var y = ymin; y <= ymax; y += ymajor) ink.sendself('drawline', xmin, y, xmax, y, cmajor, 2);

	},

	draw: function() {

		var pagesize = {
			windowWidth: Ext.lib.Dom.getViewWidth(), 
			windowHeight: Ext.lib.Dom.getViewHeight()
		};
		var inch = 110;
		this.drawGraphPaper(0,0, pagesize.windowWidth, pagesize.windowHeight, 'white', 
			inch/10, inch/10, 'lightgreen', inch/2, inch/2,'palegreen', inch, inch, 'mediumspringgreen');
	}
});
</script>
<center>
Click to draw graph paper.<br/>
<input type='submit' value='draw' onclick = 'notesoup.ui.getEnclosingNote(this).draw();'/>
</center>