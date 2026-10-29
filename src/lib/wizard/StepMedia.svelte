<script lang="ts">
	import type { Service } from '../catalog/parse';
	import type { Answers } from './state';
	import { isValidDataDir } from './state';
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

	let commands = $derived(`mkdir -p ${answers.dataDir}/{appdata,downloads,media/movies,media/tv}
sudo chown -R ${answers.puid || '1000'}:${answers.pgid || '1000'} ${answers.dataDir}`);

	let tree = $derived(`${answers.dataDir}
├── appdata/     one folder per container
├── downloads/   qBittorrent saves here
└── media/
    ├── movies/  Radarr and Jellyfin
    └── tv/      Sonarr and Jellyfin`);
</script>

<section class="step">
	<h2>Where should the files live?</h2>
	<p class="lede">
		One folder holds downloads, the library and app config. That is what lets the arr apps hardlink a
		finished download instead of copying it.
	</p>

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
		<pre class="mono tree">{tree}</pre>
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

	<div class="card">
		<h3>Check the mount before you download</h3>
		<p>
			Hardlinks only work when the download folder and the library are on the same filesystem. Run this
			after creating the folders — the two numbers must match:
		</p>
		<pre class="mono stat">stat -c %d {answers.dataDir}/downloads {answers.dataDir}/media</pre>
		<p class="muted">
			Different numbers mean Sonarr and Radarr will copy every import. The stack still works; the disk
			usage doubles.
		</p>
		<div class="cmd">
			<pre class="mono">{commands}</pre>
			<CopyButton text={commands} label="Copy commands" />
		</div>
	</div>
	{/if}
</section>

<style>
	.step {
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	h2 {
		font-size: clamp(26px, 3.4vw, 34px);
		line-height: 1.1;
		letter-spacing: -0.03em;
		font-weight: 600;
	}

	.lede {
		color: var(--ink-2);
		font-size: 17px;
		max-width: 62ch;
		margin-top: -10px;
	}

	.card {
		background: var(--surface);
		border-radius: var(--radius);
		box-shadow: var(--shadow);
		padding: 18px 20px;
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

	.card > p.muted {
		color: var(--ink-3);
		font-size: 12.5px;
	}

	.card > p.error {
		color: var(--warn);
		font-size: 12.5px;
		margin-top: 8px;
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
