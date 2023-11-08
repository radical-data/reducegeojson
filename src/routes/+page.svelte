<script lang="ts">
	import truncate from '@turf/truncate';
	import type { GeoJSON, FeatureCollection, Feature, GeoJsonProperties, Geometry } from 'geojson';

	let originalFilename: string | null = null;

	let coordinatePrecision = 6;
	let geoJSONData: GeoJSON | null = null;
	let processedGeoJSON: string | null = null;
	let uploadedFileSize: number | null = null;
	let processedGeoJSONSize: number | null = null;
	let percentageReduction: number | null = null;

	let availableProperties: string[] = [];
	let selectedProperties: Set<string> = new Set();

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

	function calculatePercentageReduction(originalSize: number | null, reducedSize: number | null) {
		if (originalSize === 0 || originalSize == null || reducedSize == null) {
			return 0;
		}
		return ((originalSize - reducedSize) / originalSize) * 100;
	}

	function extractProperties(geoJSONData: any) {
		if (geoJSONData && geoJSONData.features && geoJSONData.features.length > 0) {
			const feature = geoJSONData.features[0]; // Consider the first feature
			return Object.keys(feature.properties || {});
		}
		return [];
	}

	const togglePropertySelection = (property: string) => {
		if (selectedProperties.has(property)) {
			selectedProperties.delete(property);
		} else {
			selectedProperties.add(property);
		}
	};

	const handleFileChange = (event: Event) => {
		const input = event.target as HTMLInputElement | null;
		if (input) {
			const file = input.files?.[0];
			if (file) {
				uploadedFileSize = file.size;
				originalFilename = file.name;

				const reader = new FileReader();
				reader.onload = (event) => {
					const result = event.target?.result;
					if (result && typeof result === 'string') {
						geoJSONData = JSON.parse(result);
						availableProperties = extractProperties(geoJSONData);
						selectedProperties = new Set(availableProperties);
					}
				};
				reader.readAsText(file);
			}
		}
	};

	const filterProperties = (geojson: GeoJSON): FeatureCollection => {
		const processedFeatures: Feature<Geometry, GeoJsonProperties>[] = geojson.features.map(
			(feature) => {
				const filteredProperties = Object.keys(feature.properties)
					.filter((property) => selectedProperties.has(property))
					.reduce((obj, key) => {
						obj[key] = feature.properties[key];
						return obj;
					}, {});

				return {
					...feature,
					properties: filteredProperties
				};
			}
		);

		const processedGeoJSON: FeatureCollection = {
			type: 'FeatureCollection',
			features: processedFeatures
		};

		return processedGeoJSON;
	};

	const processGeoJSON = () => {
		if (geoJSONData) {
			let filteredGeoJSON = filterProperties(geoJSONData);
			const options = { precision: coordinatePrecision };
			const truncatedGeoJSON = truncate(filteredGeoJSON, options);
			processedGeoJSON = JSON.stringify(truncatedGeoJSON);
			processedGeoJSONSize = new TextEncoder().encode(processedGeoJSON).length;
		}

		if (geoJSONData && processedGeoJSON) {
			const originalSize = JSON.stringify(geoJSONData).length;
			percentageReduction = calculatePercentageReduction(originalSize, processedGeoJSON.length);
		}
	};

	const downloadProcessedGeoJSON = () => {
		if (processedGeoJSON && originalFilename) {
			const blob = new Blob([processedGeoJSON], { type: 'application/geo+json' });
			const a = document.createElement('a');
			a.href = URL.createObjectURL(blob);

			const filteredFileName = originalFilename.replace('.geojson', '_filtered.geojson');

			a.download = filteredFileName;
			a.click();
			URL.revokeObjectURL(a.href);
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

<p>Include Properties:</p>
{#if availableProperties.length > 0}
	{#each availableProperties as property}
		<label>
			<input
				type="checkbox"
				checked={selectedProperties.has(property)}
				on:change={() => togglePropertySelection(property)}
			/>
			{property}
		</label>
	{/each}
{:else}
	<p>No properties available.</p>
{/if}

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
