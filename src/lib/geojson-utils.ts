export function formatFileSize(size: number): string {
	if (size < 10 ** 3) {
		return `${size} B`;
	} else if (size < 10 ** 6) {
		return `${(size / 10 ** 3).toFixed(2)} KB`;
	} else if (size < 10 ** 9) {
		return `${(size / 10 ** 6).toFixed(2)} MB`;
	} else {
		return `${(size / 10 ** 9).toFixed(2)} GB`;
	}
}

export function calculatePercentageReduction(
	originalSize: number | null,
	reducedSize: number | null
): number | null {
	if (originalSize == null || reducedSize == null || originalSize === 0) {
		return null;
	}
	return ((originalSize - reducedSize) / originalSize) * 100;
}
