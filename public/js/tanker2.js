/* =this.loadScript('http://localhost/~bill/stikiwiki/js/tanker2.js'); */
var tank = {};
var analyzeElement = function(e, t, i) {

	var tag = e.dom.tagName;
	if (!(tag in tank)) {
		tank[tag] = {
			count: 0,
			linkdata: []
			//clsdata: []
		};
	}
	tank[tag]['count']  = tank[tag]['count'] + 1;

	var cls = e.dom.className;
	//if (cls && (tank[tag].clsdata.indexOf(cls) < 0))
	//	tank[tag].clsdata.push(cls);

	var link = '';
	switch(tag) {
		case 'SCRIPT':
		case 'IMG': link = e.dom.src; break;
		case 'LINK':
		case 'A': link = e.dom.href; break;
		case 'OBJECT': link = e.dom.classid; break;
	}
	if (link && (tank[tag].linkdata.indexOf(link) < 0)) tank[tag].linkdata.push(link);
}
Ext.select('*').each(analyzeElement);
notesoup.alert(notesoup.dump(tank).length);

this.print('counts:');
for (var t in tank) {
	this.print(t + ' ' + tank[t].count);
}
this.print('');
this.print('links:');
for (var t in tank) {
	if (tank[t].linkdata.length)
		this.print(t + ' ' + tank[t].linkdata.sort());
}

document.body.innerHTML = this.stdout;
delete this.stdout;
