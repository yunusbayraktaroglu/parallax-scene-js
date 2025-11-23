export function LoadingBar({ loaded, sceneID }: { loaded: number, sceneID: string })
{
	return (
		<div className="flex flex-col w-1/2 min-w-[100px] text-white">
			<p className="text-lg text-right text-green-500">{ loaded }%</p>
			<div className="w-full bg-slate-700 rounded-lg overflow-hidden">
				<div className="block bg-green-500 h-[10px] origin-left" style={{ transform: `translate3d( 0, 0, 0 ) scaleX(${ loaded / 100 })`}} />
			</div>
			<p className="text-xs text-left mt-spacing-xs">Scene: { sceneID }</p>
		</div>
	)
}