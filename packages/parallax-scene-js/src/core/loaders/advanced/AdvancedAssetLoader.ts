import { type ImageDownloadResult } from "../../controllers/ResourceController";
import { AdvancedBitmapLoader } from "./AdvancedBitmapLoader";
import { ParallaxSceneLayer } from "../../components/ParallaxScene";

/**
 * Represents a single asset load request.
 */
type LoadRequest = {
	/** The URL of the asset to load. */
	url: string;
	/** The total size of the asset in bytes, if known (e.g. from a manifest). */
	sizeInBytes?: number;
};

/**
 * Loads image assets with detailed progress tracking and optional size manifest support.
 * Handles both known and unknown content lengths, enabling accurate percentage reporting.
 */
export class AdvancedAssetLoader
{
	/**
	 * Internal bitmap loader instance responsible for individual image downloads
	 * @internal
	 */
	private _imageLoader = new AdvancedBitmapLoader();

	/**
	 * Loads multiple images asynchronously with progress tracking.
	 * 
	 * Supports both:
	 * - Known file sizes (via manifest data)
	 * - Unknown sizes (estimated from download progress)
	 * 
	 * @param images - List of image load requests.
	 * @param onProgress - Optional callback fired with the overall loading percentage (0–100).
	 * @returns A promise resolving to an array of loaded image results.
	 */
	async loadImagesAsync( images: LoadRequest[], onProgress?: ( percent: number ) => void ): Promise<ImageDownloadResult[]>
	{
		try {
			// If at least one image includes sizeInBytes, assume manifest-based loading
			const useManitest = images.some( image => image.sizeInBytes );

			// Maps each asset URL to its total expected size (bytes)
			const totalSizeMap = new Map<string, number>();

			// Maps each asset URL to its currently loaded byte count
			const loadedSizeMap = new Map<string, number>();

			// Initialize total expected load size
			let totalLoadSize = useManitest ? this._calculateTotalLoadSize( images ) : 0;
			let totalLoaded = 0;
			let lastPercent = 0;

			/**
			 * Updates overall loading progress whenever an asset reports progress.
			 */
			const updateProgress = ( url: string, { loaded, total }: ProgressEvent ) =>
			{
				/**
				 * Add total size when the first bytes are received (non-manifest mode only).
				 * 
				 * @todo
				 * Move this logic into loader's onLoadStart() event.
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

			/**
			 * Handles errors during image download.
			 * Decreases totalLoadSize to maintain accurate percentage calculation.
			 */
			const onError = ( image: LoadRequest ) =>
			{
				totalLoadSize -= ( image.sizeInBytes || totalSizeMap.get( image.url ) || 0 ); 
			};

			// Create async download tasks for each image
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
	 * Calculates the total expected size of all image assets based on their {@link ParallaxSceneLayer.sizeInBytes} values.
	 * Used when a manifest provides known file sizes.
	 * 
	 * @param images - List of images with defined sizeInBytes properties.
	 * @returns The total number of bytes expected to be downloaded.
	 * @throws If any image is missing the sizeInBytes property.
	 * @internal
	 */
	private _calculateTotalLoadSize( images: LoadRequest[] )
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