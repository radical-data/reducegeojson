<script lang="ts">
	import truncate from '@turf/truncate';

	function formatFileSize(size: number) {
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

	function calculatePercentageReduction(originalSize: number, reducedSize: number) {
		if (originalSize === 0) {
			return 0; // Prevent division by zero
		}
		return ((originalSize - reducedSize) / originalSize) * 100;
	}

	let coordinatePrecision = 6;
	let geoJSONData = null;
	let processedGeoJSON = null;
	let uploadedFileSize: number | null = null;
	let processedGeoJSONSize: number | null = null;
	let percentageReduction: number | null = null;

	const handleFileChange = (event: Event) => {
		const input = event.target as HTMLInputElement | null;
		if (input) {
			const file = input.files?.[0];
			if (file) {
				uploadedFileSize = file.size;
				console.log(uploadedFileSize);

				const reader = new FileReader();
				reader.onload = (event) => {
					const result = event.target?.result;
					if (result && typeof result === 'string') {
						geoJSONData = JSON.parse(result);
					}
				};
				reader.readAsText(file);
			}
		}
	};

	const processGeoJSON = () => {
		if (geoJSONData) {
			const precision = coordinatePrecision;

			const options = { precision: precision };
			const truncatedGeoJSON = truncate(geoJSONData, options);

			processedGeoJSON = JSON.stringify(truncatedGeoJSON);
			processedGeoJSONSize = new TextEncoder().encode(processedGeoJSON).length;
		}

		if (geoJSONData && processedGeoJSON) {
			const originalSize = JSON.stringify(geoJSONData).length;
			percentageReduction = calculatePercentageReduction(originalSize, processedGeoJSON.length);
		}
	};

	// Function to trigger the download of the processed GeoJSON
	const downloadProcessedGeoJSON = () => {
		if (processedGeoJSON) {
			const blob = new Blob([processedGeoJSON], { type: 'application/json' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = 'processed.geojson';
			a.click();
			URL.revokeObjectURL(url);
		}
	};
</script>

<h1>GeoJSON Size Reducer</h1>
<p>A tool to reduce the file size of GeoJSON files for web optimisation.</p>
<p>All conversions are done locally in your browser without sending any data anywhere else.</p>

<input type="file" name="geojson" on:change={handleFileChange} />
<p>
	Uploaded file size: {#if uploadedFileSize}{formatFileSize(uploadedFileSize)}{:else}N/A{/if}
</p>
<label for="decimalPlaces">Decimal places in coordinates:</label>
<input
	type="number"
	id="decimalPlaces"
	min="1"
	max="15"
	step="1"
	bind:value={coordinatePrecision}
/>
<button on:click={processGeoJSON}>Reduce size</button>
<button on:click={downloadProcessedGeoJSON}>Download Processed GeoJSON</button>

<p>
	Processed GeoJSON size: {#if processedGeoJSONSize}{formatFileSize(
			processedGeoJSONSize
		)}{:else}N/A{/if}
</p>
<p>
	Percentage Reduction: {#if processedGeoJSONSize}{calculatePercentageReduction(
			uploadedFileSize,
			processedGeoJSONSize
		).toFixed(2)}%{:else}N/A{/if}
</p>

<style>
	@import '/src/style.css';
</style>
