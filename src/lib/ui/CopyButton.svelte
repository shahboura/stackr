<script lang="ts">
	let {
		text,
		label = 'Copy',
		dark = false,
		compact = false
	}: {
		text: string;
		label?: string;
		dark?: boolean;
		/** Icon-only square button for tight card headers. */
		compact?: boolean;
	} = $props();

	let state = $state<'idle' | 'copied' | 'failed'>('idle');
	let timer: ReturnType<typeof setTimeout> | undefined;
	let feedback = $derived(state === 'copied' ? 'Copied' : state === 'failed' ? 'Copy failed' : label);

	async function copy(): Promise<void> {
		try {
			await navigator.clipboard.writeText(text);
			state = 'copied';
		} catch {
			state = 'failed';
		}
		clearTimeout(timer);
		timer = setTimeout(() => (state = 'idle'), 1500);
	}
</script>

<button
	type="button"
	class="copy"
	class:done={state === 'copied'}
	class:failed={state === 'failed'}
	class:dark
	class:compact
	aria-label={label}
	title={feedback}
	onclick={copy}
>
	{#if compact}
		<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
			{#if state === 'copied'}
				<path d="M20 6 9 17l-5-5" />
			{:else if state === 'failed'}
				<path d="M18 6 6 18M6 6l12 12" />
			{:else}
				<rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
				<path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
			{/if}
		</svg>
	{:else}
		{feedback}
	{/if}
	<span class="sr-only" aria-live="polite">{state === 'copied' ? 'Copied' : state === 'failed' ? 'Copy failed' : ''}</span>
</button>

<style>
	.copy {
		background: var(--surface-2);
		color: var(--ink);
		border: 0;
		border-radius: 8px;
		padding: 6px 12px;
		font-size: 12.5px;
		font-weight: 500;
		min-height: 44px;
	}

	.copy:hover {
		background: color-mix(in srgb, var(--surface-2) 70%, var(--ink-3));
	}

	.compact {
		display: inline-grid;
		place-items: center;
		width: 44px;
		padding: 0;
	}

	.icon {
		width: 16px;
		height: 16px;
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip: rect(0 0 0 0);
		white-space: nowrap;
	}

	.done {
		color: var(--ok);
	}

	.failed {
		color: var(--warn);
	}

	/* `dark` is only passed inside the result's technical card. */
	:global(.tech) .copy.dark {
		background: color-mix(in srgb, var(--tech-ink) 10%, transparent);
		color: var(--tech-ink);
	}

	:global(.tech) .copy.dark:hover {
		background: color-mix(in srgb, var(--tech-ink) 18%, transparent);
	}

	:global(.tech) .copy.dark.done {
		color: var(--tech-accent);
	}

	:global(.tech) .copy.dark.failed {
		color: var(--warn);
	}

	@media (max-width: 639.98px) {
		.copy {
			padding: 8px 14px;
		}

		.compact {
			padding: 0;
		}
	}
</style>
