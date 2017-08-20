const compile  = require('es6-template-strings/compile');
const csv      = require('csvtojson');
const fs       = require('fs-extra')
const request  = require('request');
const template = require('es6-template-strings');


//json files
const config        = require('../data/config.json');
const schema        = require('../data/schema.json');
const configFolder  = '../data/';
//set folder locations relative to this file
  for (let prop in config.folderNames) {
    config.folderNames[prop] = '../'+config.folderNames[prop];
  }

class Contexts{

  constructor(props) {
    this.defaultProps = {
      "config"  : config,
      "schema"  : schema,
      "dist"    : "../dist",
    }
    this.props = Object.assign({},this.defaultProps,props);
  }

  mutate(str, obj, key){
    /*
      //EXAMPLE
      var obj = {
        'food'  : 'apple',
        'sound' : 'crunch'
      }
      var str = "I want a ${food}, and it will make the sound ${sound}";
      var key = "words";

      example = this.mutate(str,obj,key));
    */
    obj[key] = template(str, obj);
    return obj;
  }

  folderName(folders){
    return folders.join('/') + '/';
  }

  fileName(fileParts, extension){
    return fileParts.join('-') + '.' + extension;
  }

  fileLocation(args, data){
    let fileName = this.fileName(args.fileNameParts, args.fileNameExtension);
    let folderName = this.folderName(args.folderName);
    let r = folderName+fileName;
    if (data) {
      r = template(r, data);
    }
    return r;
  }

  getValue(map, obj){
    let key = '';
    let value = obj;
    for (let i = 0; i < map.length; i++) {
      console.log(key);
      key = map[i];
      value = value[key];
    }
    return {
      key: key,
      value: value
    };
  }

  updateJSON(JSONFileName,instructions, jsonObj){
    let fileName = '../dist/json/'+JSONFileName;
    let obj = {}
    try {
      var stats = fs.statSync(fileName);
      obj = require(fileName);
    } catch(err) {

    }


    //if we just want everything in a key do this
    if (instructions.addProperties === true) {
      if (instructions.push === true) {
        if (obj[instructions.assignToProperty]) {
          obj[instructions.assignToProperty].push(jsonObj);
        } else {
          obj[instructions.assignToProperty] = [];
          obj[instructions.assignToProperty].push(jsonObj);
        }

      } else if ( instructions.push === false ){
        obj[instructions.assignToProperty] = jsonObj;
      }
    } else if(instructions.addProperties instanceof Array) {
      //if it's an array cycle through and add each listed property
      for (let property in instructions.addProperties) {
        if (jsonObj[property]) {
          obj[instructions.assignToProperty].push(jsonObj[property]);
        }
      }
    }

    fs.outputJsonSync('../dist/json/' + JSONFileName, obj);
  }

  writeJsonFromContext(jsonObj, agency, context, srcFileName){
    const sourceInstructions = context.sources.filter(function(source){
      return srcFileName === source.src;
    })[0];
    //if we need any other content, go get it.
    if(sourceInstructions.related){
      for (let i = 0; i < sourceInstructions.related.length; i++) {
        console.log('----');
        console.log('////');
        let related = sourceInstructions.related[i];
        let relatedFileName = this.fileLocation(related.fileName, jsonObj);
        let relatedJsonFile = fs.readFileSync('../dist/json/'+ agency.agency + '/' + relatedFileName);
        let relatedJson = JSON.parse(relatedJsonFile.toString() );
        var relatedSingle = relatedJson;
        for (let i = 0; i < related.properties.length; i++) {
          let map = related.properties[i];
          console.log(map);
          let relatedValue = this.getValue( map, relatedJson);
          let key = relatedValue.key;
          let value = relatedValue.value;
          jsonObj[key] = value;
        }
        console.log('----');
      }
    }
    context.fileName.folderName = [agency.agency].concat(context.fileName.folderName);
    const destinationFileName = this.fileLocation(context.fileName, jsonObj);
    this.updateJSON(destinationFileName, sourceInstructions, jsonObj);
  }

  handleContext(err, contextString, srcData, srcFileName, agency){
    //crunch that csv yo!
    csv()
      .fromString(srcData)
      .on('json',(jsonObj)=>{
        let context = JSON.parse(contextString);
        this.writeJsonFromContext(jsonObj, agency, context, srcFileName);
      });
  }

  handleContexts(err, srcData, contexts, srcFileName, agency){
    for (let context in contexts) {
        let contextLocation = configFolder+contexts[context];
        fs.readFile(contextLocation, "utf-8", (err, data) => this.handleContext(err, data, srcData, srcFileName, agency));
    }
  }

  agencyBuild(agency){

    if (agency.build === true) {
      var srcLocation = this.props.config.folderNames.unzip+agency.agency+'/'
      var dataLocation = this.props.config.folderNames.data+agency.agency+'/';
      var schema = Object.assign( {}, this.props.schema, agency.schema);
      for (var file in schema) {
          const contexts = schema[file].contexts;
          const srcFileName = schema[file].src;
          fs.readFile(srcLocation+schema[file].src, "utf-8", (err, data) => this.handleContexts(err, data, contexts, srcFileName, agency));
      }

    }

  }

  buildContexts(){
    var agencies = this.props.config.agencies;
    for (var i = 0; i < agencies.length; i++) {

      this.agencyBuild(agencies[i]);

    }
  }

}

var context = new Contexts({});
context.buildContexts();
