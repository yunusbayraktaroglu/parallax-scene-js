"use client";

import { createContext, useContext, useState } from "react";

interface PointerContextProps {
	pointerTarget: HTMLElement | null;
	setPointerTarget: React.Dispatch<React.SetStateAction<HTMLElement | null>>
};

const PointerTargetContext = createContext<PointerContextProps | undefined>( undefined );

export const usePointerTargetContext = () => {
	const context = useContext( PointerTargetContext );
	if ( ! context ){
	  	throw new Error( "usePointerTargetContext must be used within a PronotronPointerTargetProvider" );
	}
	return context;
};

export function PronotronPointerTargetProvider({ children }: { children: React.ReactNode })
{
	const [ pointerTarget, setPointerTarget ] = useState<HTMLElement | null>( null );

	return (
		<PointerTargetContext.Provider value={{ pointerTarget, setPointerTarget }}>
			{ children }
		</PointerTargetContext.Provider>
	);
}