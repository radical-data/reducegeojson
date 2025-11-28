<script>
	import '../style.css';
	import GitHubIcon from '$lib/GitHubIcon.svelte';
</script>

<div class="min-h-screen">
	<div class="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-6 py-8">
		<main class="flex-1">
			<slot />
		</main>
		<footer class="border-t border-slate-200 pt-4 text-xs text-slate-500">
			<div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
				<p>
					Developed by
					<a
						href="https://radicaldata.org"
						target="_blank"
						rel="noopener noreferrer"
						class="font-medium text-sky-700 hover:text-sky-800"
					>
						Radical Data
					</a>
					for our Comapping project and the rewrite of Queering the Map. For more tools and projects
					at the intersection of technology, art and activism, visit
					<a
						href="https://radicaldata.org"
						target="_blank"
						rel="noopener noreferrer"
						class="font-medium text-sky-700 hover:text-sky-800"
					>
						radicaldata.org
					</a>.
				</p>
				<a
					href="https://github.com/radical-data/reducegeojson"
					target="_blank"
					rel="noopener noreferrer"
					class="inline-flex items-center gap-1 font-medium text-slate-600 hover:text-sky-700"
				>
					<GitHubIcon className="h-3.5 w-3.5" />
					<span>View source on GitHub</span>
				</a>
			</div>
		</footer>
	</div>
</div>
