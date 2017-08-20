var universal = function(){

  this.fileLocation = function(file, jsonObj){

    /*
        file = {
          "folder"    : "string",   //required - folderlocation
          "name"      : "string",   //optional
          "key"       : "string",   //optional - a file must use file name or filename key
          "prefix"    : "string",   //optional
          "suffix"    : "string",   //optional
          "extension" : "string",   //optional - defaults to .json
          "separator" : "string"    //optional - between file parts, defaults to '' nothing
        }
    */

    fileLocation_array = [];
    fileLocation = '';

    if (file.prefix) {
      fileLocation_array.push(file.prefix);
    }

    //check for file name or key
    if (file.name) {
      fileLocation_array.push(file.name);
    }else if(file.key){
      fileLocation_array.push(jsonObj[file.key]);
    }

    if(file.suffix){
      fileLocation_array.push(file.suffix);
    }

    if(typeof file.separator === 'undefined' || file.separator === null){
      file.separator = '';
    }
    fileLocation = fileLocation_array.join(file.separator);

    //add file extension
    if (typeof file.extension === 'undefined' || file.extension === null) {
      file.extension = '.json';
    }else if(file.extension.substr(0) !== '.'){
      file.extension = '.'+ file.extension;
    }

    //check for trailing slash and if
    if (file.folder.substr(file.folder.length - 1) !== '/') {
      file.folder = file.folder + '/';
    }

    fileLocation = file.folder + fileLocation + file.extension;
    return fileLocation;
  }
  
}
