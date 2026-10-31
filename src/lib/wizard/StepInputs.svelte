<script lang="ts">
	import type { Service } from '../catalog/parse';
	import type { Answers } from './state';
	import { isValidTimezone } from './state';
	import { SECRET_NOTES } from '../secrets/generate';
	import SecretValue from '../ui/SecretValue.svelte';

	let {
		selected,
		answers = $bindable(),
		secrets
	}: {
		selected: Service[];
		answers: Answers;
		secrets: Record<string, string>;
	} = $props();

	const ZONES = [
		'Etc/UTC',
		'Europe/London',
		'Europe/Berlin',
		'Europe/Madrid',
		'America/New_York',
		'America/Chicago',
		'America/Denver',
		'America/Los_Angeles',
		'Asia/Kuala_Lumpur',
		'Asia/Singapore',
		'Asia/Tokyo',
		'Australia/Sydney'
	];

	let entries = $derived(
		selected.flatMap((service) =>
			Object.entries(service.generators).map(([name, kind]) => ({ name, kind, service }))
		)
	);

	let hasDozzle = $derived(selected.some((service) => service.slug === 'dozzle'));
</script>

<section class="step">
	<div class="card">
		<div class="card-head">
			<span class="mono label">Clock</span>
			<span class="mono label">applies to every container</span>
		</div>
		<label class="field">
			<span>Time zone</span>
			<input class="mono" type="text" list="zones" spellcheck="false" bind:value={answers.tz} />
			<datalist id="zones">
				{#each ZONES as zone (zone)}
					<option value={zone}></option>
				{/each}
			</datalist>
		</label>
		{#if !isValidTimezone(answers.tz)}
			<p class="error">Use an IANA time zone name, like Europe/Berlin or Etc/UTC.</p>
		{:else}
			<p class="hint">
				Pre-filled from this browser. If the host is somewhere else, use its zone so scheduled tasks
				run at the right time.
			</p>
		{/if}
	</div>

	{#if entries.length > 0}
		<div class="card">
			<div class="card-head">
				<span class="mono label">Generated secrets</span>
				<span class="mono label">{entries.length} value{entries.length === 1 ? '' : 's'}</span>
			</div>
			{#each entries as entry (entry.name)}
				<div class="secret">
					<SecretValue
						name={entry.name}
						value={secrets[entry.name] ?? ''}
						note={SECRET_NOTES[entry.kind]}
					/>
					<p class="applies">Used by {entry.service.name}. It goes into the .env with this note above it.</p>
				</div>
			{/each}
			<p class="hint">
				These values exist only on this page and in the files you download. Reloading the wizard
				generates new ones.
			</p>
		</div>
	{:else}
		<div class="box ok">
			<strong>No secrets needed.</strong>
			None of the selected services reads a generated secret from the environment.
		</div>
	{/if}

	{#if hasDozzle}
		<div class="box danger">
			<strong>Dozzle gets control of Docker.</strong>
			Mounting <code>/var/run/docker.sock</code> gives this container the same control over Docker as
			root on the host. The <code>:ro</code> flag only makes the socket file read-only on disk — API
			calls still go through, so it can stop, delete or recreate every container. Anyone who can reach
			the Dozzle port can do the same. Keep it on your LAN; do not forward that port.
		</div>
	{/if}
</section>

<style>
	.step {
		display: flex;
		flex-direction: column;
		gap: 18px;
	}

	.card {
		background: var(--surface);
		border-radius: var(--radius);
		box-shadow: var(--shadow);
		padding: 16px 20px 18px;
	}

	.card-head {
		display: flex;
		justify-content: space-between;
		gap: 12px;
		padding-bottom: 10px;
		border-bottom: 1px solid var(--line-soft);
		margin-bottom: 14px;
	}

	.label {
		font-size: 10px;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--ink-3);
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 6px;
		font-size: 12.5px;
		color: var(--ink-2);
	}

	input {
		min-height: 44px;
		border: 1px solid var(--field-line);
		border-radius: 10px;
		background: var(--surface-2);
		color: var(--ink);
		padding: 8px 12px;
		font-size: 13.5px;
	}

	.secret {
		padding: 14px 0;
		border-bottom: 1px solid var(--line-soft);
	}

	.secret:last-of-type {
		border-bottom: 0;
	}

	.applies {
		margin-top: 2px;
		font-size: 12px;
		color: var(--ink-2);
	}

	.hint,
	.error {
		margin-top: 10px;
		font-size: 12.5px;
		line-height: 1.5;
	}

	.hint {
		color: var(--ink-3);
	}

	.error {
		color: var(--warn);
	}

	.box {
		border-radius: var(--radius-sm);
		padding: 13px 16px;
		font-size: 13px;
		line-height: 1.6;
	}

	.ok {
		background: color-mix(in srgb, var(--ok) 8%, var(--surface));
		color: var(--ok);
	}

	.danger {
		background: color-mix(in srgb, var(--warn) 10%, var(--surface));
		color: var(--warn);
	}

	code {
		font-family: var(--mono);
		font-size: 0.94em;
	}
</style>
