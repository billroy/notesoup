
// add notes from file-based soup to user/inbox in the redis store

var tofolder = 'bill/inbox';
var directory = '/Users/bill/Sites/soup/data/soupbase/user/inbox';

var soup = require('./notesoup.js');
soup.connect(process.env.REDIS_URL);

soup.loadfiles(directory, tofolder);

//process.exit(0);