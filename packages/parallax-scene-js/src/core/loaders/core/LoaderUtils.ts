export type OnLoad = ( data: string | ArrayBuffer | Blob | ImageBitmap ) => void;
export type OnProgress = ( event: ProgressEvent ) => void;
export type OnError = ( err: unknown ) => void;

export class HttpError extends Error
{
	response: Response;
	
	constructor( message: string, response: Response )
	{
		super( message );
		this.response = response;
	}
}
