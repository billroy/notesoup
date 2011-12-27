// add notes from file-based soup templates to the redis store
var soup = require('./notesoup.js');
soup.connect(process.env.REDIS_URL);

soup.loaduser('system');
soup.loaduser('widgets');
soup.loaduser('guest');

//process.exit(0);