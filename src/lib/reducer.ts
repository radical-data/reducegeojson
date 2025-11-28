import { truncate } from '@turf/truncate';
import type { FeatureCollection } from 'geojson';

export type ReductionOptions = {
	precision: number;
	propertiesToKeep: Set<string>;
};

export function reduceFeatureCollection(
	fc: FeatureCollection,
	options: ReductionOptions
): FeatureCollection {
	const filtered = filterProperties(fc, options.propertiesToKeep);
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return truncate(filtered as any, { precision: options.precision });
}

function filterProperties(fc: FeatureCollection, propertiesToKeep: Set<string>): FeatureCollection {
	return {
		type: 'FeatureCollection',
		features: fc.features.map((feature) => {
			const props = feature.properties ?? {};
			const filteredProps: Record<string, unknown> = {};
			for (const key of Object.keys(props)) {
				if (propertiesToKeep.has(key)) {
					filteredProps[key] = props[key];
				}
			}
			return { ...feature, properties: filteredProps };
		})
	};
}
