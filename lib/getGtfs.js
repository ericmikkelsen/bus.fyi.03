var fs      = require('fs');
var config  = require('../data/config.json');
var request = require('request');
var AdmZip  = require('adm-zip');

//update with new folder names

//build folders
  var folders = [
    'dist',
    config.folderNames.zip,
    config.folderNames.unzip,
  ];

  for (var i = 0; i < folders.length; i++) {
    if (!fs.existsSync(folders[i])){
        fs.mkdirSync(folders[i]);
        }
  }

  function downloadAndUnzipGtfs(file, name, url, unzipFileLocation){

    request.head(url, function(err, res, body){
      //write the zip file to disk as it's coming in
      request(url).pipe(fs.createWriteStream(file)).on('finish', function(){
        //unzip file to csv directory
        var zip = new AdmZip(file);
        console.log(unzipFileLocation);
        zip.extractAllTo(/*target path*/unzipFileLocation, /*overwrite*/true);
      })
    })

  }

  for (var i = 0; i < config.agencies.length; i++) {
    //download gtfs zip file
    var url   = config.agencies[i].url;
    var name  = config.agencies[i].agency;
    var file = './' + config.folderNames.zip +'/'+ name + '.zip';
    var unzipFileLocation = config.folderNames.unzip+config.agencies[i].agency;
    downloadAndUnzipGtfs(file, name, url, unzipFileLocation);
  }
