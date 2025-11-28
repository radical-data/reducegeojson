import { describe, it, expect } from 'vitest';
import { formatFileSize, calculatePercentageReduction } from './geojson-utils';

describe('formatFileSize', () => {
	it('formats bytes correctly', () => {
		expect(formatFileSize(500)).toBe('500 B');
	});

	it('formats kilobytes correctly', () => {
		expect(formatFileSize(1500)).toBe('1.50 KB');
	});

	it('formats megabytes correctly', () => {
		expect(formatFileSize(1500000)).toBe('1.50 MB');
	});

	it('formats gigabytes correctly', () => {
		expect(formatFileSize(1500000000)).toBe('1.50 GB');
	});
});

describe('calculatePercentageReduction', () => {
	it('calculates percentage reduction correctly', () => {
		expect(calculatePercentageReduction(1000, 500)).toBe(50);
	});

	it('returns null for zero original size', () => {
		expect(calculatePercentageReduction(0, 500)).toBe(null);
	});

	it('returns null for null original size', () => {
		expect(calculatePercentageReduction(null, 500)).toBe(null);
	});

	it('returns null for null reduced size', () => {
		expect(calculatePercentageReduction(1000, null)).toBe(null);
	});

	it('returns null for both null', () => {
		expect(calculatePercentageReduction(null, null)).toBe(null);
	});

	it('calculates 100% reduction correctly', () => {
		expect(calculatePercentageReduction(1000, 0)).toBe(100);
	});

	it('calculates small reductions correctly', () => {
		expect(calculatePercentageReduction(1000, 900)).toBe(10);
	});
});
