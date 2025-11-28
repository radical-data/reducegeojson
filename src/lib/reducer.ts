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
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const truncated = truncate(fc as any, { precision: options.precision });
	return filterProperties(truncated, options.propertiesToKeep);
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
			// Exclude properties from the spread, then conditionally add it back
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { properties, ...rest } = feature;
			return {
				...rest,
				...(Object.keys(filteredProps).length > 0
					? { properties: filteredProps }
					: {}) // omit `properties` entirely
			};
		})
	};
}
