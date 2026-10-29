<script lang="ts">
	let { size = 16 }: { size?: number } = $props();
</script>

<span class="wordmark" style="font-size: {size}px">stack<span class="accent">r</span></span>

<style>
	.wordmark {
		font-family: var(--font);
		font-weight: 600;
		line-height: 1;
		letter-spacing: -0.03em;
		color: var(--ink);
		white-space: nowrap;
	}

	.accent {
		color: var(--accent);
	}
</style>
