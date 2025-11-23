export class Rect 
{
	/**
	 * Rect should be multiplied with devicePixelRatio
	 */
	dirty = true;
	
	x: number = 0;
	y: number = 0;
	w: number = 0;
	h: number = 0;

	set( { x, y, w, h }: Rectangle )
	{
		this.x = x;
		this.y = y;
		this.w = w;
		this.h = h;

		return this;
	}

	multiplyScalar( s: number )
	{
		this.x *= s;
		this.y *= s;
		this.w *= s;
		this.h *= s;

		return this;
	}

	floor()
	{
		this.x = Math.floor( this.x );
		this.y = Math.floor( this.y );
		this.w = Math.floor( this.w );
		this.h = Math.floor( this.h );

		return this;
	}
}