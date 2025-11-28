<script lang="ts">
	import type { FeatureCollection } from 'geojson';
	import { formatFileSize, calculatePercentageReduction } from '$lib/geojson-utils';
	import { reduceFeatureCollection } from '$lib/reducer';
	import { SvelteSet } from 'svelte/reactivity';
	import GitHubIcon from '$lib/GitHubIcon.svelte';

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
	let isDragActive = $state(false);

	// Derived step state
	let hasFile = $derived(geoJSONData !== null);
	let hasResult = $derived(processedGeoJSON !== null && processedGeoJSONSize !== null);

	type StepStatus = 'current' | 'done' | 'upcoming';

	let step1Status: StepStatus = $derived(hasFile ? 'done' : 'current');
	let step2Status: StepStatus = $derived(!hasFile ? 'upcoming' : !hasResult ? 'current' : 'done');
	let step3Status: StepStatus = $derived(
		!hasFile ? 'upcoming' : !hasResult ? 'upcoming' : 'current'
	);

	function stepCircleClass(status: StepStatus): string {
		if (status === 'current') {
			return 'bg-sky-600 text-white';
		}
		if (status === 'done') {
			return 'bg-emerald-500/90 text-white';
		}
		return 'bg-slate-200 text-slate-500';
	}

	function stepTitleClass(status: StepStatus): string {
		if (status === 'upcoming') return 'text-slate-500';
		if (status === 'done') return 'text-slate-700';
		return 'text-slate-900';
	}

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
		resetProcessedOutput();
	};

	const resetProcessedOutput = () => {
		processedGeoJSON = null;
		processedGeoJSONSize = null;
	};

	const loadGeoJSONFile = (file: File) => {
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
						resetProcessedOutput();
						return;
					}

					errorMessage = null;
					geoJSONData = parsed as FeatureCollection;
					availableProperties = extractProperties(geoJSONData);
					selectedProperties.clear();
					for (const p of availableProperties) {
						selectedProperties.add(p);
					}
					resetProcessedOutput();
				} catch {
					errorMessage = 'Could not parse JSON. This is not valid JSON.';
					geoJSONData = null;
					availableProperties = [];
					selectedProperties.clear();
					resetProcessedOutput();
				}
			}
		};
		reader.readAsText(file);
	};

	const handleFileChange = (event: Event) => {
		const input = event.target as HTMLInputElement | null;
		const file = input?.files?.[0];
		if (file) {
			loadGeoJSONFile(file);
		}
	};

	const preventDragDefaults = (event: DragEvent) => {
		event.preventDefault();
		event.stopPropagation();
	};

	const handleDragEnter = (event: DragEvent) => {
		preventDragDefaults(event);
		isDragActive = true;
	};

	const handleDragOver = (event: DragEvent) => {
		preventDragDefaults(event);
		isDragActive = true;
	};

	const handleDragLeave = (event: DragEvent) => {
		preventDragDefaults(event);
		isDragActive = false;
	};

	const handleDrop = (event: DragEvent) => {
		preventDragDefaults(event);
		isDragActive = false;
		const file = event.dataTransfer?.files?.[0];
		if (file) {
			loadGeoJSONFile(file);
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
		resetProcessedOutput();
	};

	const deselectAllProperties = () => {
		selectedProperties.clear();
		resetProcessedOutput();
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

<h1 class="text-3xl font-semibold tracking-tight text-slate-900">GeoJSON Size Reducer</h1>

<p class="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-semibold tracking-wide">
	<span class="uppercase text-slate-500">Open source</span>
	<span class="text-slate-400">·</span>
	<a
		href="https://github.com/radical-data/reducegeojson"
		target="_blank"
		rel="noopener noreferrer"
		class="inline-flex items-center gap-1 text-sky-700 hover:text-sky-800 hover:underline underline-offset-2"
	>
		<GitHubIcon className="h-3.5 w-3.5" />
		<span>View source on GitHub</span>
	</a>
</p>

<p class="mt-3 text-slate-700">
	A tool to reduce the file size of GeoJSON files for web optimisation.
</p>

<p class="text-sm text-slate-600">
	All conversions are done locally in your browser; your GeoJSON never leaves your machine.
</p>

{#if errorMessage}
	<div class="mt-4 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
		{errorMessage}
	</div>
{/if}

<section class="mt-6 grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
	<div class="space-y-4">
		<div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
			<div class="mb-3 flex items-center gap-2">
				<div
					class={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${stepCircleClass(
						step1Status
					)}`}
				>
					1
				</div>
				<h2 class={`text-sm font-semibold ${stepTitleClass(step1Status)}`}>Upload GeoJSON</h2>
			</div>

			<div
				tabindex="0"
				role="button"
				class={`relative flex cursor-pointer flex-col items-center justify-center rounded-md border px-4 py-6 text-center text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50
					${
						isDragActive
							? 'border-sky-500 bg-sky-50'
							: 'border-dashed border-slate-300 bg-slate-50 hover:border-slate-400 hover:bg-slate-100'
					}`}
				onclick={() => document.getElementById('geojson')?.click()}
				onkeydown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') {
						e.preventDefault();
						document.getElementById('geojson')?.click();
					}
				}}
				ondragenter={handleDragEnter}
				ondragover={handleDragOver}
				ondragleave={handleDragLeave}
				ondrop={handleDrop}
			>
				<p class="font-medium text-slate-900">
					{originalFilename
						? 'Drop a new GeoJSON file to replace this one'
						: 'Drop a GeoJSON file here'}
				</p>
				<p class="mt-1 text-xs text-slate-500">or click to browse from your computer</p>
				<p class="mt-1 text-xs text-slate-500">Supports .geojson and GeoJSON-style .json files.</p>
				{#if originalFilename}
					<p class="mt-2 w-full truncate text-xs text-slate-500">
						<span class="font-medium text-slate-900">Loaded:</span>
						<span class="font-mono">{originalFilename}</span>
						<span class="text-slate-400">
							— {uploadedFileSize ? formatFileSize(uploadedFileSize) : 'size unknown'}
						</span>
					</p>
				{/if}
				<input
					id="geojson"
					type="file"
					name="geojson"
					accept=".geojson,application/geo+json,application/json"
					onchange={handleFileChange}
					class="absolute inset-0 h-full w-full cursor-pointer opacity-0"
					aria-label="Upload GeoJSON file"
				/>
			</div>
		</div>

		<div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
			<div class="mb-3 flex items-center gap-2">
				<div
					class={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${stepCircleClass(
						step2Status
					)}`}
				>
					2
				</div>
				<h2 class={`text-sm font-semibold ${stepTitleClass(step2Status)}`}>Choose what to keep</h2>
			</div>

			<div class="space-y-2">
				<label class="block text-sm font-medium text-slate-900" for="decimalPlaces">
					Decimal places in coordinates
				</label>
				<input
					type="number"
					id="decimalPlaces"
					min="1"
					max="15"
					step="1"
					bind:value={coordinatePrecision}
					onchange={resetProcessedOutput}
					class="w-32 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60"
				/>
				<p class="text-xs text-slate-600">
					A good default for web apps is 5–6 decimal places (~1–0.1 m accuracy).
				</p>
			</div>

			<div class="mt-3 space-y-2">
				<div class="flex items-center justify-between gap-2">
					<p class="text-sm font-medium text-slate-900">Include properties</p>
					{#if availableProperties.length > 0}
						<div class="flex gap-2">
							<button
								type="button"
								onclick={selectAllProperties}
								class="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-900 hover:border-slate-400 hover:bg-slate-50"
							>
								Select all
							</button>
							<button
								type="button"
								onclick={deselectAllProperties}
								class="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-900 hover:border-slate-400 hover:bg-slate-50"
							>
								Deselect all
							</button>
						</div>
					{/if}
				</div>

				{#if !geoJSONData}
					<p class="text-xs text-slate-500">
						Upload a GeoJSON FeatureCollection to choose which properties to keep.
					</p>
				{:else if availableProperties.length === 0}
					<p class="text-xs text-slate-500">
						This file only contains geometry; there are no properties to filter.
					</p>
				{:else}
					<div class="space-y-2">
						<input
							type="text"
							placeholder="Filter properties…"
							bind:value={propertyFilter}
							class="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60"
						/>
						<p class="text-xs text-slate-600">
							Selected
							<span class="font-medium text-slate-900">{selectedPropertyCount}</span>
							of {availableProperties.length} properties.
						</p>

						<div
							class="max-h-56 space-y-1 overflow-auto rounded-md border border-slate-200 bg-slate-50 p-2 text-sm"
						>
							{#each displayedProperties as property (property)}
								<label
									class="flex cursor-pointer items-center gap-2 rounded px-2 py-1 hover:bg-slate-100/60"
								>
									<input
										type="checkbox"
										checked={selectedProperties.has(property)}
										onchange={() => togglePropertySelection(property)}
										class="h-3.5 w-3.5 rounded border-slate-300 bg-white text-sky-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sky-500/80"
									/>
									<span class="truncate text-slate-900">{property}</span>
								</label>
							{/each}

							{#if displayedProperties.length === 0 && propertyFilter}
								<p class="px-2 py-1 text-xs italic text-slate-500">
									No properties match "{propertyFilter}"
								</p>
							{/if}
						</div>
					</div>
				{/if}
			</div>
		</div>
	</div>

	<div class="space-y-4">
		<div class="rounded-xl border border-slate-300 bg-white p-6 shadow-sm shadow-slate-200">
			<header class="mb-3 flex items-center gap-2">
				<div
					class={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${stepCircleClass(
						step3Status
					)}`}
				>
					3
				</div>
				<h2 class={`text-sm font-semibold ${stepTitleClass(step3Status)}`}>Reduce & download</h2>
			</header>

			{#if showLargeFileWarning}
				<div
					class="mt-3 flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800"
				>
					<span class="mt-0.5">⚠️</span>
					<p>This file is large. Processing may temporarily freeze your browser.</p>
				</div>
			{/if}

			<div class="mt-3 flex flex-wrap gap-2">
				<button
					onclick={processGeoJSON}
					disabled={!geoJSONData || isProcessing}
					class="inline-flex items-center gap-2 rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
				>
					{#if isProcessing}
						<span
							class="inline-flex h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent"
						></span>
						Processing…
					{:else}
						Reduce size
					{/if}
				</button>

				<button
					onclick={downloadProcessedGeoJSON}
					disabled={!processedGeoJSON}
					class="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-400"
				>
					Download reduced GeoJSON
				</button>
			</div>

			{#if processedGeoJSON && processedGeoJSONSize != null}
				<h3 class="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">Results</h3>
				<div class="mt-1 space-y-1 text-sm text-slate-800">
					<p>
						Processed GeoJSON size:
						<span class="font-medium">
							{formatFileSize(processedGeoJSONSize)}
						</span>
					</p>
					<p>
						Percentage reduction:
						{#if percentageReduction != null}
							<span class="font-medium text-emerald-600">
								{percentageReduction.toFixed(2)}%
							</span>
						{:else}
							<span class="text-slate-500">N/A</span>
						{/if}
					</p>
				</div>

				<div class="mt-4 border-t border-slate-200 pt-3">
					<h4 class="text-sm font-semibold text-slate-900">Summary</h4>
					<ul class="mt-2 space-y-1 text-sm text-slate-800">
						<li>
							<span class="text-slate-600">Original size:</span>
							{uploadedFileSize ? formatFileSize(uploadedFileSize) : 'N/A'}
						</li>
						<li>
							<span class="text-slate-600">Processed size:</span>
							{formatFileSize(processedGeoJSONSize)}
						</li>
						<li>
							<span class="text-slate-600">Reduction:</span>
							{percentageReduction != null ? `${percentageReduction.toFixed(2)}%` : 'N/A'}
						</li>
						<li>
							<span class="text-slate-600">Properties kept:</span>
							{propertiesKept}
						</li>
						<li>
							<span class="text-slate-600">Properties removed:</span>
							{propertiesRemoved}
						</li>
						<li>
							<span class="text-slate-600">Coordinate precision:</span>
							{coordinatePrecision} decimal places
						</li>
					</ul>

					<p class="mt-3 text-xs text-slate-500">
						If you're interested in tech, art and activism,
						<a
							href="https://radicaldata.org"
							target="_blank"
							rel="noopener noreferrer"
							class="font-medium text-sky-700 hover:text-sky-800"
						>
							explore more of our work →
						</a>
					</p>
				</div>
			{/if}
		</div>

		<div class="rounded-xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
			<h2 class="text-base font-semibold text-slate-800">How does this reduction work?</h2>

			<p class="mt-2 text-sm text-slate-600">
				Many GeoJSON files include far more decimal places in their coordinates than any real
				application needs, often implying centimetre or even atomic level accuracy. All those extra
				digits make the files unnecessarily large.
			</p>

			<p class="mt-2 text-sm text-slate-600">
				This tool lets you trim coordinate precision down to something sensible and drop properties
				you don't need, making your data dramatically smaller for use on the web while keeping the
				overall shape intact.
			</p>

			<p class="mt-3 text-xs text-slate-500">
				All processing happens in your browser; your GeoJSON never leaves your machine.
			</p>
		</div>
	</div>
</section>
