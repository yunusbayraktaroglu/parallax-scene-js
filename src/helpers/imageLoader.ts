
export function loadImage( item: SceneOption ): Promise<HTMLImageElement> {

	return new Promise( ( resolve, reject ) => {

		/** Avoid mangle */
		fetch( item[ "imageUrl" ] )
			.then( response => response.blob() )
			.then( blob => {

				const blobURL = URL.createObjectURL( blob );
				const image = new Image();
				
				image.onload = () => {
					// Revoke after TexturePacker drawed image into canvas
					// URL.revokeObjectURL( blobURL );
					resolve( image );
				};
				image.onerror = ( err ) => reject( err );

				image[ "src" ] = blobURL;
				image[ "dataset" ][ "parallaxData" ] = JSON.stringify( item );

			} );

	} );
}

export async function loadImages( sceneData: Array<SceneOption> ): Promise<Array<HTMLImageElement>> {

	const promises = sceneData.map( item => loadImage( item ) );

	return Promise.all( promises ).catch( function( err ){
        throw err;
    } );

}