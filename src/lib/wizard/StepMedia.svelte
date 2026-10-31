<script lang="ts">
	import type { Service } from '../catalog/parse';
	import type { Answers } from './state';
	import { dataDirs, isValidDataDir, shellQuote } from './state';
	import { LAYOUTS } from './presets';
	import OptionRow from '../ui/OptionRow.svelte';
	import CopyButton from '../ui/CopyButton.svelte';

	let {
		answers = $bindable(),
		selected = []
	}: {
		answers: Answers;
		selected?: Service[];
	} = $props();

	const layout = LAYOUTS[0];
	let usesMedia = $derived(selected.some((service) => service.vars.includes('DATA_DIR')));

	function normalize(): void {
		answers.dataDir = answers.dataDir.trim().replace(/\/+$/, '');
	}

	let commands = $derived.by(() => {
		const base = [
			`${answers.dataDir}/appdata`,
			`${answers.dataDir}/downloads`,
			`${answers.dataDir}/media/audiobooks`,
			`${answers.dataDir}/media/movies`,
			`${answers.dataDir}/media/music`,
			`${answers.dataDir}/media/podcasts`,
			`${answers.dataDir}/media/tv`
		];
		const folders = [...new Set([...base, ...dataDirs(selected, answers.dataDir)])].sort();
		const puid = /^\d{1,10}$/.test(answers.puid) ? answers.puid : '1000';
		const pgid = /^\d{1,10}$/.test(answers.pgid) ? answers.pgid : '1000';
		return `mkdir -p ${folders.map(shellQuote).join(' ')}
sudo chown -R ${puid}:${pgid} ${shellQuote(answers.dataDir)}`;
	});

	let tree = $derived(`${answers.dataDir}
├── appdata/     one folder per container
├── downloads/   qBittorrent saves here
└── media/
    ├── audiobooks/  Audiobookshelf
    ├── movies/      Radarr and Jellyfin
    ├── music/       Jellyfin
    ├── podcasts/    Audiobookshelf
    └── tv/          Sonarr and Jellyfin`);
</script>

