<script lang="ts">
	import type { Answers } from './state';
	import { isValidId, parseIdOutput } from './state';
	import type { Service } from '../catalog/parse';
	import { HOSTS, UMASK_OPTIONS } from './presets';

	let {
		answers = $bindable(),
		selected = [],
		serviceCount
	}: {
		answers: Answers;
		selected?: Service[];
		serviceCount: number;
	} = $props();

	let umask = $derived(UMASK_OPTIONS.find((option) => option.value === answers.umask) ?? UMASK_OPTIONS[0]);
	let idOutput = $state('');
	let preset = $derived(HOSTS.find((host) => host.id === answers.host));
	let desktop = $derived(preset?.platform === 'desktop');
	let affected = $derived(
		selected
			.filter((service) => service.vars.includes('PUID') || service.vars.includes('PGID'))
			.map((service) => service.name)
	);
	let changed = $derived(
		Boolean(preset && (answers.puid !== preset.puid || answers.pgid !== preset.pgid))
	);

	/** Paste `id` output; fill the two IDs without making the user translate it. */
	function readId(): void {
		const ids = parseIdOutput(idOutput);
		if (ids.puid) answers.puid = ids.puid;
		if (ids.pgid) answers.pgid = ids.pgid;
	}

	function choose(host: (typeof HOSTS)[number]): void {
		if (answers.host === host.id) return;
		answers.host = host.id;
		answers.dataDir = host.dataDir;
		answers.puid = host.puid;
		answers.pgid = host.pgid;
		answers.umask = host.umask;
	}
</script>

