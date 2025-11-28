<script lang="ts">
	import type { FeatureCollection } from 'geojson';
	import { formatFileSize, calculatePercentageReduction } from '$lib/geojson-utils';
	import { reduceFeatureCollection } from '$lib/reducer';
	import { SvelteSet } from 'svelte/reactivity';

	let originalFilename: string | null = $state(null);

	let coordinatePrecision = $state(6);
	let geoJSONData: FeatureCollection | null = $state(null);
	let processedGeoJSON: string | null = $state(null);
	let uploadedFileSize: number | null = $state(null);
	let processedGeoJSONSize: number | null = $state(null);

	let availableProperties: string[] = $state([]);
	let selectedProperties = $state.raw(new SvelteSet<string>());
	let propertyFilter = $state('');
	let errorMessage: string | null = $state(null);
	let isProcessing = $state(false);
	let showLargeFileWarning = $state(false);

	function extractProperties(featureCollection: FeatureCollection): string[] {
		const propsSet = new SvelteSet<string>();
		for (const feature of featureCollection.features) {
			const props = feature.properties ?? {};
			for (const key of Object.keys(props)) {
				propsSet.add(key);
			}
		}
		return Array.from(propsSet).sort();
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
				showLargeFileWarning = file.size > 10 * 1024 * 1024; // 10 MB

				const reader = new FileReader();
				reader.onload = (event) => {
					const result = event.target?.result;
					if (result && typeof result === 'string') {
						try {
							const parsed = JSON.parse(result);

							if (parsed.type !== 'FeatureCollection' || !Array.isArray(parsed.features)) {
								errorMessage = 'Valid JSON, but not a GeoJSON FeatureCollection.';
								geoJSONData = null;
								availableProperties = [];
								selectedProperties.clear();
								processedGeoJSON = null;
								processedGeoJSONSize = null;
								return;
							}

							errorMessage = null;
							geoJSONData = parsed as FeatureCollection;
							availableProperties = extractProperties(geoJSONData);
							selectedProperties.clear();
							for (const p of availableProperties) {
								selectedProperties.add(p);
							}
						} catch {
							errorMessage = 'Could not parse JSON. This is not valid JSON.';
							geoJSONData = null;
							availableProperties = [];
							selectedProperties.clear();
							processedGeoJSON = null;
							processedGeoJSONSize = null;
						}
					}
				};
				reader.readAsText(file);
			}
		}
	};

	const processGeoJSON = () => {
		if (!geoJSONData) return;

		isProcessing = true;
		try {
			const safePrecision = Number.isFinite(coordinatePrecision)
				? Math.min(15, Math.max(1, coordinatePrecision))
				: 6;

			const reduced = reduceFeatureCollection(geoJSONData, {
				precision: safePrecision,
				propertiesToKeep: selectedProperties
			});

			processedGeoJSON = JSON.stringify(reduced);
			processedGeoJSONSize = processedGeoJSON
				? new TextEncoder().encode(processedGeoJSON).length
				: null;
		} finally {
			isProcessing = false;
		}
	};

	let percentageReduction = $derived(
		calculatePercentageReduction(uploadedFileSize, processedGeoJSONSize)
	);

	const selectAllProperties = () => {
		selectedProperties.clear();
		for (const p of availableProperties) {
			selectedProperties.add(p);
		}
	};

	const deselectAllProperties = () => {
		selectedProperties.clear();
	};

	let selectedPropertyCount = $derived(selectedProperties.size);

	let displayedProperties = $derived(
		availableProperties.filter((p) => p.toLowerCase().includes(propertyFilter.toLowerCase()))
	);

	let propertiesKept = $derived(selectedPropertyCount);
	let propertiesRemoved = $derived(availableProperties.length - selectedPropertyCount);

	const downloadProcessedGeoJSON = () => {
		if (processedGeoJSON && originalFilename) {
			const blob = new Blob([processedGeoJSON], { type: 'application/geo+json' });
			const a = document.createElement('a');
			a.href = URL.createObjectURL(blob);

			const filteredFileName = originalFilename.replace(/(\.geojson)?$/i, '_filtered.geojson');

			a.download = filteredFileName;
			a.click();
			URL.revokeObjectURL(a.href);
		}
	};
</script>

<h1>GeoJSON Size Reducer</h1>
<p>A tool to reduce the file size of GeoJSON files for web optimisation.</p>
<p>All conversions are done locally in your browser without sending any data anywhere else.</p>

{#if errorMessage}
	<p style="color: red;">{errorMessage}</p>
{/if}

{#if showLargeFileWarning}
	<p style="color: orange; font-size: 0.9em;">
		⚠️ This file is large. Processing may temporarily freeze your browser.
	</p>
{/if}

<input type="file" name="geojson" onchange={handleFileChange} />
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
	<p>
		<input
			type="text"
			placeholder="Filter properties…"
			bind:value={propertyFilter}
			style="margin-bottom: 0.5rem; padding: 0.25rem;"
		/>
	</p>
	<p>
		<button type="button" onclick={selectAllProperties}>Select all</button>
		<button type="button" onclick={deselectAllProperties}>Deselect all</button>
	</p>
	<p>Selected {selectedPropertyCount} of {availableProperties.length} properties.</p>
	{#each displayedProperties as property (property)}
		<label>
			<input
				type="checkbox"
				checked={selectedProperties.has(property)}
				onchange={() => togglePropertySelection(property)}
			/>
			{property}
		</label>
	{/each}
	{#if displayedProperties.length === 0 && propertyFilter}
		<p style="font-style: italic;">No properties match "{propertyFilter}"</p>
	{/if}
{:else}
	<p>No properties available.</p>
{/if}

<button onclick={processGeoJSON} disabled={!geoJSONData || isProcessing}>
	{#if isProcessing}
		Processing...
	{:else}
		Reduce size
	{/if}
</button>
<button onclick={downloadProcessedGeoJSON} disabled={!processedGeoJSON}>
	Download Processed GeoJSON
</button>

{#if processedGeoJSON && processedGeoJSONSize != null}
	<h2>Results</h2>
	<p>
		Processed GeoJSON size: {formatFileSize(processedGeoJSONSize)}
	</p>
	<p>
		Percentage Reduction:
		{#if percentageReduction != null}
			{percentageReduction.toFixed(2)}%
		{:else}
			N/A
		{/if}
	</p>

	<h3>Summary</h3>
	<ul>
		<li>Original size: {uploadedFileSize ? formatFileSize(uploadedFileSize) : 'N/A'}</li>
		<li>Processed size: {formatFileSize(processedGeoJSONSize)}</li>
		<li>Reduction: {percentageReduction != null ? `${percentageReduction.toFixed(2)}%` : 'N/A'}</li>
		<li>Properties kept: {propertiesKept}</li>
		<li>Properties removed: {propertiesRemoved}</li>
		<li>Coordinate precision: {coordinatePrecision} decimal places</li>
	</ul>
{/if}
