<script type='text/javascript'>
/**
*	calculator.js - Note Soup calculator widget
*
*	Copyright 2007, 2008 Bill Roy
*	This file is licensed under the Note Soup Client License
*	See http://notesoup.net/js/LICENSE
*/
note.set({

	init: function() {
		this.show();
	},

	ontick: function() {
		if (this.getField('calculatorForm', 'autorecalc')) this.calc();
	},
	
	start: function() {
		this.setField('calculatorForm', 'autorecalc', true);
	},

	stop: function() {
		this.setField('calculatorForm', 'autorecalc', false);
	},

	calc: function() {
		this.formula = this.getField('calculatorForm', 'formula');
		this.autorecalc = this.getField('calculatorForm', 'autorecalc');
		this.value = null;
		try {
			this.value = eval(this.formula);
		} catch (e) {
			this.value = 'ERROR: ' + e;
		}
		this.setField('calculatorForm', 'value', this.value);
		return this.value;
	},
	
	saveForm: function() {
		this.formula = this.getField('calculatorForm', 'formula');
		this.autorecalc = this.getField('calculatorForm', 'autorecalc');
		this.save();
	},

	getvalue: function() {
		return this.value;
	},

	setvalue: function(newformula) {
		this.formula = newformula;
		return this.calc();
	},
	

	onrender: function() {

		var calculatorForm = new Ext.FormPanel({
			labelWidth: 75,
			width: this.width - 36,
			bodyStyle: 'background:' + (this.bgcolor || notesoup.ui.defaultNoteColor),
			border: false,
			bodyBorder: false,
			items: [{
				xtype: (this.formula && (this.formula.length > 40)) ? 'textarea' : 'textfield',
				fieldLabel: 'Formula',
				id: this.getFieldID('formula'),
				value: this.formula || '',
				width: this.width - 36 - 86,
				height: (this.formula && (this.formula.length > 40)) ? Math.max(48, this.height - 85) : null
			},{
				xtype: 'textfield',
				fieldLabel: 'Value',
				id: this.getFieldID('value'),
				value: this.value || '',
				width: this.width - 36 - 86
			},{
				xtype: 'checkbox',
				fieldLabel: 'Auto recalc',
				id: this.getFieldID('autorecalc'),
				checked: this.autorecalc
			}],
			buttons: [{
				text: 'Calc',
				handler: this.calc,
				scope: this
			},{
				text: 'Save', 
				handler: this.saveForm,
				scope: this
			}],
			keys: [{
				key: 13,
				fn: this.calc,
				scope: this
			}]
		});

		this.setContentDiv('<br/>');
		calculatorForm.render(this.getContentDiv());
		this.setEphemeral('calculatorForm', calculatorForm);

		Ext.get(this.getFieldID('formula')).on('focus', this.stop, this);
		Ext.get(this.getFieldID('value')).on('focus', this.stop, this);
	}
});
note.init();
</script>