<section class="step">
	<div class="picker">
		<div class="picker-head">
			<span class="mono label">Host</span>
			<span class="mono label">Preset</span>
		</div>
		<div class="host-tabs" role="group" aria-label="Host preset">
			{#each HOSTS as host (host.id)}
				<button
					type="button"
					class="host-tab"
					aria-pressed={answers.host === host.id}
					onclick={() => choose(host)}
				>
					{host.name}
				</button>
			{/each}
		</div>
		{#if preset}
			<div class="host-detail" role="region" aria-label={`${preset.name} preset`}>
				<p class="consequence">{preset.consequence}</p>
				<p class="cost">{preset.cost}</p>
				{#if preset.caution}
					<p class="caution">{preset.caution}</p>
				{/if}
			</div>
		{/if}
	</div>

	<div class="card">
		<div class="card-head">
			<h3>Ownership</h3>
			<span class="mono label">{serviceCount} {serviceCount === 1 ? 'service' : 'services'}</span>
		</div>
		{#if desktop}
			<p class="hint desktop-note">
				Docker Desktop maps ownership through its Linux VM. Keep 1000/1000 unless the image docs say
				otherwise; a host <code>id</code> does not map into the VM.
			</p>
		{/if}
		<div class="grid">
			{#if !desktop}
				<label class="field paste">
					<span>Paste your <code>id</code> output (optional)</span>
					<input
						class="mono"
						type="text"
						spellcheck="false"
						autocomplete="off"
						placeholder="uid=1000(bob) gid=1000(bob) groups=..."
						bind:value={idOutput}
						oninput={readId}
					/>
				</label>
			{/if}
			<label class="field">
				<span>User ID (PUID)</span>
				<input type="text" inputmode="numeric" pattern="[0-9]*" bind:value={answers.puid} />
			</label>
			<label class="field">
				<span>Group ID (PGID)</span>
				<input type="text" inputmode="numeric" pattern="[0-9]*" bind:value={answers.pgid} />
			</label>
			<label class="field">
				<span>Umask</span>
				<select bind:value={answers.umask}>
					{#each UMASK_OPTIONS as option (option.value)}
						<option value={option.value}>{option.name}</option>
					{/each}
				</select>
			</label>
		</div>
		{#if !isValidId(answers.puid) || !isValidId(answers.pgid)}
			<p class="error">PUID and PGID must be whole numbers.</p>
		{:else}
			{#if !desktop}
				<p class="hint">
					These IDs are applied to every container that supports them. The host folders must be owned
					by the same IDs, or startup will fail with permission errors.
				</p>
			{/if}
			<p class="hint">
				{#if affected.length > 0}
					PUID/PGID apply to {affected.length} service{affected.length === 1 ? '' : 's'}:
					{affected.join(', ')}.
				{:else}
					No selected service uses PUID/PGID.
				{/if}
				{#if changed}<span class="changed">Changed from the preset</span>{/if}
			</p>
			<p class="hint">{umask.consequence} {umask.cost}</p>
		{/if}
	</div>
</section>

<style>
	.step {
		display: flex;
		flex-direction: column;
		gap: 18px;
	}

	.picker {
		background: var(--surface);
		border-radius: var(--radius);
		box-shadow: var(--shadow);
		padding: 14px 16px;
	}

	.picker-head {
		display: flex;
		justify-content: space-between;
		gap: 12px;
		padding: 0 2px 10px;
	}

	.host-tabs {
		display: grid;
		grid-template-columns: repeat(5, minmax(0, 1fr));
		gap: 2px;
		padding: 2px;
		border-radius: 9px;
		background: var(--surface-2);
	}

	.host-tab {
		min-height: 44px;
		padding: 0 6px;
		border: 0;
		border-radius: 7px;
		background: transparent;
		color: var(--ink-2);
		font-size: 12.5px;
		font-weight: 500;
		white-space: nowrap;
	}

	.host-tab:hover {
		color: var(--ink);
	}

	.host-tab[aria-pressed='true'] {
		background: var(--seg-active);
		color: var(--ink);
		box-shadow: var(--shadow);
	}

	.host-detail {
		display: flex;
		flex-direction: column;
		gap: 4px;
		margin-top: 12px;
		padding-top: 12px;
		border-top: 1px solid var(--line-soft);
	}

	.consequence {
		font-size: 13px;
		line-height: 1.45;
		color: var(--ink-2);
	}

	.cost {
		font-size: 12.5px;
		line-height: 1.45;
		color: var(--ink-3);
	}

	.caution {
		margin-top: 4px;
		padding-left: 10px;
		border-left: 2px solid var(--warn);
		font-size: 12.5px;
		line-height: 1.5;
		color: var(--warn);
	}

	.card {
		background: var(--surface);
		border-radius: var(--radius);
		box-shadow: var(--shadow);
		padding: 18px 20px;
	}

	.card-head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 12px;
		margin-bottom: 14px;
	}

	h3 {
		font-size: 15px;
		font-weight: 600;
	}

	.label {
		font-size: 10px;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--ink-3);
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 12px;
	}

	.paste {
		grid-column: 1 / -1;
	}

	.paste input {
		font-size: 12.5px;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 6px;
		font-size: 12.5px;
		color: var(--ink-2);
	}

	input,
	select {
		width: 100%;
		min-height: 44px;
		border: 1px solid var(--field-line);
		border-radius: 10px;
		background: var(--surface-2);
		color: var(--ink);
		padding: 8px 10px;
		font: inherit;
	}

	.hint,
	.error {
		margin-top: 12px;
		font-size: 12.5px;
		line-height: 1.5;
	}

	.hint {
		color: var(--ink-3);
	}

	.desktop-note {
		margin-top: 0;
		margin-bottom: 12px;
	}

	.error {
		color: var(--warn);
	}

	.changed {
		display: inline-block;
		margin-left: 6px;
		padding: 1px 6px;
		border-radius: 4px;
		background: color-mix(in srgb, var(--accent) 10%, var(--surface));
		color: var(--accent);
		font-size: 11px;
	}

	code {
		font-family: var(--mono);
		font-size: 0.95em;
	}

	@media (max-width: 640px) {
		.grid {
			grid-template-columns: 1fr;
		}
	}

	@media (max-width: 400px) {
		.host-tab {
			padding: 0 2px;
			font-size: 11.5px;
		}
	}

	@media (max-width: 360px) {
		.host-tabs {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}
	}
</style>
