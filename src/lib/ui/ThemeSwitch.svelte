<script lang="ts">
	import { onMount } from 'svelte';
	import { nextTheme, type Theme } from './theme';

	const LABELS: Record<Theme, string> = {
		system: 'system',
		dark: 'dark',
		light: 'light'
	};

	let theme = $state<Theme>('system');
	let next = $derived(nextTheme(theme));

	function apply(value: Theme): void {
		theme = value;
		try {
			if (value === 'system') {
				document.documentElement.removeAttribute('data-theme');
				localStorage.removeItem('stackr-theme');
			} else {
				document.documentElement.dataset.theme = value;
				localStorage.setItem('stackr-theme', value);
			}
		} catch {
			// Storage can be unavailable in private modes; the in-memory theme still applies.
		}
	}

	onMount(() => {
		const current = document.documentElement.dataset.theme;
		if (current === 'light' || current === 'dark') theme = current;
		const sync = (event: StorageEvent): void => {
			if (event.key !== 'stackr-theme') return;
			const value: Theme =
				event.newValue === 'light' || event.newValue === 'dark' ? event.newValue : 'system';
			theme = value;
			if (value === 'system') document.documentElement.removeAttribute('data-theme');
			else document.documentElement.dataset.theme = value;
		};
		window.addEventListener('storage', sync);
		return () => window.removeEventListener('storage', sync);
	});
</script>

<button
	type="button"
	class="theme"
	aria-label={`Theme: ${LABELS[theme]}. Switch to ${LABELS[next]}.`}
	title={`Theme: ${LABELS[theme]}. Switch to ${LABELS[next]}.`}
	onclick={() => apply(next)}
>
	{#if theme === 'light'}
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
			<circle cx="12" cy="12" r="4" />
			<path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.42 1.42M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
		</svg>
	{:else if theme === 'dark'}
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
			<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
		</svg>
	{:else}
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
			<rect width="20" height="14" x="2" y="3" rx="2" />
			<path d="M8 21h8M12 17v4" />
		</svg>
	{/if}
</button>

<style>
	.theme {
		display: inline-grid;
		place-items: center;
		width: 44px;
		height: 44px;
		border: 0;
		border-radius: 9px;
		background: transparent;
		color: var(--ink-2);
		transition:
			background 0.15s ease,
			color 0.15s ease;
	}

	.theme:hover {
		background: var(--surface-2);
		color: var(--ink);
	}

	.theme:focus-visible {
		outline-offset: 3px;
	}

	svg {
		width: 17px;
		height: 17px;
	}
</style>
