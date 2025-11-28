<script>
	import '../style.css';
</script>

<div class="min-h-screen bg-slate-950 text-slate-100">
	<div class="mx-auto flex min-h-screen max-w-4xl flex-col px-4 py-10 gap-6">
		<main class="flex-1">
			<slot />
		</main>
		<footer class="border-t border-slate-800 pt-4 text-xs text-slate-500">
			Developed by
			<a
				href="https://radicaldata.org"
				target="_blank"
				rel="noopener"
				class="font-medium text-sky-400 hover:text-sky-300"
			>
				Radical Data
			</a>
			for our Comapping project and the rewrite of Queering the Map. For more tools and projects at the
			intersection of technology, art and activism, visit
			<a
				href="https://radicaldata.org"
				target="_blank"
				rel="noopener"
				class="font-medium text-sky-400 hover:text-sky-300"
			>
				radicaldata.org
			</a>.
		</footer>
	</div>
</div>
