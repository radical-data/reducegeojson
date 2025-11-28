import { describe, it, expect } from 'vitest';
import { reduceFeatureCollection } from './reducer';
import type { FeatureCollection } from 'geojson';

describe('reduceFeatureCollection', () => {
	it('filters properties and truncates coordinates', () => {
		const input: FeatureCollection = {
			type: 'FeatureCollection',
			features: [
				{
					type: 'Feature',
					geometry: {
						type: 'Point',
						coordinates: [1.123456789, 2.987654321]
					},
					properties: {
						name: 'Test Point',
						value: 42,
						description: 'A test feature'
					}
				}
			]
		};

		const propertiesToKeep = new Set(['name', 'value']);
		const result = reduceFeatureCollection(input, {
			precision: 2,
			propertiesToKeep
		});

		expect(result.type).toBe('FeatureCollection');
		expect(result.features).toHaveLength(1);

		const feature = result.features[0];
		expect(feature.properties).toEqual({
			name: 'Test Point',
			value: 42
		});
		expect(feature.properties).not.toHaveProperty('description');

		// Check that coordinates are truncated to 2 decimal places
		if (feature.geometry.type === 'Point') {
			expect(feature.geometry.coordinates[0]).toBe(1.12);
			expect(feature.geometry.coordinates[1]).toBe(2.99);
		}
	});

	it('handles features with null properties', () => {
		const input: FeatureCollection = {
			type: 'FeatureCollection',
			features: [
				{
					type: 'Feature',
					geometry: {
						type: 'Point',
						coordinates: [1.0, 2.0]
					},
					properties: null
				}
			]
		};

		const result = reduceFeatureCollection(input, {
			precision: 2,
			propertiesToKeep: new Set(['name'])
		});

		expect(result.features).toHaveLength(1);
		expect(result.features[0].properties).toEqual({});
	});

	it('handles empty property set', () => {
		const input: FeatureCollection = {
			type: 'FeatureCollection',
			features: [
				{
					type: 'Feature',
					geometry: {
						type: 'Point',
						coordinates: [1.123456, 2.987654]
					},
					properties: {
						name: 'Test',
						value: 123
					}
				}
			]
		};

		const result = reduceFeatureCollection(input, {
			precision: 3,
			propertiesToKeep: new Set()
		});

		expect(result.features[0].properties).toEqual({});
	});

	it('handles multiple features', () => {
		const input: FeatureCollection = {
			type: 'FeatureCollection',
			features: [
				{
					type: 'Feature',
					geometry: {
						type: 'Point',
						coordinates: [1.1111, 2.2222]
					},
					properties: { name: 'A', keep: true, remove: 'x' }
				},
				{
					type: 'Feature',
					geometry: {
						type: 'Point',
						coordinates: [3.3333, 4.4444]
					},
					properties: { name: 'B', keep: false, remove: 'y' }
				}
			]
		};

		const result = reduceFeatureCollection(input, {
			precision: 2,
			propertiesToKeep: new Set(['name', 'keep'])
		});

		expect(result.features).toHaveLength(2);
		expect(result.features[0].properties).toEqual({ name: 'A', keep: true });
		expect(result.features[1].properties).toEqual({ name: 'B', keep: false });
	});
});
