<script lang="ts">
	import Kamon from './Kamon.svelte';

	let { size = 16 }: { size?: number } = $props();
</script>

<span class="wordmark" style="font-size: {size}px">
	<Kamon size={size} />
	<span class="word"><svg
			class="s"
			viewBox="12 8 74 88"
			aria-hidden="true"
			focusable="false"
		><path
			d="M78 16H46C32 16 26 24 26 36C26 48 32 52 46 52H52C66 52 72 56 72 68C72 80 66 88 52 88H20"
			fill="none"
		/></svg>tack<span class="accent">r</span></span>
</span>

<style>
	.wordmark {
		font-family: var(--font);
		font-weight: 600;
		line-height: 1;
		letter-spacing: -0.03em;
		color: var(--ink);
		white-space: nowrap;
		display: inline-flex;
		align-items: center;
		gap: 0.5em;
	}

	.word {
		display: inline-flex;
		align-items: baseline;
	}

	.s {
		height: 0.545em;
		width: auto;
		margin-right: 0.02em;
	}

	.s path {
		fill: none;
		stroke: currentColor;
		stroke-width: 16;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	.accent {
		color: var(--accent);
	}
</style>
