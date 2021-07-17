import fs from 'fs';

//check for "expo" in package.json;
function checkForExpo(installer: string): string{
var installer: string;
 let contents: string;
 let parsedContent: object[];
contents = fs.readFileSync(process.cwd()+'/package.json', 'utf-8')

parsedContent = JSON.parse(contents);
if((parsedContent as any).dependencies.hasOwnProperty('expo')){
    installer='expo';
}
return installer;
}

export default checkForExpo;