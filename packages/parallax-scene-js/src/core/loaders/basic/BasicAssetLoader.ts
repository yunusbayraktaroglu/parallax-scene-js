import { type ImageDownloadResult } from "../../controllers/ResourceController";
import { BasicBitmapLoader } from "./BasicBitmapLoader";
import { BasicOnProgress } from "../core/Loader";
import { LoadingManager } from "./LoadingManager";

/**
 * Represents a single image load request.
 */
type images = {
	/** The URL of the image to load. */
	url: string;
};

/**
 * Loads multiple image assets with simple item-based progress tracking.
 * Progress is calculated by item count, not by bytes.
 */
export class BasicAssetLoader
{
	/**
	 * Internal bitmap loader responsible for loading individual image files.
	 * @internal
	 */
	private _imageLoader = new BasicBitmapLoader();

	/**
	 * Loads a list of images asynchronously with progress tracking.
	 * 
	 * Progress is based on the number of items loaded versus total items.
	 * 
	 * @param images - List of images to load.
	 * @param onProgress - Optional callback that reports overall progress (0–100).
	 * @returns A promise resolving to an array of image download results.
	 */
	async loadImagesAsync( images: images[], onProgress?: ( percent: number ) => void ): Promise<ImageDownloadResult[]>
	{
		try {

			/**
			 * @todo
			 * Each request batch may use its own loading manager
			 */
			//const manager = new LoadingManager();
			//manager.onProgress = ( url, loadedItem, totalItem ) => onProgress?.( ( loadedItem / totalItem ) * 100 );
			
			// Create async download tasks for each image
			const layerPromises = images.map( async ( image ) => 
			{
				return this._imageLoader.loadAsync( image.url, ( url: string, loaded: number, total: number ) => {
					onProgress?.( ( loaded / total ) * 100 );
				} )
				.then( imageBitmap => {
					return { url: image.url, file: imageBitmap }; 
				} )
				.catch( error => {
					throw error;
				} );
			} );

			return await Promise.all( layerPromises );

		} catch( error ){

			throw error;

		}
	}
}
