import { ExpandIcon, CloseIcon } from "./SiteSVG";

interface HideableRowProps {
	title: string;
	description?: string;
	expand: boolean;
	setExpand: ( isExpanded: boolean ) => void;
	children: React.ReactNode;
};

export function Expandable({ title, description, expand, setExpand, children, ...divProps }: HideableRowProps & React.ComponentProps<"div">)
{
	const ariaExpanded = expand ? 'true' : 'false';
	const opacity = ! expand ? " opacity-50" : "";

	return (
		<div className={ "container flex flex-col py-spacing-sm landscape:py-spacing-sm" + opacity } { ...divProps }>
			<div className="flex flex-row justify-between">
				<button
					type='button'
					aria-haspopup='true'
					aria-label='Open Menu'
					aria-expanded={ ariaExpanded }
					className='flex justify-between items-center w-full p-spacing-sm group'
					onClick={ () => setExpand( ! expand ) }
				>
					<div className="text-left mr-1">
						<h3 className="text-base leading-none font-bold">{ title }</h3>
						{ ( description && ! expand ) && <p className="text-xs leading-none opacity-60 mt-1">{ description }</p> }
					</div>
					<span className='sr-only'>Open main menu</span>
					<ExpandIcon className='h-5 w-5 hidden group-aria-[expanded=false]:block' fill='none' viewBox='0 0 24 24' strokeWidth='1.5' stroke='currentColor' aria-hidden='true' />
					<CloseIcon className='h-5 w-5 hidden group-aria-[expanded=true]:block' fill='none' viewBox='0 0 24 24' strokeWidth='1.5' stroke='currentColor' aria-hidden='true' />
				</button>
			</div>
			{ expand && children }
		</div>
	);
}