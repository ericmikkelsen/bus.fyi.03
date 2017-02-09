var config   = require('../data/config.json');
var csv      = require('csvtojson');
var fs       = require('fs');
var request  = require('request');

//build folders
  var folders = [
    config.appLocation,
    config.mapLocations,
    config.dataLocation,
  ];

  for (var i = 0; i < folders.length; i++) {
    if (!fs.existsSync(folders[i])){
        fs.mkdirSync(folders[i]);
        }
  }


//build data agency folders
  var dataFolders = [
    'stops',
    'routes',
    'trips',
  ];

  for (var i = 0; i < config.agencies.length; i++) {

    agencyDataFolder = config.dataLocation+'/'+config.agencies[i].agency;

    if (!fs.existsSync(agencyDataFolder)){
        fs.mkdirSync(agencyDataFolder);
    }

    for (var d = 0; d < dataFolders.length; d++) {
      if (!fs.existsSync(agencyDataFolder+'/'+dataFolders[d])){
          fs.mkdirSync(agencyDataFolder+'/'+dataFolders[d]);
      }
    }

  }


  //individual stop json files
  function startStopJson(stop){
    file_name = config.stopLocations.replace('{{agency}}',stop.agency) + stop.stop_id+'.json';
    stop.type = 'head';
    stop.pages = 0;
    stop.pg = 0;
    stop_string = JSON.stringify(stop);
    fs.writeFileSync(file_name, stop_string+'\n', 'utf-8');
    console.log('STOP JSON '+ file_name);
  }

  function buildMapJson(stop){
    map_lon = ((Math.floor(stop.stop_lon*100))/100).toFixed(2);
    map_lat = ((Math.floor(stop.stop_lat*100))/100).toFixed(2);
    file_name = config.mapLocations+map_lat+'x'+map_lon+'.json';

    stop_string = JSON.stringify(stop);
    if (!fs.existsSync(file_name)){
      hdr = JSON.stringify({type:'head',pages:0,pg:0,lon:map_lon, lat:map_lat});
      json = hdr+'\n'+stop_string+'\n';f
      fs.writeFileSync(file_name, json, 'utf-8');
    }else{
      fs.appendFileSync(file_name, stop_string+'\n', 'utf-8');
    }
    console.log('MAP JSON '+file_name);
  }

  function doStopsBuild(csvFilePath, agency){
    //relies on config.json
    csvFilePath = config.unzipFileLocation + agency + '/stops.txt';
    csv({
      ignoreEmpty:true,
      })
      .fromFile(csvFilePath)
      .on('json',(jsonObj)=>{
          // combine csv header row and csv line to a json object
          // jsonObj.a ==> 1 or
          jsonObj.agency = agency;
          console.log('\n');
          startStopJson(jsonObj);
          buildMapJson(jsonObj);

      })
      .on('end_parsed',(jsonArrObj)=>{
        //console.log(agency+' done');
      });
  }


  function startTripJson(trip){
      file_name = config.tripLocations.replace('{{agency}}',trip.agency) + trip.trip_id+'.json';
      trip.stops = [];
      trip_string = JSON.stringify(trip);
      fs.writeFileSync(file_name, trip_string+'\n', 'utf-8');
      console.log('TRIP JSON '+ file_name);
  }

  function doTripsBuild(agency){

      csvFilePath = config.unzipFileLocation + agency + '/trips.txt';
      csv()
      .fromFile(csvFilePath)
      .on('json',(jsonObj)=>{
        jsonObj.agency = agency;
        startTripJson(jsonObj)
      })
      .on('done',(error)=>{
        //console.log('end')
      })

  }


  function addStopTimeToTrip(stopTime){
    file_name = config.dataLocation + stopTime.agency + '/trips/' + stopTime.trip_id + '.json';
    trip = fs.readFileSync(file_name, 'utf8');
    trip = JSON.parse(trip);
    if(!trip.agency){
      trip.agency = stopTime.agency;
    }
    delete stopTime.trip_id;
    delete stopTime.agency;
    if (stopTime.arrival_time.substring(0,5) === stopTime.departure_time.substring(0,5)) {
      delete stopTime.departure_time;
    }

    trip.stops.push(stopTime);
    trip_string = JSON.stringify(trip);
    fs.writeFileSync(file_name, trip_string, 'utf-8');
  }

  function doStopTimesBuild(agency){
    var dateStarted = new Date();
    var hourStarted = dateStarted.getHours();
    var minStarted = dateStarted.getMinutes();
    console.log(hourStarted+':'+minStarted);

      csvFilePath = config.unzipFileLocation + agency + '/stop_times.txt';
      csv()
      .fromFile(csvFilePath)
      .on('json',(jsonObj)=>{
        jsonObj.agency = agency;
        addStopTimeToTrip(jsonObj)
      })
      .on('done',(error)=>{
        var dateEnded = new Date();
        var hourEnded = dateStarted.getHours();
        var minEnded = dateStarted.getMinutes();
        console.log(hourEnded+':'+minEnded);
      })

  }


//Build map .json files
for (var i = 0; i < config.agencies.length; i++) {

  var agency = config.agencies[i].agency;

  //doStopsBuild(agency);
  //doTripsBuild(agency);
  doStopTimesBuild(agency);

}


/*


stops.json

from stop_times
  arrival_time
  departure_time
  pickup_type
  dropoff_type
  time_point
  trip_id
    REMOVE AFTER BUILD


from trips.txt //gathered from trip_id
  trip_headsign
  direction_id
  wheelchair_accessible
  bikes_allowed
  route_id
    REMOVE AFTER BUILD
    service_id

route.txt
  route_type
  route_url
  route_color
  route_text_color

*/

/*
  dataSplicer
  key


  pass in json array.



*/
