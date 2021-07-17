import fs from 'fs';
import path from 'path';

// check for package-lock.json file
function checkForPackageLock(dir, installer: string): string {
var results = [];
var list = fs.readdirSync(dir)
var filename
list.forEach(function(file) {
    file = path.resolve(dir, file)
    filename = file.split('\\');
    filename = filename[filename.length-1]
    if(file.includes('node_modules')) return;
    var stat = fs.statSync(file)
    if (stat && stat.isDirectory()) results = results.concat(checkForPackageLock(file, installer))
    else if(filename === 'package-lock.json') {results.push(file); installer='npm';}
})
return installer;
}

export default checkForPackageLock;