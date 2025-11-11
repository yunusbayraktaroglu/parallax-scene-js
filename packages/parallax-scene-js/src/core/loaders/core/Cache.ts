type CacheFile = any; // Can be narrowed if needed

export const Cache = {
	/**
	 * Whether caching is enabled or not.
	 */
	enabled: true as boolean,

	/**
	 * A dictionary that holds cached files.
	 */
	files: {} as Record<string, CacheFile>,

	/**
	 * Adds a cache entry with a key to reference the file. If this key already
	 * holds a file, it is overwritten.
	 */
	add( key: string, file: CacheFile ): void
	{
		if ( ! this.enabled ) return;
		this.files[ key ] = file;
	},
	
	/**
	 * Gets the cached value for the given key.
	 */
	get( key: string ): CacheFile | undefined
	{
		if ( ! this.enabled ) return;
		return this.files[ key ];
	},

	/**
	 * Removes the cached file associated with the given key.
	 */
	remove( key: string ): void
	{
		delete this.files[ key ];
	},

	/**
	 * Remove all values from the cache.
	 */
	clear(): void
	{
		this.files = {};
	},
};