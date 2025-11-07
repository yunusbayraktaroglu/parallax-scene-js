import { type ImageDownloadResult } from "../../controllers/ResourceController";
import { AdvancedBitmapLoader } from "./AdvancedBitmapLoader";
import { ParallaxSceneLayer } from "../../components/ParallaxScene";

type Images = {
	url: string;
	sizeInBytes?: number;
};

export class AdvancedAssetLoader
{
	private _imageLoader = new AdvancedBitmapLoader();
	//private _soundLoader = new AdvancedSoundLoader();

	/**
	 * Chunk based preloader
	 * 
	 * 1. Server may send opaque responses, user can use manifest.json
	 * 2. Can check content-length from response
	 * 
	 * @param scene
	 * @param onProgress
	 */
	async loadImagesAsync( images: Images[], onProgress?: ( percent: number ) => void ): Promise<ImageDownloadResult[]>
	{
		try {
			// Check for some, if found then every layer will be checked in _calculateTotalLoadSize 
			const useManitest = images.some( image => image.sizeInBytes );

			// AssetUrl → Total Bytes
			const totalSizeMap = new Map<string, number>();

			// AssetUrl → Loaded Bytes
			const loadedSizeMap = new Map<string, number>();

			// Calculate total size if manifest json used, else start with zero
			let totalLoadSize = useManitest ? this._calculateTotalLoadSize( images ) : 0;
			let totalLoaded = 0;
			let lastPercent = 0;

			const updateProgress = ( url: string, { loaded, total }: ProgressEvent ) =>
			{
				/**
				 * Add total size when the the first bytes comes
				 * 
				 * @todo
				 * That can be moved into loaders onLoadStart()
				 */
				if ( ! useManitest && ! loadedSizeMap.has( url ) ){
					totalLoadSize += total;
					totalSizeMap.set( url, total );
				}

				const prevLoaded = loadedSizeMap.get( url ) || 0;
				const delta = loaded - prevLoaded;

				totalLoaded += delta;
				loadedSizeMap.set( url, loaded );

				const percent = Math.round( Math.min(( totalLoaded / totalLoadSize ) * 100, 100 ) );

				if ( percent > lastPercent ){
					lastPercent = percent;
					onProgress?.( percent );
				}
			}

			// Decrease totalLoadSize if layer download throws error
			const onError = ( image: Images ) =>
			{
				// If sizeInBytes is missing, so we use manifets, 
				// totalSizeMap should defined or not proceed any
				totalLoadSize -= ( image.sizeInBytes || totalSizeMap.get( image.url ) || 0 ); 
			};

			const layerPromises = images.map( async ( image ) => 
			{
				const request = useManitest ? { url: image.url, sizeInBytes: image.sizeInBytes! } : image.url;

				return this._imageLoader.loadAsync( request, ( event: ProgressEvent<EventTarget> ) => {
					updateProgress( image.url, event );
				} )
				.then( imageBitmap => {
					return { url: image.url, file: imageBitmap } 
				} )
				.catch( error => {
					onError( image );
					throw error;
				} )

			} );

			return await Promise.all( layerPromises );

		} catch( error: any ){

			throw error;

		}
	}

	/**
	 * Calculates total load size by scene data using
	 * {@link ParallaxSceneLayer.sizeInBytes} property.
	 * 
	 * @param scene  
	 * @internal
	 */
	private _calculateTotalLoadSize( images: Images[] )
	{
		return images.reduce( ( total, image ) => {

			// This method should only be called if all the layers has sizeInBytes property
			if ( ! image.sizeInBytes  ){ 
				throw new Error( `Layer "${ image.url }" is missing the sizeInBytes property.` );
			}

			return total + image.sizeInBytes;

		}, 0 );
	}

}