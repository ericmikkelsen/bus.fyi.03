var fs      = require('fs');
var path = require('path');

if (!fs.existsSync('dist')){
    fs.mkdirSync('dist');
}

//require('./lib/getGtfs.js');
