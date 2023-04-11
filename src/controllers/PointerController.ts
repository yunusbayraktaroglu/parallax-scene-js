import { Vector2 } from '../math/Vector2';
import { detectTouch } from '../helpers/detectTouch';

export const UPointer = new Vector2();

/**
 * Ease pointer movement with using delta
 * return a value for x & y, inside -1 -> +1
 */
export class PointerController {

	isTouchDevice = detectTouch();
    pointerMultiplier = 0.1;
    deltaMultiplier = 0.00125;
	addEvents!: () => void;
	removeEvents!: () => void;

	/** 
     * Ease logic, hacky but most performant ease
     * Add pointer delta to a target(pointerDeltaTarget) in every pointer move, 
     * then try to make eased(pointerDeltaEased) value equal to target value in tick() function
     */
	private _pointerStart = new Vector2();
	private _pointerEnd = new Vector2();
	private _pointerDelta = new Vector2();

	private _pointerDeltaTarget = new Vector2();
	private _pointerDeltaEased = new Vector2();
	private _pointerDeltaDistance = new Vector2();
	private _pointerFinalDelta = new Vector2();

	init( interactionTarget?: HTMLElement ): void {

		const target = interactionTarget ? interactionTarget : window;

		/* eslint-disable @typescript-eslint/no-this-alias */
		const scope = this; 

        /** TOUCH EVENTS ------------------------------------------------------------------ */
		function _onTouchStart( event: TouchEvent ): void {

            /** Prevent canvas scroll */
			event.preventDefault();

			target.addEventListener( "touchmove", _onTouchMove as EventListener, { passive: false } );
			target.addEventListener( "touchend", _onTouchUp as EventListener, { passive: false } );

            const { clientX, clientY } = event.touches[ 0 ];

            _startPointer( clientX, clientY );

		}

		function _onTouchMove( event: TouchEvent ): void {

            /** Prevent canvas scroll */
			event.preventDefault();

            const { clientX, clientY } = event.touches[ 0 ];
            
            _updatePointer( clientX, clientY );

		}

        function _onTouchUp(): void {

			target.removeEventListener( "touchmove", _onTouchMove as EventListener );
			target.removeEventListener( "touchend", _onTouchUp as EventListener );

		}
        /** END TOUCH EVENTS ------------------------------------------------------------------ */


        /** MOUSE EVENTS ---------------------------------------------------------------------- */
        function _onPointerMove( event: PointerEvent ): void {

            const { movementX, movementY } = event;
            _updateWithDelta( movementX, movementY );

        }
        /** END MOUSE EVENTS ------------------------------------------------------------------ */



        function _startPointer( x: number, y: number ): void {

            scope._pointerStart.set( x, y );

        }

        function _updatePointer( x: number, y: number ): void {

            scope._pointerEnd.set( x, y );
			scope._pointerDelta
				.subVectors( scope._pointerEnd, scope._pointerStart )
				.multiplyScalar( scope.deltaMultiplier );
				
			scope._pointerStart.copy( scope._pointerEnd );

            /** Continiously add delta to target for easing logic */
			scope._pointerDeltaTarget.add( scope._pointerDelta );

        }

		function _updateWithDelta( x: number, y: number ): void {

            scope._pointerDelta.set( x, y ).multiplyScalar( scope.deltaMultiplier );

            /** Continiously add delta to target for easing logic */
			scope._pointerDeltaTarget.add( scope._pointerDelta );

        }


        /**
         * SWITCHERS
         */
        this.addEvents = () => {

            if ( scope.isTouchDevice ){
                target.addEventListener( "touchstart", _onTouchStart as EventListener, { passive: false } );
            } else {
				target.addEventListener( "pointermove", _onPointerMove as EventListener, { passive: false } );
            }
			
        };

        this.removeEvents = () => {

            scope._pointerDeltaTarget.set( 0, 0 );
            scope._pointerDeltaEased.set( 0, 0 );
            scope._pointerDeltaDistance.set( 0, 0 );

            if ( scope.isTouchDevice ){
                target.removeEventListener( "touchstart", _onTouchStart as EventListener );
                target.removeEventListener( "touchmove", _onTouchMove as EventListener );
                target.removeEventListener( "touchend", _onTouchUp as EventListener );
            } else {
                target.removeEventListener( "pointermove", _onPointerMove as EventListener );
            }

        };
        
	}

	setSensitivity( pointerMultiplier: number, deltaMultiplier: number ): void {

		this.pointerMultiplier = pointerMultiplier;
		this.deltaMultiplier = deltaMultiplier;
		
	}

	tick(): void {

        /** Subtract vectors and multiply with a constant float */
		this._pointerDeltaDistance.subVectors( this._pointerDeltaTarget, this._pointerDeltaEased );

		const delta = this._pointerDeltaDistance.lengthSq();

		if ( delta < 0.0005 ){

			this._pointerFinalDelta.set( 0, 0 );

		} else {

			this._pointerDeltaEased.add( this._pointerDeltaDistance.multiplyScalar( this.pointerMultiplier ) );
			this._pointerFinalDelta.copy( this._pointerDeltaDistance );

			UPointer.add( this._pointerFinalDelta ).clampScalar( -1, 1 );
		}

	}

}