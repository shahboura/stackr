<script lang="ts">
	let { size = 20 }: { size?: number } = $props();
</script>

<svg
	class="kamon"
	width={size}
	height={size}
	viewBox="0 0 96 96"
	aria-hidden="true"
	focusable="false"
>
	<circle cx="48" cy="48" r="38" fill="none" stroke="currentColor" stroke-width="6" />
	<g fill="currentColor">
		<rect x="28" y="28" width="8" height="8" rx="2" />
		<rect x="44" y="28" width="8" height="8" rx="2" />
		<rect x="60" y="28" width="8" height="8" rx="2" />
		<rect x="28" y="44" width="8" height="8" rx="2" />
		<rect x="60" y="44" width="8" height="8" rx="2" />
		<rect x="28" y="60" width="8" height="8" rx="2" />
		<rect x="44" y="60" width="8" height="8" rx="2" />
		<rect x="60" y="60" width="8" height="8" rx="2" />
	</g>
	<rect
		class="accent"
		x="40"
		y="40"
		width="16"
		height="16"
		rx="4"
		transform="rotate(45 48 48)"
	/>
</svg>

<style>
	.kamon {
		display: block;
		flex: none;
	}

	.accent {
		fill: var(--accent);
	}
</style>
