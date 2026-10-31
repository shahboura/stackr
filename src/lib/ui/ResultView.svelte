<script lang="ts">
	import { onMount } from 'svelte';
	import type { Service } from '../catalog/parse';
	import type { Answers } from '../wizard/state';
	import type { BuildResult } from '../compose/emit';
	import { findConflicts } from '../wizard/ports';
	import { HOSTS } from '../wizard/presets';
	import { hardlinkStatus } from '../wizard/host';
	import { SECRET_NOTES } from '../secrets/generate';
	import { redactEnv } from '../compose/redact';
	import CopyButton from './CopyButton.svelte';
	import SecretValue from './SecretValue.svelte';
	import { downloadFile } from './download';
	import { fileMeta } from './format';

	let {
		result,
		selected,
		answers,
		onback
	}: {
		result: BuildResult;
		selected: Service[];
		answers: Answers;
		onback: () => void;
	} = $props();

	// Start in the right shape; onMount adds the listener for later resizes.
	let wide = $state(
		typeof window === 'undefined' ? true : window.matchMedia('(min-width: 640px)').matches
	);
	let tab = $state<'compose' | 'env'>('compose');
	const files = $derived([
		{
			name: 'compose.yaml',
			text: result.compose,
			hint: 'Services, ports and mounts. Values are read from .env.'
		},
		{
			name: '.env',
			text: result.env,
			hint: 'Real values in the download; masked here. Save it as .env.'
		}
	]);

	const secrets = $derived(result.vars.filter((v) => v.kind === 'secret'));
	const secretNames = $derived(secrets.map((secret) => secret.name));
	const displayText = (name: string, text: string): string =>
		name === '.env' ? redactEnv(text, secretNames) : text;
	const shown = $derived(tab === 'env' ? files[1] : files[0]);
	const conflictCount = $derived(findConflicts(selected, answers.ports).length);
	const hasDozzle = $derived(selected.some((service) => service.slug === 'dozzle'));
	/** Only the arr stack (and qBittorrent) mounts the whole media root at /data. */
	const sharedMount = $derived(selected.some((service) => service.composeText.includes('${DATA_DIR}:/data')));
	const host = $derived(HOSTS.find((preset) => preset.id === answers.host) ?? HOSTS[0]);
	const hardlinks = $derived(hardlinkStatus(host, sharedMount));

	function hostPort(service: Service): number | null {
		const name = service.portVars[0];
		if (!name) return null;
		return answers.ports[name] ?? service.portDefaults[name] ?? service.ports[0] ?? null;
	}

	const imageOf = (service: Service): string => service.images[0] ?? '';

	/** The registry path is too long for a node; show the tag, keep the full image in title. */
	function imageTag(service: Service): string {
		const image = imageOf(service);
		const last = image.split('/').pop() ?? image;
		return last.includes(':') ? last.split(':').pop()! : last;
	}

	onMount(() => {
		const query = window.matchMedia('(min-width: 640px)');
		const update = (event: MediaQueryListEvent) => (wide = event.matches);
		wide = query.matches;
		query.addEventListener('change', update);
		return () => query.removeEventListener('change', update);
	});
</script>

