<script type='text/javascript'>
/**
*	uploadForm.js - Note Soup file upload widget
*
*	Copyright 2007, 2008 Bill Roy
*	This file is licensed under the Note Soup Client License
*	See http://notesoup.net/js/LICENSE
*/
var note = notesoup.ui.getEnclosingNote(this);
note.set({

	handleResponse: function(elt, success, response) {
		//notesoup.say('Upload status: ' + elt.id + ' ' + success + ' ' + response.responseText);
		this.setContentDiv(response.responseText);
		this.show.createDelegate(this).defer(3000);
		notesoup.sendSync();
	},

	submitForm: function() {
		var form = this.getEphemeral('uploadForm').getForm();
		if (form) {
			var el = form.el.dom;
			if (el) {
				el.setAttribute('enctype', 'multipart/form-data');
				try {
					formManager = new Ext.UpdateManager(el);
					formManager.formUpdate(el, '/upload', true, this.handleResponse.createDelegate(this));
					this.showLoading();
				} catch (e) {
					notesoup.say('form submission error: ' + notesoup.dump(e));
				}
			}
		}				
	},

	onrender: function() {

		var uploadForm = new Ext.FormPanel({

			labelAlign: 'right',
			fileUpload: true,
			labelWidth: 75,
			width: this.width - 36,
			bodyStyle: 'background:' + (this.bgcolor || notesoup.ui.defaultNoteColor),
			border: false,
			bodyBorder: false,
			items: [{
				xtype: 'textfield',
				id: this.getFieldID('thefile'),
				allowBlank: false,
				inputType: 'file',
				name: 'thefile',
				fieldLabel: 'File to upload',
				width: 300
			}],
			buttons: [{
				text: 'Upload',
				handler: this.submitForm,
				scope: this
			},{
				text: 'Done', 
				handler: this.destroy,
				scope: this
			}],
			keys: [{
				key: 13,
				fn: this.submitForm,
				scope: this
			}]
		});
		this.setContentDiv('<br/>');
		uploadForm.render(this.getContentDiv());
		this.setEphemeral('uploadForm', uploadForm);
	}
});
note.show();
</script>
Loading...