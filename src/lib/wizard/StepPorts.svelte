<script lang="ts">
	import type { Service } from '../catalog/parse';
	import type { Answers } from './state';
	import { findConflicts, isValidPort, portFields, portValue, suggestPort, usedPorts } from './ports';

	let { selected, answers = $bindable() }: { selected: Service[]; answers: Answers } = $props();

	type ConflictHit = { port: number; others: string; index: number; next: number };

	let fields = $derived(portFields(selected));
	let conflicts = $derived(findConflicts(selected, answers.ports));
	let used = $derived(usedPorts(selected, answers.ports));

	let hits = $derived.by(() => {
		const map = new Map<string, ConflictHit>();
		for (const conflict of conflicts) {
			const next = suggestPort(conflict.port, used);
			conflict.fields.forEach((field, index) => {
				map.set(field.varName, {
					port: conflict.port,
					others: conflict.fields
						.filter((candidate) => candidate.varName !== field.varName)
						.map((candidate) => candidate.service.name)
						.join(', '),
					index,
					next
				});
			});
		}
		return map;
	});

	function move(field: (typeof fields)[number]): void {
		const conflict = conflicts.find((candidate) =>
			candidate.fields.some((candidateField) => candidateField.varName === field.varName)
		);
		if (!conflict) return;
		answers.ports[field.varName] = suggestPort(conflict.port, used);
	}
</script>

<section class="step">
	<h2>Which ports should the stack use?</h2>
	<p class="lede">
		Every app gets its own host port. A collision is caught here, before anything is generated or
		downloaded.
	</p>

	<div class="card">
		<div class="card-head">
			<span class="mono label">Host ports</span>
			<span class="mono label">{fields.length} {fields.length === 1 ? 'entry' : 'entries'}</span>
		</div>
		{#each fields as field (field.varName)}
			{@const hit = hits.get(field.varName)}
			{@const bad = !isValidPort(portValue(field, answers.ports))}
			<div class="row" class:bad={bad || Boolean(hit)}>
				<div class="who">
					<span class="name">{field.service.name}</span>
					<span class="what">{field.label}</span>
				</div>
				<input
					class="mono"
					type="number"
					min="1"
					max="65535"
					step="1"
					aria-label="{field.service.name} {field.label} port"
					aria-invalid={bad || Boolean(hit)}
					bind:value={answers.ports[field.varName]}
				/>
				{#if bad}
					<div class="issue" aria-live="polite">Enter a port between 1 and 65535.</div>
				{:else if hit}
					<div class="issue" aria-live="polite">
						<span>Port {hit.port} is also used by {hit.others}.</span>
						{#if hit.index > 0}
							<button type="button" class="fix" onclick={() => move(field)}>
								Move {field.service.name} to {hit.next}
							</button>
						{/if}
					</div>
				{/if}
			</div>
		{/each}
	</div>
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
		margin-top: -8px;
	}

	.card {
		background: var(--surface);
		border-radius: var(--radius);
		box-shadow: var(--shadow);
		padding: 6px 18px;
	}

	.card-head {
		display: flex;
		justify-content: space-between;
		gap: 12px;
		padding: 12px 0 10px;
		border-bottom: 1px solid var(--line-soft);
	}

	.label {
		font-size: 10px;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--ink-3);
	}

	.row {
		display: grid;
		grid-template-columns: minmax(0, 1fr) 92px;
		align-items: center;
		gap: 4px 12px;
		padding: 12px 0;
		border-bottom: 1px solid var(--line-soft);
	}

	.row:last-child {
		border-bottom: 0;
	}

	.who {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.name {
		font-weight: 500;
		font-size: 14px;
		overflow-wrap: anywhere;
	}

	.what {
		font-size: 12px;
		color: var(--ink-3);
		overflow-wrap: anywhere;
	}

	input {
		width: 100%;
		min-height: 44px;
		border: 1px solid var(--field-line);
		border-radius: 10px;
		background: var(--surface-2);
		color: var(--ink);
		padding: 6px 10px;
		font: inherit;
		text-align: right;
	}

	.bad input {
		border-color: var(--warn);
	}

	.issue {
		grid-column: 1 / -1;
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 8px;
		font-size: 12.5px;
		line-height: 1.45;
		color: var(--warn);
	}

	.fix {
		min-height: 44px;
		padding: 0 12px;
		border: 1px solid var(--line);
		border-radius: 8px;
		background: var(--surface);
		color: var(--ink);
		font-size: 12.5px;
	}

	.fix:hover {
		border-color: var(--accent);
		color: var(--accent);
	}
</style>
