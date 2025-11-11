import type { NextConfig } from 'next';
import { PHASE_PRODUCTION_BUILD }  from "next/constants.js";

const nextConfig = ( phase: string ): NextConfig => {
	if ( phase === PHASE_PRODUCTION_BUILD ) {
		return {
			output: 'export',
			basePath: '/parallax-scene-js',
		};
	}

	return {};
};

export default nextConfig;