<script>
	import '../style.css';
</script>

<div class="min-h-screen">
	<div class="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-6 py-8">
		<main class="flex-1">
			<slot />
		</main>
		<footer class="border-t border-slate-200 pt-4 text-xs text-slate-500">
			Developed by
			<a
				href="https://radicaldata.org"
				target="_blank"
				rel="noopener"
				class="font-medium text-sky-700 hover:text-sky-800"
			>
				Radical Data
			</a>
			for our Comapping project and the rewrite of Queering the Map. For more tools and projects at the
			intersection of technology, art and activism, visit
			<a
				href="https://radicaldata.org"
				target="_blank"
				rel="noopener"
				class="font-medium text-sky-700 hover:text-sky-800"
			>
				radicaldata.org
			</a>.
		</footer>
	</div>
</div>
