<script lang="ts">
	import type { Service } from '../catalog/parse';
	import type { Answers } from './state';
	import type { ResolvedVar } from '../compose/emit';
	import { secretCount, shellQuote } from './state';
	import { findConflicts, portFields } from './ports';

	let {
		selected,
		answers,
		vars = []
	}: {
		selected: Service[];
		answers: Answers;
		vars?: ResolvedVar[];
	} = $props();

	let fields = $derived(portFields(selected));
	let conflicts = $derived(findConflicts(selected, answers.ports));
	let secretsTotal = $derived(secretCount(selected));
	let sharedMount = $derived(
		selected.some((service) => service.composeText.includes('${DATA_DIR}:/data'))
	);
	let hasDozzle = $derived(selected.some((service) => service.slug === 'dozzle'));
	let missingDeps = $derived(
		selected.flatMap((service) =>
			service.deps
				.filter((dep) => !selected.some((candidate) => candidate.slug === dep))
				.map(
					(dep) =>
						`${service.name} is usually set up with ${dep
							.replace(/-/g, ' ')
							.replace(/^./, (letter) => letter.toUpperCase())}.`
				)
		)
	);

	function portsOf(service: Service): string {
		return service.portVars
			.map((varName) => answers.ports[varName] ?? service.portDefaults[varName])
			.join(', ');
	}
</script>

