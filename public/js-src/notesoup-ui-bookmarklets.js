/**
*	notesoup-ui-bookmarklets.js
*
*	Copyright 2007, 2008 Bill Roy
*	This file is licensed under the Note Soup Client License
*	See http://notesoup.net/js/LICENSE
*/
notesoup.set({

	makeBootBookmarkletNote: function() {this.getBookmarkletNote(this.getBootBookmarkletLink());},

	makeQuickNoteBookmarkletNote: function() {this.getBookmarkletNote(this.getQuickNoteBookmarkletLink());},

	getBookmarkletNote: function(s) {
		return this.saveNote({
			notename: 'Bookmarklet', 
			text: 'Drag this link to the bookmark bar:<br/>' + s
		}, this.foldername);
	},

	getBootBookmarkletLink: function() {
		return '<a href="' + this.getBootBookmarklet() + '">Instant Soup Bookmarklet</a>';
	},

	getBootBookmarklet: function() {
		return this.getBootBookmarkletCode(this.baseuri, 'js/instantsoup.js');
	},
	
	getBootBookmarkletCode: function(baseuri, filepart) {
	
		var booterTemplate = [
			"javascript:function%20boot(url){",
				"var%20s=document.createElement('script');",
				"s.setAttribute('language','javascript');",
				"s.setAttribute('src',url);",
				"document.body.appendChild(s);}",
			"window.instantsoupbooturi='",baseuri,"';",
			"boot('", baseuri+filepart,"');"
		];
		return booterTemplate.join('');
	},

	getQuickNoteBookmarkletLink: function() {
		return '<a href="' + this.getQuickNoteBookmarkletCode() + '">Instant Note Bookmarklet</a>';
	},

	getQuickNoteBookmarkletCode: function() {
	
		//notesoup.php?note=%7B%22notename%22%3A%22'+newnotetext+'%22%7D&tofolder=user%2Finbox&method=savenote&id=1');
	
		var prompterTemplate = [
			"javascript:function%20boot(url){",
				"var%20s=document.createElement('script');",
			"	s.setAttribute('language','javascript');",
			"	s.setAttribute('src',url);",
			"	document.body.appendChild(s);}",
			"var%20t=prompt('Enter%20a%20short%20note','<a%20href='+document.location+'>'+document.title+'</a>');",
			"boot('", notesoup.baseuri,
			"notesoup.php?note=%7B%22notename%22%3A%22Quick%20Note%22%2C%22text%22%3A%22'+encodeURIComponent(t.replace(/^\s*|\s*$/g,''))+'%22%7D&tofolder=user%2Finbox&method=savenote&id=1');"
		];
		return prompterTemplate.join('');
	}
});
