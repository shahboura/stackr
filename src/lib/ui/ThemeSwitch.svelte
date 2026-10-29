<script lang="ts">
	import { onMount } from 'svelte';

	type Theme = 'system' | 'light' | 'dark';

	const applied =
		typeof document === 'undefined' ? undefined : document.documentElement.dataset.theme;
	let theme = $state<Theme>(applied === 'light' || applied === 'dark' ? applied : 'system');

	function apply(next: Theme): void {
		theme = next;
		try {
			if (next === 'system') {
				document.documentElement.removeAttribute('data-theme');
				localStorage.removeItem('stackr-theme');
			} else {
				document.documentElement.dataset.theme = next;
				localStorage.setItem('stackr-theme', next);
			}
		} catch {
			// Storage can be unavailable in private modes; the in-memory theme still applies.
		}
	}

	onMount(() => {
		const sync = (event: StorageEvent): void => {
			if (event.key !== 'stackr-theme') return;
			const next: Theme =
				event.newValue === 'light' || event.newValue === 'dark' ? event.newValue : 'system';
			theme = next;
			if (next === 'system') document.documentElement.removeAttribute('data-theme');
			else document.documentElement.dataset.theme = next;
		};
		window.addEventListener('storage', sync);
		return () => window.removeEventListener('storage', sync);
	});
</script>

<div class="theme" role="group" aria-label="Theme">
	<button
		type="button"
		data-mode="light"
		aria-pressed={theme === 'light'}
		aria-label="Light theme"
		title="Light theme"
		onclick={() => apply('light')}
	>
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
			<circle cx="12" cy="12" r="4" />
			<path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.42 1.42M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
		</svg>
	</button>
	<button
		type="button"
		data-mode="system"
		aria-pressed={theme === 'system'}
		aria-label="System theme"
		title="System theme"
		onclick={() => apply('system')}
	>
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
			<rect width="20" height="14" x="2" y="3" rx="2" />
			<path d="M8 21h8M12 17v4" />
		</svg>
	</button>
	<button
		type="button"
		data-mode="dark"
		aria-pressed={theme === 'dark'}
		aria-label="Dark theme"
		title="Dark theme"
		onclick={() => apply('dark')}
	>
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
			<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
		</svg>
	</button>
</div>

<style>
	.theme {
		display: inline-flex;
		align-items: center;
		gap: 2px;
		padding: 2px;
		border-radius: 9px;
		background: var(--surface-2);
	}

	button {
		display: inline-grid;
		place-items: center;
		width: 44px;
		height: 44px;
		border: 0;
		border-radius: 7px;
		background: transparent;
		color: var(--ink-2);
		transition:
			background 0.15s ease,
			color 0.15s ease;
	}

	button:hover {
		color: var(--ink);
	}

	button:focus-visible {
		outline-offset: -3px;
	}

	/* The root attribute is painted before hydration; keep the pill in sync with it. */
	:global(html[data-theme='light']) .theme [data-mode='light'],
	:global(html[data-theme='dark']) .theme [data-mode='dark'],
	:global(html:not([data-theme])) .theme [data-mode='system'] {
		background: var(--seg-active);
		color: var(--ink);
		box-shadow: var(--shadow);
	}

	@media (forced-colors: active) {
		button[aria-pressed='true'] {
			outline: 2px solid Highlight;
			outline-offset: -3px;
		}
	}

	svg {
		width: 16px;
		height: 16px;
	}
</style>
