<script type='text/javascript'>
/**
*	ajaxrtt.js - Note Soup ajax performance widget
*
*	Copyright 2007, 2008 Bill Roy
*	This file is licensed under the Note Soup Client License
*	See http://notesoup.net/js/LICENSE
*/
note.set({

	ontick: function() {
		this.refresh();
	},

	onrender: function() {
		var textInputForm = new Ext.FormPanel({
			hideLabels:true,
			bodyStyle: 'background:' + (this.bgcolor || notesoup.ui.defaultNoteColor),
			border: false,
			bodyBorder: false,
			items: [{
				xtype: 'textarea',
				id: this.getFieldID('value'),
				name: 'value',
				width: this.width - 36		//175,
			}]
		});
		this.setContentDiv('');
		textInputForm.render(this.getContentDiv());
		this.setEphemeral('textInputForm', textInputForm);
	},

	getvalue: function() {
		return this.getField('textInputForm', 'value');
	},

	refresh: function() {
		this.setvalue(''+notesoup.rttstack);
	},

	setvalue: function(newvalue) {
		this.setField('textInputForm', 'value', newvalue);
	}
});
note.show();
</script>