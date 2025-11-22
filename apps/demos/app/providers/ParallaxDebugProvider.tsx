"use client";

import { useReducer, createContext, useContext } from "react";

import { ParallaxSceneProps } from "@/app/components/ParallaxScene";

type SceneDebugData = ParallaxSceneProps & {
	isActive: boolean;
};

// Actions
type SceneAddAction = {
	type: "add";
	payload: Required<SceneDebugData>; 
};
type SceneDeleteAction = {
	type: "delete";
	payload: {
		id: string;
	}; 
};
type SceneChangeAction = {
	type: "change";
	payload: Partial<SceneDebugData> & {
		id: string;
	}; 
};
type SceneAction = SceneAddAction | SceneDeleteAction | SceneChangeAction;

interface PointerContextProps {
	scenes: Required<SceneDebugData>[];
	dispatch: React.ActionDispatch<[action: SceneAction]>;
};

const ParallaxDebugContext = createContext<PointerContextProps | undefined>( undefined );

/**
 * To add reactivity to Parallax Scenes,
 * only debug purposes
 */
export const useParallaxDebugProviderContext = () => {
	const context = useContext( ParallaxDebugContext );
	if ( ! context ){
	  	throw new Error( "useParallaxDebugProviderContext must be used within a ParallaxDebugContext" );
	}
	return context;
};

/**
 * To add reactivity to Parallax Scenes,
 * only debug purposes
 */
export function ParallaxDebugProvider({ children }: { children: React.ReactNode })
{
	const [ scenes, dispatch ] = useReducer( scenesReducer, [] );

	return (
		<ParallaxDebugContext value={{ scenes, dispatch }}>
			{ children }
		</ParallaxDebugContext>
	);
}

function scenesReducer( scenes: Required<SceneDebugData>[], action: SceneAction ): Required<SceneDebugData>[]
{
	switch ( action.type ){
		case 'add': {
			return [ ...scenes, action.payload ];
		}
		case 'change': {
			return scenes.map( scene => {
				if ( scene.id === action.payload.id ){
					return { ...scene, ...action.payload };
				} else {
					return scene;
				}
			} );
		}
		case 'delete': {
			return scenes.filter( scene => scene.id !== action.payload.id );
		}
		default: {
			// @ts-expect-error: Property 'type' does not exist on type 'never'
			throw Error( 'Unknown action: ' + action.type );
		}
	}
}