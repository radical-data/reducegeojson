// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};

// Type declaration for @turf/truncate v7
declare module '@turf/truncate' {
	export interface TruncateOptions {
		precision?: number;
		coordinates?: number;
		mutate?: boolean;
	}

	export function truncate(geojson: any, options?: TruncateOptions): any;
}
