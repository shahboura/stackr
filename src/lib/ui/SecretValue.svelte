<script lang="ts">
	import CopyButton from './CopyButton.svelte';

	let {
		name,
		value,
		note,
		dark = false
	}: {
		name: string;
		value: string;
		note?: string;
		dark?: boolean;
	} = $props();

	let revealed = $state(false);
	let timer: ReturnType<typeof setTimeout> | undefined;

	function toggle(): void {
		revealed = !revealed;
		clearTimeout(timer);
		if (revealed) timer = setTimeout(() => (revealed = false), 30_000);
	}

	$effect(() => () => clearTimeout(timer));
</script>

<div class="secret" class:dark>
	<div class="head">
		<span class="name mono">{name}</span>
		<div class="actions">
			<button
				type="button"
				class="reveal"
				aria-pressed={revealed}
				aria-label={revealed ? 'Hide secret' : 'Reveal secret'}
				title={revealed ? 'Hide secret' : 'Reveal secret'}
				onclick={toggle}
			>
				<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
					{#if revealed}
						<path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
						<path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
						<path d="M6.61 6.61A13.5 13.5 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
						<path d="m2 2 20 20" />
					{:else}
						<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
						<circle cx="12" cy="12" r="3" />
					{/if}
				</svg>
				<span class="sr-only">{revealed ? 'Hide secret' : 'Reveal secret'}</span>
			</button>
			<CopyButton text={value} {dark} compact label={`Copy ${name}`} />
		</div>
	</div>
	<code class="value mono" aria-live="polite">{revealed ? value : '••••••••••••'}</code>
	{#if note}<p class="note">{note}</p>{/if}
</div>

<style>
	.secret {
		display: flex;
		flex-direction: column;
		gap: 5px;
		min-width: 0;
	}

	.head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
		flex-wrap: wrap;
	}

	.name {
		font-size: 10.5px;
		letter-spacing: 0.04em;
		font-weight: 600;
	}

	.actions {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-left: auto;
	}

	.reveal {
		display: inline-grid;
		place-items: center;
		width: 44px;
		background: var(--surface-2);
		color: var(--ink);
		border: 0;
		border-radius: 8px;
		padding: 0;
		min-height: 44px;
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

	.reveal:hover {
		background: color-mix(in srgb, var(--surface-2) 70%, var(--ink-3));
	}

	.value {
		display: block;
		font-size: 11.5px;
		line-height: 1.5;
		letter-spacing: 0.08em;
		word-break: break-all;
		background: var(--surface-2);
		border-radius: 8px;
		padding: 8px 10px;
	}

	.note {
		font-family: var(--mono);
		font-size: 11px;
		line-height: 1.5;
		color: var(--ink-3);
	}

	:global(.tech) .secret.dark .name {
		color: var(--tech-accent);
	}

	:global(.tech) .secret.dark .reveal {
		background: color-mix(in srgb, var(--tech-ink) 10%, transparent);
		color: var(--tech-ink);
	}

	:global(.tech) .secret.dark .reveal:hover {
		background: color-mix(in srgb, var(--tech-ink) 18%, transparent);
	}

	:global(.tech) .secret.dark .value {
		background: color-mix(in srgb, var(--tech-ink) 6%, transparent);
		color: var(--tech-ink);
	}

	:global(.tech) .secret.dark .note {
		color: var(--tech-mute);
	}
</style>
