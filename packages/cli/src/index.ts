import program  from 'commander';
import fs from 'fs';
import {execSync} from 'child_process';
import path from 'path';
import fetch from 'node-fetch';

import checkForExpo from './checkforExpo';
import checkForPackageLock from './checkForPackageLock';

var installer : string ='yarn';

// check for npm
installer = checkForPackageLock(process.cwd(), installer);

// check for yarn
installer = checkForExpo(installer);

// install peer dependencies
const installPeers= content =>{
     let packages = Object.keys(content.peerDependencies).map(function(key) {
        return `${key}`
    })
    let extractedPackages= '';
    packages.map(pack => 
        (pack==='react' || pack==='react-native')
        ? extractedPackages+= ''
        : extractedPackages+=`${pack} `);

    (installer==='npm' || installer==='expo')
    ? console.log(`${installer} i ${extractedPackages}`)
    : console.log(`${installer} add ${extractedPackages}`);
    
}

// fetch metadata of pacakge
const addPackage = async (pack): Promise<any> => {
console.log("Installing peer dependencies")
try{

    let response = await fetch(`https://registry.npmjs.org/@react-navigation/${pack}/latest`);
    let getPackage = await response.json();
    installPeers(getPackage);
}catch(e){
    console.log("Please enter a valid React-Navigation Package");
}
}

program
	.version('1.0.0')
	.description('CLI To Setup React-Navigation')

program
	.command('add <package>')
	.alias('a')
	.description('install your required package')
	.action(addPackage)


program.parse(process.argv);