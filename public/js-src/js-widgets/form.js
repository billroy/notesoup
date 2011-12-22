<script type='text/javascript'>
/**
*	form.js - Note Soup generic form widget
*
*	Copyright 2007, 2008 Bill Roy
*	This file is licensed under the Note Soup Client License
*	See http://notesoup.net/js/LICENSE
*/
var note = notesoup.ui.getEnclosingNote(this);
note.set({
	init: function() {
		if (!this.formfields) this.formfields = [
			//{label: 'Notes', fieldkey: 'notes', type: 'textarea'}
		];
		this.show();
	},

	onrender: function() {
		var myForm = new Ext.FormPanel({
			labelWidth: 70,
			minButtonWidth: 25,
			bodyStyle: 'background:' + (this.bgcolor || notesoup.ui.defaultNoteColor),
			border: false,
			bodyBorder: false,
			items: [{
				xtype: 'hidden'
			}],
			buttons: [{
				text: 'save',
				minWidth: 50,
				handler: this.savedata,
				scope: this
			},{
				text: '+',
				minWidth: 25,
				handler: this.insertfield,
				scope: this
			}]
		});

		for (var i=0; i<this.formfields.length; i++) {
			myForm.add({
				xtype: this.formfields[i].type,
				fieldLabel: this.formfields[i].label,
				id: this.getFieldID(this.formfields[i].fieldkey),
				name: this.formfields[i].fieldkey,
				value: this.getdata(this.formfields[i].fieldkey),
				width: this.width - 36 - 76		
			});
		}

		this.setContentDiv('');
		myForm.render(this.getContentDiv());
		this.setEphemeral('myForm', myForm);
	},

	getdata: function(key) {
		if (key in this) return this[key];
		return '';
	},

	savedata: function() {
		for (var f=0; f < this.formfields.length; f++) {
			this[this.formfields[f].fieldkey] = this.getField('myForm', this.formfields[f].fieldkey);
		}
		this.save();
	},

	insertfield: function() {
		notesoup.say('insertfield: ' + this.id);
		var newfieldtype = prompt('New field type [textfield, textarea, checkbox, ...]', '');
		var newfieldlabel = notesoup.prompt('New field display label:', '');
		var newfieldkey = notesoup.prompt('New field key:', '');
		if ((newfieldtype.length > 0) && (newfieldlabel.length > 0) && (newfieldkey.length > 0)) {
			if (!(newfieldkey in this)) this[newfieldkey] = '';
			this.formfields.push({label: newfieldlabel, fieldkey: newfieldkey, type: newfieldtype});
			this.save();
		}
	},

	updateValues: function() {
		for (var f=0; f < this.formfields.length; f++) {
			this.setValue('myForm', this.formfields[f].fieldkey, this[this.formfields[f].fieldkey]);
		}
	}
});
note.init();
</script>