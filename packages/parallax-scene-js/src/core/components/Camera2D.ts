import { Matrix3 } from "../math/Matrix3";

export class Camera2D
{
	width!: number;
	height!: number;
	zoom!: number;
	projectionMatrix: Matrix3;

	constructor()
	{
		this.projectionMatrix = new Matrix3();
	}

	getProjectionMatrix(): number[]
	{
		return this.projectionMatrix.elements;
	}

	/**
	 * Cartesian coordinate system
	 * 
	 * @see https://en.wikipedia.org/wiki/Cartesian_coordinate_system
	 * @see https://webglfundamentals.org/webgl/lessons/webgl-2d-matrices.html
	 * @see https://webglfundamentals.org/webgl/resources/m3.js
	 */
	setProjection( width: number, height: number, zoom: number = 1 ): void
	{
		this.width = width;
		this.height = height;
		this.zoom = zoom;

		const adjustedWidth = width / zoom;
		const adjustedHeight = height / zoom;
	
		this.projectionMatrix.set(
			2 / adjustedWidth, 0, 0,
			0, -2 / adjustedHeight, 0,
			-1, 1, 1
		);
	}
}