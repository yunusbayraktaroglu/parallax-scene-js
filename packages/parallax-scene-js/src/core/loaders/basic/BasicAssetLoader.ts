import { type ImageDownloadResult } from "../../controllers/ResourceController";
import { BasicBitmapLoader } from "./BasicBitmapLoader";
import { BasicOnProgress } from "../core/Loader";

type images = {
	url: string;
};

export class BasicAssetLoader
{
	private _imageLoader = new BasicBitmapLoader();

	/**
	 * Item count based preloading
	 * 
	 * @param scene 
	 * @param onProgress 
	 */
	async loadImagesAsync( images: images[], onProgress?: BasicOnProgress ): Promise<ImageDownloadResult[]>
	{
		try {

			const layerPromises = images.map( async ( image ) => 
			{
				return this._imageLoader.loadAsync( image.url, ( url: string, loaded: number, total: number ) => {
					onProgress?.( url, loaded, total );
				} )
				.then( imageBitmap => {
					return { url: image.url, file: imageBitmap } 
				} )
				.catch( error => {
					throw error;
				} )
			} );

			return await Promise.all( layerPromises );

		} catch( error ){

			throw error;

		}
	}
}
