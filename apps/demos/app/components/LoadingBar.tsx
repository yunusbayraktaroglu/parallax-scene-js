export function LoadingBar({ loaded }: { loaded: number })
{
	return (
		<div className="flex flex-col items-end w-50">
			<small>{ loaded }%</small>
			<div className="rounded-lg overflow-hidden bg-slate-700 w-full">
				<div className="block bg-green-500 h-[10px] origin-left" style={{ transform: `translate3d( 0, 0, 0 ) scaleX(${ loaded / 100 })`}} />
			</div>
		</div>
	)
}