<section class="step">
	{#if !usesMedia}
		<div class="card">
			<h3>No media folder needed</h3>
			<p>
				None of the selected services writes downloads, a library or app data under a host folder.
				Continue to ports.
			</p>
		</div>
	{:else}
	<div class="card">
		<label class="field">
			<span>Media root on the host</span>
			<input
				class="mono"
				type="text"
				spellcheck="false"
				autocomplete="off"
				bind:value={answers.dataDir}
				onblur={normalize}
				placeholder="/srv/media"
			/>
		</label>
		{#if !isValidDataDir(answers.dataDir)}
			<p class="error">Use an absolute path without a trailing slash, like /srv/media.</p>
		{/if}

		<div class="tree-head">
			<span class="mono label">Layout</span>
			<span class="mono label">one filesystem</span>
		</div>
		<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
		<pre class="mono tree" tabindex="0" role="region" aria-label="Media folder layout">{tree}</pre>
	</div>

	<div class="options" role="radiogroup" aria-label="Storage layout">
		{#each LAYOUTS as option (option.id)}
			<OptionRow
				group="layout"
				name={option.name}
				consequence={option.consequence}
				cost={option.cost}
				active={option.id === layout.id}
				disabled={option.id !== layout.id}
				reason={option.id === layout.id
					? undefined
					: 'Not offered: without a shared mount, every import is a full copy. Stackr will not generate that.'}
			/>
		{/each}
	</div>

	<details class="card prep-card">
		<summary class="prep-summary">
			<span class="prep-title">Before you run compose</span>
			<span class="mono label">folders + mount check</span>
			<span class="prep-chev" aria-hidden="true">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
					<path d="m6 9 6 6 6-6" />
				</svg>
			</span>
		</summary>

		<div class="prep-body">
			<div class="prep-step">
				<span class="mono label">1 · Create the folders</span>
				<p>
					Docker creates missing bind-mount folders as root. Create them first and give them to your
					user:
				</p>
				<details class="advanced">
					<summary>Show the folder command</summary>
					<div class="cmd">
						<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
						<pre class="mono" tabindex="0" role="region" aria-label="Folder setup commands">{commands}</pre>
						<CopyButton text={commands} label="Copy commands" />
					</div>
				</details>
			</div>

			<div class="prep-step">
				<span class="mono label">2 · Check the mount</span>
				<p>
					Hardlinks only work when the download folder and the library are on the same filesystem. The
					two numbers must match:
				</p>
				<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
				<pre class="mono stat" tabindex="0" role="region" aria-label="Hardlink filesystem check">stat -c %d {shellQuote(`${answers.dataDir}/downloads`)} {shellQuote(`${answers.dataDir}/media`)}</pre>
				<p class="muted">
					Different numbers mean Sonarr and Radarr will copy every import. The stack still works; the
					disk usage doubles.
				</p>
			</div>
		</div>
	</details>
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
		padding: 18px 20px;
	}

	.prep-card {
		padding: 6px 20px;
	}

	.prep-summary {
		display: flex;
		align-items: center;
		gap: 12px;
		min-height: 56px;
		cursor: pointer;
		list-style: none;
	}

	.prep-summary::-webkit-details-marker {
		display: none;
	}

	.prep-title {
		font-size: 14px;
		font-weight: 600;
	}

	.prep-summary .label {
		margin-left: auto;
	}

	.prep-chev {
		display: grid;
		place-items: center;
		width: 20px;
		height: 20px;
		color: var(--ink-3);
	}

	.prep-chev svg {
		width: 16px;
		height: 16px;
		transition: transform 0.15s ease;
	}

	.prep-card[open] .prep-chev svg {
		transform: rotate(180deg);
	}

	.prep-body {
		padding: 4px 0 14px;
		border-top: 1px solid var(--line-soft);
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

	.tree-head {
		display: flex;
		justify-content: space-between;
		gap: 12px;
		margin-top: 16px;
		padding: 12px 0 8px;
		border-top: 1px solid var(--line-soft);
	}

	.label {
		font-size: 10px;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--ink-3);
	}

	.tree {
		margin: 0;
		padding: 4px 0 0;
		font-size: 12.5px;
		line-height: 1.65;
		color: var(--ink-2);
		overflow-x: auto;
	}

	.options {
		background: var(--surface);
		border-radius: var(--radius);
		box-shadow: var(--shadow);
		overflow: hidden;
	}

	h3 {
		font-size: 14px;
		font-weight: 600;
		margin-bottom: 6px;
	}

	.card > p {
		font-size: 13px;
		color: var(--ink-2);
		max-width: 70ch;
	}

	.card > p.error {
		color: var(--warn);
		font-size: 12.5px;
		margin-top: 8px;
	}

	.prep-step {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.prep-step + .prep-step {
		margin-top: 14px;
		padding-top: 14px;
		border-top: 1px solid var(--line-soft);
	}

	.prep-step p {
		max-width: 70ch;
		font-size: 13px;
		color: var(--ink-2);
	}

	.prep-step p.muted {
		color: var(--ink-3);
		font-size: 12.5px;
	}

	.advanced summary {
		display: flex;
		align-items: center;
		gap: 8px;
		min-height: 44px;
		color: var(--accent);
		font-size: 12.5px;
		font-weight: 500;
		cursor: pointer;
		list-style: none;
	}

	.advanced summary::-webkit-details-marker {
		display: none;
	}

	.advanced summary::after {
		content: '▾';
		margin-left: auto;
		color: var(--ink-3);
		font-size: 11px;
		transition: transform 0.15s ease;
	}

	.advanced[open] summary::after {
		transform: rotate(180deg);
	}

	.advanced[open] summary {
		color: var(--ink-2);
	}

	.stat {
		margin: 10px 0;
		background: var(--surface-2);
		border-radius: 8px;
		padding: 10px 12px;
		font-size: 12.5px;
		overflow-x: auto;
	}

	.cmd {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 6px;
		margin-top: 12px;
	}

	.cmd pre {
		width: 100%;
		margin: 0;
		background: var(--surface-2);
		border-radius: 8px;
		padding: 10px 12px;
		font-size: 12.5px;
		overflow-x: auto;
	}

	.cmd :global(button) {
		min-height: 44px;
	}
</style>
