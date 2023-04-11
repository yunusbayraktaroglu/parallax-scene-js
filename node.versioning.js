"use strict";

import { promises } from "fs";
import { exec } from "child_process";
import readline from 'node:readline';
import chalk from "chalk";

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
let pkg = null;

/**
 * Version asking
 */
const upgradeTypeSelect = () => {

	return new Promise( ( resolve, reject ) => {

		const version = chalk.bgRed( ` ${ pkg.version } ` );
		const upgradeSelect = chalk.red( "[ major, minor, patch, override ]" );

		rl.question( `Current version: ${ version } → chose an upgrade ${ upgradeSelect } `, ( answer ) => {

			if (  [ "major", "minor", "patch", "override" ].includes( answer ) ){
				resolve( answer );
			} else {
				reject( `Unsupported answer: ${ answer }.` );
			}

		} );
	} );
}

const createFinalVersion = ( upgradeType ) => {

	return new Promise( ( resolve, reject ) => {

		const version = pkg.version.split( "." ).map( number => Number( number ) );
		let finalVersion = [];

		switch( upgradeType ){
			case "major":
				finalVersion = [ version[0] + 1, 0, 0 ];
				break;
			case "minor":
				finalVersion = [ version[0], version[1] + 1, 0 ];
				break;
			case "patch":
				finalVersion = [ version[0], version[1], version[2] + 1 ];
				break;
			default:
				finalVersion = version;
		}

		finalVersion = finalVersion.join( "." );

		const currentV = chalk.bgRed( ` ${ pkg.version } ` );
		const finalV = chalk.bgGreen( ` ${ finalVersion } ` );

		rl.question( `Update version: ${ currentV } → ${ finalV } - Continue? ${ chalk.red( "[ yes ]" ) } `, ( answer ) => {
			
			const acceptedAnswers = [ "yes" ];
			
			if ( acceptedAnswers.includes( answer ) ){
				resolve( finalVersion );
			} else {
				reject( "aborted" );
			}

		} );

	} );

}


/**
 * Update files that includes version
 */
const updateFiles = async ( finalVersion ) => {

	/** 
	 * Update package.json 
	 */
	pkg.version = finalVersion;
	await promises.writeFile( "./package.json", JSON.stringify( pkg, null, '\t' ) );

	console.log( `"./package.json" → version changed.` );

	/** 
	 * Update files
	 */
	const files = [ "./examples/examples.js" ];

	await Promise.all( files.map( async( file ) => {

		const content = await promises.readFile( file, 'utf-8' );
		const newContent = content.replace( 
			/<span id="v">[\s\S]*?<\/span>/, 
			`<span id="v">${ finalVersion }</span>` 
		);
		await promises.writeFile( file, newContent, 'utf-8' );

		console.log( `"${ file }" -> version changed.` );

	} ) );
}


/**
 * CLI versioning
 */
const main = async () => {

	try {

		const packageJson = await promises.readFile( './package.json', 'utf8' );
		pkg = JSON.parse( packageJson );

		const upgradeType = await upgradeTypeSelect();
		const finalVersion = await createFinalVersion( upgradeType );

		if ( pkg.version !== finalVersion ){
			await updateFiles( finalVersion );
		}

		/**
		 * Create git tag and fire github action
		 */
		console.log( `Creating git tag: v${ finalVersion }` );

		const gitStage 	= `git add .`;
		const gitCommit	= `git commit -m "Created v${ finalVersion }"`;
		const gitTag 	= `git tag -f v${ finalVersion }`;
		const gitPush 	= `git push origin && git push origin v${ finalVersion } -f`;

		const gitCommand = gitStage + " && " + gitCommit + " && " + gitTag + " && " + gitPush;

		exec( `${ gitCommand }`, function( error, stdout, stderr ){
			console.log( stdout, stderr );
			if ( error !== null ){
				console.log( 'exec error: ' + error );
			}
		});

	} catch( err ){

		console.log( `Not completed: ${ err }` );

	} finally {

		rl.close();

	}

}

main();