<section class="result">
	{#snippet secretsBlock()}
		{#if secrets.length > 0}
			<div class="secrets">
				<p class="mono tech-label">Generated secrets</p>
				{#each secrets as secret (secret.name)}
					<SecretValue
						name={secret.name}
						value={secret.value}
						note={secret.secretKind ? SECRET_NOTES[secret.secretKind] : undefined}
						dark
					/>
				{/each}
			</div>
		{/if}
	{/snippet}

	{#snippet checksBlock()}
		<section class="checks">
			<h2 class="mono checks-title">Checks</h2>
			<dl>
				<div>
					<dt>Ports</dt>
					<dd class="mono" class:ok={conflictCount === 0} class:bad={conflictCount > 0}>
						{conflictCount === 0
							? 'no conflicts'
							: `${conflictCount} conflict${conflictCount === 1 ? '' : 's'}`}
					</dd>
				</div>
				<div>
					<dt>Hardlinks</dt>
					<dd class="mono" class:ok={hardlinks === 'one mount'} class:bad={hardlinks === 'may copy'}>
						{hardlinks}
					</dd>
				</div>
				<div>
					<dt>Volumes</dt>
					<dd class="mono" class:ok={sharedMount}>
						{sharedMount ? `${answers.dataDir} → /data` : 'no shared mount'}
					</dd>
				</div>
				<div>
					<dt>Generated in browser</dt>
					<dd class="mono ok">nothing uploaded</dd>
				</div>
			</dl>
		</section>
	{/snippet}

	<header class="head">
		<h1 id="result-heading" tabindex="-1">Your stack is ready.</h1>
		<p class="lede">
			Check the ports and secrets, then download both files. Nothing leaves this browser.
		</p>
		<div class="head-actions">
			<button type="button" class="primary" onclick={() => downloadFile(shown.name, shown.text)}>
				Download {shown.name}
			</button>
		</div>
	</header>

	<div class="layout">
		<section class="tech" aria-label="Topology and generated secrets">
			<div class="tech-head">
				<span class="mono tech-label">Topology</span>
				<span class="mono tech-count">
					{selected.length} {selected.length === 1 ? 'service' : 'services'}
					{#if secrets.length > 0} · {secrets.length} {secrets.length === 1 ? 'secret' : 'secrets'}{/if}
				</span>
			</div>
			{#if wide}
				<div class="nodes">
					{#each selected as service (service.slug)}
						{@const port = hostPort(service)}
						<div class="node">
							<span class="mono node-name">{service.name}</span>
							<span class="mono node-port">{port === null ? '—' : `:${port}`}</span>
							<span class="mono node-image" title={imageOf(service)}>{imageTag(service)}</span>
						</div>
					{/each}
				</div>
			{:else}
				<div class="spine">
					{#each selected as service (service.slug)}
						{@const port = hostPort(service)}
						<div class="spine-row">
							<div class="spine-main">
								<span class="mono spine-name">{service.name}</span>
								<span class="mono spine-image" title={imageOf(service)}>{imageTag(service)}</span>
							</div>
							<span class="mono spine-port">{port === null ? '—' : `:${port}`}</span>
						</div>
					{/each}
				</div>
				{#if sharedMount}
					<div class="mono volume">
						<span>{answers.dataDir} → /data</span>
						<span class="volume-note">shared volume</span>
					</div>
				{/if}
			{/if}
			{@render secretsBlock()}
			{#if sharedMount && host.platform === 'desktop'}
				<p class="tech-warn">
					Docker Desktop: {host.caution}
				</p>
			{/if}
			{#if hasDozzle}
				<p class="tech-warn">
					Dozzle mounts the Docker socket: root-equivalent control of the host. Keep its port on
					the LAN.
				</p>
			{/if}
		</section>

		<article class="pane">
			<header class="pane-head">
				<div class="tabs" role="group" aria-label="Files">
					<button
						type="button"
						class="tab mono"
						aria-controls="file-preview"
						aria-pressed={tab === 'compose'}
						onclick={() => (tab = 'compose')}
					>
						compose.yaml
					</button>
					<button
						type="button"
						class="tab mono"
						aria-controls="file-preview"
						aria-pressed={tab === 'env'}
						onclick={() => (tab = 'env')}
					>
						.env
					</button>
				</div>
				<div class="actions">
					<CopyButton text={shown.text} compact label={`Copy ${shown.name}`} />
					<button
						type="button"
						class="action icon-only"
						aria-label={`Download ${shown.name}`}
						title={`Download ${shown.name}`}
						onclick={() => downloadFile(shown.name, shown.text)}
					>
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
							<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
							<polyline points="7 10 12 15 17 10" />
							<line x1="12" x2="12" y1="15" y2="3" />
						</svg>
					</button>
				</div>
			</header>
			<div class="file-title">
				<h2 class="mono">{shown.name}</h2>
				<p class="mono meta">{fileMeta(shown.text)}</p>
			</div>
			<p class="hint">{shown.hint}</p>
			<p class="sr-only" role="status" aria-live="polite">{shown.name} shown</p>
			<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
			<pre id="file-preview" class="mono code" tabindex="0" role="region" aria-label={shown.name}>{displayText(shown.name, shown.text)}</pre>
		</article>

		{@render checksBlock()}
	</div>

	<footer class="run">
		<div class="run-line">
			<span class="mono run-label">Run</span>
			<code class="mono">docker compose up -d</code>
		</div>
		<button type="button" class="primary" onclick={() => downloadFile(shown.name, shown.text)}>Download {shown.name}</button>
	</footer>

	<div class="next">
		<button type="button" class="ghost" onclick={onback}>Change answers</button>
		<a class="ghost" href="/">Back to catalog</a>
	</div>
</section>

<style>
	.result {
		display: flex;
		flex-direction: column;
		gap: 20px;
		min-width: 0;
	}

	.head h1 {
		font-size: clamp(28px, 5vw, 34px);
		line-height: 1.08;
		letter-spacing: -0.03em;
		font-weight: 600;
	}

	.head-actions {
		display: none;
		margin-top: 14px;
	}

	.lede {
		margin-top: 8px;
		color: var(--ink-2);
		font-size: 17px;
		max-width: 60ch;
	}

	.layout {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: 16px;
		align-items: start;
		min-width: 0;
	}

	/* Technical card: always dark, only --tech-* tokens inside. */
	.tech {
		display: flex;
		flex-direction: column;
		gap: 14px;
		background: var(--tech-bg);
		border-radius: var(--radius);
		padding: 18px;
		color: var(--tech-ink);
		min-width: 0;
	}

	.tech .tech-head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 12px;
		flex-wrap: wrap;
		padding-bottom: 12px;
		border-bottom: 1px solid var(--tech-line);
	}

	.tech .tech-label {
		font-size: 10px;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--tech-mute);
	}

	.tech .tech-count {
		font-size: 10px;
		color: var(--tech-mute);
	}

	.nodes {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
		gap: 8px;
		min-width: 0;
	}

	.tech .node {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		grid-template-areas:
			'name port'
			'image image';
		gap: 1px 10px;
		padding: 10px 12px;
		border: 1px solid var(--tech-line);
		border-radius: var(--radius-sm);
		background: color-mix(in srgb, var(--tech-ink) 4%, transparent);
		min-width: 0;
	}

	.tech .node-name {
		grid-area: name;
		font-size: 12px;
		font-weight: 500;
		color: var(--tech-ink);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.tech .node-port {
		grid-area: port;
		font-size: 12px;
		color: var(--tech-accent);
	}

	.tech .node-image {
		grid-area: image;
		font-size: 10px;
		color: var(--tech-mute);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.tech .secrets {
		display: flex;
		flex-direction: column;
		gap: 12px;
		padding-top: 12px;
		border-top: 1px solid var(--tech-line);
		min-width: 0;
	}

	/* Below 640px: one trunk line, ports right-aligned. */
	.spine {
		position: relative;
		display: flex;
		flex-direction: column;
		gap: 14px;
		padding-left: 22px;
		min-width: 0;
	}

	.tech .spine::before {
		content: '';
		position: absolute;
		left: 4px;
		top: 8px;
		bottom: 8px;
		width: 1px;
		background: var(--tech-line);
	}

	.spine-row {
		position: relative;
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 12px;
		min-width: 0;
	}

	.tech .spine-row::before {
		content: '';
		position: absolute;
		left: -22px;
		top: 0.5em;
		width: 9px;
		height: 9px;
		border-radius: 50%;
		background: var(--tech-accent);
	}

	.spine-main {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.tech .spine-name {
		font-size: 12.5px;
		font-weight: 500;
		color: var(--tech-ink);
	}

	.tech .spine-image {
		font-size: 10px;
		color: var(--tech-mute);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.tech .spine-port {
		flex-shrink: 0;
		font-size: 12px;
		color: var(--tech-accent);
	}

	.tech .volume {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 10px;
		flex-wrap: wrap;
		border: 1px dashed var(--tech-line);
		border-radius: var(--radius-sm);
		padding: 10px 12px;
		font-size: 11.5px;
		color: var(--tech-ink);
		overflow-wrap: anywhere;
	}

	.tech .volume-note {
		font-size: 10px;
		color: var(--tech-mute);
	}

	.tech .tech-warn {
		padding-top: 10px;
		border-top: 1px solid var(--tech-line);
		font-size: 11.5px;
		line-height: 1.55;
		color: color-mix(in srgb, var(--warn) 55%, var(--tech-ink));
	}

	.pane {
		display: flex;
		flex-direction: column;
		gap: 10px;
		background: var(--surface);
		border-radius: var(--radius);
		box-shadow: var(--shadow);
		padding: 16px;
		min-width: 0;
	}

	.pane-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
		flex-wrap: wrap;
		min-width: 0;
	}

	.file-title {
		display: flex;
		align-items: baseline;
		gap: 8px;
		flex-wrap: wrap;
		min-width: 0;
	}

	.file-title .meta {
		margin-top: 0;
	}

	.file-title h2 {
		font-size: 13px;
		font-weight: 600;
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip: rect(0 0 0 0);
		white-space: nowrap;
	}

	.meta {
		margin-top: 2px;
		font-size: 10.5px;
		color: var(--ink-3);
	}

	.hint {
		font-size: 12px;
		color: var(--ink-3);
	}

	.actions {
		display: flex;
		margin-left: auto;
		gap: 8px;
		flex-shrink: 0;
	}

	.action {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		background: var(--surface-2);
		color: var(--ink);
		border: 0;
		border-radius: 8px;
		padding: 6px 12px;
		font-size: 12.5px;
		font-weight: 500;
		min-height: 44px;
	}

	.action svg {
		width: 14px;
		height: 14px;
	}

	.icon-only {
		width: 44px;
		padding: 0;
	}

	.action:hover {
		background: color-mix(in srgb, var(--surface-2) 70%, var(--ink-3));
	}

	.code {
		margin: 0;
		background: var(--surface-2);
		border-radius: var(--radius-sm);
		padding: 12px 14px;
		font-size: 11.5px;
		line-height: 1.6;
		color: var(--ink-2);
		max-height: 240px;
		overflow: auto;
		white-space: pre;
		tab-size: 2;
	}

	.checks {
		min-width: 0;
		background: var(--surface);
		border-radius: var(--radius);
		box-shadow: var(--shadow);
		padding: 14px 18px;
	}

	.checks-title {
		margin-bottom: 4px;
		font-size: 10px;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--ink-3);
	}

	.checks dl {
		margin: 0;
	}

	.checks dl > div {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 12px;
		padding: 9px 0;
		border-bottom: 1px solid var(--line-soft);
		min-width: 0;
	}

	.checks dl > div:last-child {
		border-bottom: 0;
	}

	.checks dt {
		flex-shrink: 0;
		font-size: 12.5px;
		color: var(--ink-2);
	}

	.checks dd {
		margin: 0;
		font-size: 12px;
		text-align: right;
		overflow-wrap: anywhere;
		min-width: 0;
	}

	.ok {
		color: var(--ok);
	}

	.bad {
		color: var(--warn);
	}

	.tabs {
		display: flex;
		flex-shrink: 0;
		gap: 4px;
		padding: 4px;
		background: var(--surface-2);
		border-radius: 9px;
	}

	.tab {
		flex: 1;
		min-height: 44px;
		padding: 0 12px;
		background: transparent;
		color: var(--ink-2);
		border: 0;
		border-radius: 7px;
		font-size: 12px;
	}

	.tab[aria-pressed='true'] {
		background: var(--seg-active);
		color: var(--ink);
		box-shadow: var(--shadow);
	}

	.primary {
		background: var(--accent);
		color: var(--on-accent);
		border: 0;
		border-radius: 980px;
		padding: 10px 22px;
		font-size: 14px;
		font-weight: 500;
		min-height: 44px;
	}

	.primary:hover:not(:disabled) {
		filter: brightness(1.05);
	}

	.next {
		display: flex;
		align-items: center;
		align-content: center;
		gap: 8px;
		flex-wrap: wrap;
	}

	.ghost {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: 44px;
		padding: 0 14px;
		border: 0;
		border-radius: 980px;
		background: transparent;
		color: var(--accent);
		font: inherit;
		font-size: 13.5px;
		line-height: 1;
		text-decoration: none;
	}

	.ghost:hover {
		background: var(--surface-2);
		color: var(--ink);
		text-decoration: none;
	}

	.run {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		flex-wrap: wrap;
		background: var(--surface);
		border-radius: var(--radius);
		box-shadow: var(--shadow);
		padding: 18px 20px;
	}

	.run-line {
		display: flex;
		align-items: center;
		gap: 10px;
		min-width: 0;
	}

	.run-label {
		font-size: 10px;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--ink-3);
	}

	.run code {
		padding: 8px 12px;
		background: var(--surface-2);
		border-radius: 8px;
		font-size: 14px;
		color: var(--ink);
		overflow-wrap: anywhere;
	}

	@media (min-width: 640px) {
		.layout {
			grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
		}

		.tech {
			grid-column: 1;
			grid-row: 1;
		}

		.pane {
			grid-column: 2;
			grid-row: 1;
		}

		.checks {
			grid-column: 1 / -1;
			grid-row: 2;
		}

		.checks dl {
			display: grid;
			grid-template-columns: repeat(2, minmax(0, 1fr));
			gap: 10px 18px;
		}

		.checks dl > div {
			flex-direction: column;
			align-items: flex-start;
			gap: 2px;
			padding: 0;
			border-bottom: 0;
		}

		.checks dd {
			text-align: left;
		}
	}

	@media (min-width: 1024px) {
		.checks dl {
			grid-template-columns: repeat(4, minmax(0, 1fr));
		}
	}

	@media (max-width: 639.98px) {
		.head-actions {
			display: block;
		}

		.head-actions .primary {
			width: 100%;
		}

		.action {
			min-height: 44px;
			padding: 8px 14px;
		}

		.run {
			flex-direction: column;
			align-items: stretch;
		}

		.run-line {
			flex-wrap: wrap;
		}

		.run .primary {
			width: 100%;
		}
	}

</style>
