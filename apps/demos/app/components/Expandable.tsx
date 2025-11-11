"use client";

import { useState } from "react";
import { ExpandIcon, CloseIcon } from "./SiteSVG";

interface HideableRowProps {
	title: string;
	expand?: boolean;
	children: React.ReactNode;
};

export function Expandable({ expand = true, title, children, ...divProps }: HideableRowProps & React.ComponentProps<"div">)
{
	const [ expandState, setExpandState ] = useState<boolean>( expand );
	const ariaExpanded = expandState ? 'true' : 'false';
	const opacity = ! expandState ? " opacity-50" : "";

	return (
		<div className={ "container flex flex-col py-spacing-sm landscape:py-spacing-sm" + opacity } { ...divProps }>
			<div className="flex flex-row justify-between">
				<button
					type='button'
					aria-haspopup='true'
					aria-label='Open Menu'
					aria-expanded={ ariaExpanded }
					className='flex justify-between items-center w-full p-spacing-sm group'
					onClick={() => setExpandState(( prev ) => ! prev )}
				>
					<h3 className="text-sm leading-none">{ title }</h3>
					<span className='sr-only'>Open main menu</span>
					<ExpandIcon className='h-5 w-5 hidden group-aria-[expanded=false]:block' fill='none' viewBox='0 0 24 24' strokeWidth='1.5' stroke='currentColor' aria-hidden='true' />
					<CloseIcon className='h-5 w-5 hidden group-aria-[expanded=true]:block' fill='none' viewBox='0 0 24 24' strokeWidth='1.5' stroke='currentColor' aria-hidden='true' />
				</button>
			</div>
			{ expandState && children }
		</div>
	);
}