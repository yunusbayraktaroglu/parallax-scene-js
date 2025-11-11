/**
 * Creates a deterministic hash using array of paths
 * 
 * @param paths 
 * @returns Generated HASH
 */
export function generateGroupHash( paths: string[] ): string 
{
	// Normalize order to avoid order-based differences
	const normalized = [ ...paths ].sort().join( "|" );

	// Simple but effective 32-bit FNV-1a hash
	let hash = 2166136261;

	for ( let i = 0; i < normalized.length; i++ ){
		hash ^= normalized.charCodeAt( i );
		hash = Math.imul( hash, 16777619 );
	}

	// Convert to unsigned hex string
	return ( hash >>> 0 ).toString( 16 ).padStart( 8, "0" );
}