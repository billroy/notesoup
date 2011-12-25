<script type='text/javascript'>
/**
*	search.js - Note Soup search widget
*
*	Copyright 2007, 2008 Bill Roy
*	This file is licensed under the Note Soup Client License
*	See http://notesoup.net/js/LICENSE
*/
note.set({
	init: function() {
		this.show();
	},

	sendit: function() {
		notesoup.postRequest({
			method:"search",
			params:{
				searchfor: this.getField('searchForm', 'cmd'),
				tofolder: notesoup.foldername,
				notifyfolder: notesoup.foldername
			}},{
			requestMessage: 'Sending search request for: ' + this.getField('searchForm', 'cmd') + '...',
			successMessage: 'Search complete.',
			failureMessage: 'Could not execute search command.'
		});
		this.setField('searchForm', 'cmd', '');
	},


	onrender: function() {

		var searchForm = new Ext.FormPanel({
			labelWidth: 75,
			labelalign: 'top',
			width: this.width - 36,
			bodyStyle: 'background:' + (this.bgcolor || notesoup.ui.defaultNoteColor),
			border: false,
			bodyBorder: false,
			items: [{
				xtype: 'textfield',
				fieldLabel: 'Search for',
				name: 'cmd',
				id: this.getFieldID('cmd'),
				width: this.width - 36 - 86
			}],
			buttons: [{
				text: 'Search',
				handler: this.sendit,
				scope: this
			},{
				text: 'Done',
				handler: this.destroy,
				scope: this
			}],
			keys: [{
				key: 13,
				fn: this.sendit,
				scope: this
			}]
		});

		this.setContentDiv('<br/>');
		searchForm.render(this.getContentDiv());
		this.setEphemeral('searchForm', searchForm);
	}
});
note.init();
</script>