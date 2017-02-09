var fs      = require('fs');

if (!fs.existsSync('dist')){
    fs.mkdirSync('dist');
}

require('./lib/get_gtfs.js');