<section class="step">
	<div class="stats">
		<div class="stat">
			<span class="n">{selected.length}</span>
			<span class="k">{selected.length === 1 ? 'service' : 'services'}</span>
		</div>
		<div class="stat">
			<span class="n">{fields.length}</span>
			<span class="k">{fields.length === 1 ? 'host port' : 'host ports'}</span>
		</div>
		<div class="stat">
			<span class="n">{secretsTotal}</span>
			<span class="k">{secretsTotal === 1 ? 'secret' : 'secrets'}</span>
		</div>
		<div class="stat" class:bad={conflicts.length > 0}>
			<span class="n">{conflicts.length}</span>
			<span class="k">{conflicts.length === 1 ? 'conflict' : 'conflicts'}</span>
		</div>
	</div>

	{#if vars.length > 0}
		<details class="card env-card">
			<summary class="env-summary">
				<span class="mono label">Environment</span>
				<span class="mono env-count">
					{vars.length} {vars.length === 1 ? 'value' : 'values'} · type · default · required
				</span>
				<span class="env-chev" aria-hidden="true">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
						<path d="m6 9 6 6 6-6" />
					</svg>
				</span>
			</summary>
			<div class="env-scroll">
				{#each vars as variable (variable.name)}
					<div class="env-row">
						<span class="env-name mono">{variable.name}</span>
						<span class="env-meta mono">
							{variable.type} · {variable.defaultValue} · {variable.required ? 'required' : 'optional'}
						</span>
					</div>
				{/each}
			</div>
		</details>
	{/if}

	<div class="card">
		<div class="card-head">
			<span class="mono label">Selected</span>
			<span class="mono label path">{answers.dataDir}</span>
		</div>
		<ul class="list">
			{#each selected as service (service.slug)}
				<li>
					<div class="line">
						<span class="name">{service.name}</span>
						{#if service.portVars.length > 0}
							<span class="ports mono">{portsOf(service)}</span>
						{/if}
					</div>
					<p class="consequence">{service.consequence}</p>
					<p class="cost">{service.cost}</p>
				</li>
			{/each}
		</ul>
	</div>

	{#if conflicts.length > 0}
		<div class="box danger">
			<strong>{conflicts.length} port conflict{conflicts.length === 1 ? '' : 's'}.</strong>
			Go back to the ports step — the download stays disabled until every service has its own port.
		</div>
	{/if}

	{#if hasDozzle}
		<div class="box danger">
			<strong>Dozzle can control every container.</strong>
			The Docker socket is root-equivalent on the host, even mounted read-only. Anyone who reaches its
			port can stop or delete containers. Keep it on the LAN.
		</div>
	{/if}

	{#if missingDeps.length > 0}
		<div class="box">
			<strong>Worth knowing.</strong>
			{#each missingDeps as line (line)}
				<span class="dep">{line} You can point it elsewhere later.</span>
			{/each}
		</div>
	{/if}

	<div class="box warn">
		<strong>These ports are open to your LAN.</strong>
		No authentication is added by stackr and none of these services should face the internet. Do not
		port-forward them; use a VPN or a reverse proxy with authentication if you need remote access.
	</div>

	{#if sharedMount}
		<div class="box">
			<strong>Hardlinks, one last check.</strong>
			<code>stat -c %d {shellQuote(`${answers.dataDir}/downloads`)} {shellQuote(`${answers.dataDir}/media`)}</code> must print the same number
			twice. If it does not, imports copy instead of link.
		</div>
	{/if}
</section>

<style>
	.step {
		display: flex;
		flex-direction: column;
		gap: 14px;
	}

	.stats {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 10px;
	}

	.stat {
		display: flex;
		flex-direction: column;
		background: var(--surface);
		border-radius: var(--radius-sm);
		box-shadow: var(--shadow);
		padding: 12px 14px;
	}

	.stat.bad {
		box-shadow: inset 0 0 0 1px var(--warn), var(--shadow);
	}

	.env-card {
		padding: 6px 20px;
	}

	.env-summary {
		display: flex;
		align-items: center;
		gap: 12px;
		min-height: 56px;
		cursor: pointer;
		list-style: none;
	}

	.env-summary::-webkit-details-marker {
		display: none;
	}

	.env-count {
		margin-left: auto;
		font-size: 10px;
		color: var(--ink-3);
		text-align: right;
	}

	.env-chev {
		display: grid;
		place-items: center;
		width: 20px;
		height: 20px;
		color: var(--ink-3);
	}

	.env-chev svg {
		width: 16px;
		height: 16px;
		transition: transform 0.15s ease;
	}

	.env-card[open] .env-chev svg {
		transform: rotate(180deg);
	}

	.env-scroll {
		padding-bottom: 6px;
		border-top: 1px solid var(--line-soft);
	}

	.env-row {
		display: flex;
		flex-direction: column;
		gap: 1px;
		padding: 7px 0;
		border-bottom: 1px solid var(--line-soft);
		min-width: 0;
	}

	.env-row:last-child {
		border-bottom: 0;
	}

	.env-name {
		font-size: 11px;
		color: var(--ink);
		overflow-wrap: anywhere;
	}

	.env-meta {
		font-size: 10px;
		line-height: 1.4;
		color: var(--ink-3);
		overflow-wrap: anywhere;
	}

	.n {
		font-size: 22px;
		font-weight: 600;
		letter-spacing: -0.03em;
	}

	.k {
		font-size: 11px;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--ink-3);
	}

	.card {
		background: var(--surface);
		border-radius: var(--radius);
		box-shadow: var(--shadow);
		padding: 6px 20px;
	}

	.card-head {
		display: flex;
		justify-content: space-between;
		gap: 12px;
		padding: 14px 0 10px;
		border-bottom: 1px solid var(--line-soft);
	}

	.label {
		font-size: 10px;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--ink-3);
	}

	.path {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.list {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.list li {
		padding: 12px 0;
		border-bottom: 1px solid var(--line-soft);
	}

	.list li:last-child {
		border-bottom: 0;
	}

	.line {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 12px;
	}

	.name {
		font-size: 14.5px;
		font-weight: 600;
	}

	.ports {
		font-size: 12.5px;
		color: var(--ink-2);
		white-space: nowrap;
	}

	.consequence {
		margin-top: 2px;
		font-size: 12.5px;
		line-height: 1.45;
		color: var(--ink-2);
	}

	.cost {
		margin-top: 2px;
		font-size: 12.5px;
		line-height: 1.45;
		color: var(--ink-3);
	}

	.box {
		background: var(--surface);
		border-radius: var(--radius-sm);
		box-shadow: var(--shadow);
		padding: 12px 16px;
		font-size: 13px;
		line-height: 1.6;
		color: var(--ink-2);
	}

	.box strong {
		color: var(--ink);
	}

	.dep {
		display: block;
	}

	.warn {
		background: color-mix(in srgb, var(--warn) 8%, var(--surface));
	}

	.danger {
		background: color-mix(in srgb, var(--warn) 12%, var(--surface));
	}

	code {
		font-family: var(--mono);
		font-size: 0.94em;
		word-break: break-all;
	}

	@media (max-width: 639px) {
		.stats {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}

		.env-count {
			font-size: 10px;
		}
	}
</style>
