/**
 * Object for keeping track of time. 
 */
export class Clock {

	private startTime = 0;
	private oldTime = 0;
	private elapsedTime = 0;
	private now!: () => number;

	constructor() {

		if ( typeof performance === "undefined" ){
			this.now = () => Date.now();
		} else {
			this.now = () => performance.now();
		}

	}

	start(): void {

		this.startTime = this.now();
		this.oldTime = this.startTime;

	}

	pause(): void {

		this.getElapsedTime();

	}

	stop(): void {

		this.getElapsedTime();
		this.elapsedTime = 0;

	}

	getElapsedTime(): number {

		this.getDelta();
		return this.elapsedTime;

	}

	getDelta(): void  {

		let diff = 0;
		const newTime = this.now();

		diff = ( newTime - this.oldTime ) / 1000;
		
		this.oldTime = newTime;
		this.elapsedTime += diff;

	}

}