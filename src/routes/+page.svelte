<script lang="ts">
	import { catalog } from '#lib/catalog/vite';
	import { findConflicts } from '#lib/wizard/ports';
	import { secretCount, selectionUrl } from '#lib/wizard/state';

	const ALL = 'all';

	let active = $state<string>(ALL);
	let query = $state('');
	let selected = $state<string[]>([]);

	let categories = $derived(
		[...new Set(catalog.map((service) => service.category))].sort((a, b) => a.localeCompare(b))
	);

	let visible = $derived(
		catalog.filter((service) => {
			const inCategory = active === ALL || service.category === active;
			const haystack = [
				service.name,
				service.summary,
				service.category,
				...service.tags,
				...service.ports.map(String),
				...service.deps
			]
				.join(' ')
				.toLowerCase();
			return inCategory && haystack.includes(query.trim().toLowerCase());
		})
	);

	let selectedServices = $derived(
		selected.flatMap((slug) => {
			const service = catalog.find((candidate) => candidate.slug === slug);
			return service ? [service] : [];
		})
	);
	let conflictCount = $derived(findConflicts(selectedServices, {}).length);
	let secretTotal = $derived(secretCount(selectedServices));

	const categoryLabel = (category: string): string =>
		category.charAt(0).toUpperCase() + category.slice(1);

	function clearSearch(): void {
		query = '';
		document.getElementById('service-search')?.focus();
	}

	function toggle(slug: string): void {
		selected = selected.includes(slug)
			? selected.filter((candidate) => candidate !== slug)
			: [...selected, slug];
	}
</script>

<svelte:head>
	<title>stackr — compose files that work on the first try</title>
	<meta
		name="description"
		content="Pick self-hosted services and get a docker-compose file with a working .env, generated in your browser."
	/>
</svelte:head>

<main class="container page">
	<header class="hero">
		<h1>Your stack, generated.</h1>
		<p class="lede">
			Pick your services and get a <span class="mono">compose.yaml</span> and a
			<span class="mono">.env</span> that agree — ports, mounts and secrets worked out in your
			browser.
		</p>
	</header>

	<div class="controls">
		<div class="segmented" role="group" aria-label="Filter by category">
			<button type="button" aria-pressed={active === ALL} onclick={() => (active = ALL)}>
				All
			</button>
			{#each categories as category (category)}
				<button
					type="button"
					aria-pressed={active === category}
					onclick={() => (active = category)}
				>
					{categoryLabel(category)}
				</button>
			{/each}
		</div>
		<div class="search">
			<svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
				<circle cx="11" cy="11" r="7" />
				<path d="m20 20-3.5-3.5" />
			</svg>
			<input
				id="service-search"
				type="search"
				placeholder="Search services"
				aria-label="Search services"
				spellcheck="false"
				bind:value={query}
				onkeydown={(event) => {
					if (event.key === 'Escape') query = '';
				}}
			/>
			{#if query}
				<button type="button" class="clear" aria-label="Clear search" title="Clear search" onclick={clearSearch}>
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
						<path d="M18 6 6 18M6 6l12 12" />
					</svg>
				</button>
			{/if}
		</div>
	</div>

	<p class="sr-only" role="status" aria-atomic="true">
		{visible.length} {visible.length === 1 ? 'service' : 'services'} shown
	</p>

	{#if visible.length === 0}
		<p class="empty">
			No services match “{query}”.
			<button type="button" class="link" onclick={clearSearch}>Clear</button>
			{#if active !== ALL}
				<button type="button" class="link" onclick={() => (active = ALL)}>Search all services</button>
			{/if}
		</p>
	{:else}
	<div class="grid">
		{#each visible as service (service.slug)}
			{@const isSelected = selected.includes(service.slug)}
			<button
				type="button"
				class="card"
				aria-pressed={isSelected}
				aria-label={`${isSelected ? 'Remove' : 'Add'} ${service.name} ${
					isSelected ? 'from' : 'to'
				} the stack`}
				onclick={() => toggle(service.slug)}
			>
				<span class="icon">
					<img src={`/icons/${service.slug}.svg`} alt="" width="32" height="32" loading="lazy" />
				</span>
				<span class="body">
					<span class="name">{service.name}</span>
					<span class="summary">{service.summary}</span>
					{#if isSelected && Object.keys(service.generators).length > 0}
						<span class="secret-add">
							+{Object.keys(service.generators).length} secret{Object.keys(service.generators).length === 1
								? ''
								: 's'}
						</span>
					{/if}
					<span class="foot">
						<span class="tag mono">{service.ports.length ? `:${service.ports[0]}` : service.ram}</span>
						<span class="action">{isSelected ? 'Added' : 'Add'}</span>
					</span>
				</span>
				{#if isSelected}
					<span class="badge" aria-hidden="true">
						<svg viewBox="0 0 20 20" width="12" height="12">
							<path
								d="M4 10.5l4 4 8-9"
								fill="none"
								stroke="currentColor"
								stroke-width="2.4"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						</svg>
					</span>
				{/if}
			</button>
		{/each}
	</div>
	{/if}
</main>

<div class="bag">
	<div class="container bag-inner">
		<div class="counts">
			<span
				><strong>{selectedServices.length}</strong> {selectedServices.length === 1
					? 'service'
					: 'services'}</span
			>
			<span class="sep" aria-hidden="true">·</span>
			<span class:warn={conflictCount > 0}
				>{conflictCount} {conflictCount === 1 ? 'conflict' : 'conflicts'}</span
			>
			<span class="secrets">
				<span class="sep" aria-hidden="true">·</span>
				<span>{secretTotal} {secretTotal === 1 ? 'secret' : 'secrets'}</span>
			</span>
		</div>
		{#if selectedServices.length > 0}
			<a class="cta" href={selectionUrl(selectedServices)}>Continue</a>
		{:else}
			<button type="button" class="cta disabled" disabled>Continue</button>
		{/if}
	</div>
</div>

<style>
	.page {
		min-height: calc(100dvh - 48px);
		padding: 56px 0 48px;
	}

	.hero {
		max-width: 760px;
		margin: 0 auto;
		padding-bottom: 30px;
		text-align: center;
	}

	h1 {
		font-size: clamp(38px, 7vw, 58px);
		line-height: 1.03;
		font-weight: 600;
		letter-spacing: -0.035em;
	}

	.lede {
		max-width: 52ch;
		margin: 16px auto 0;
		font-size: 17px;
		line-height: 1.5;
		color: var(--ink-2);
	}

	.controls {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: center;
		gap: 10px;
		margin-bottom: 22px;
	}

	.search {
		position: relative;
		width: min(260px, 100%);
	}

	.search input {
		width: 100%;
		min-height: 48px;
		border: 1px solid var(--field-line);
		border-radius: 9px;
		background: var(--surface);
		color: var(--ink);
		padding: 8px 46px 8px 38px;
		font: inherit;
		font-size: 13px;
	}

	.search input::placeholder {
		color: var(--ink-3);
		opacity: 1;
	}

	.search input::-webkit-search-cancel-button {
		display: none;
	}

	.search-icon {
		position: absolute;
		left: 13px;
		top: 50%;
		width: 16px;
		height: 16px;
		transform: translateY(-50%);
		color: var(--ink-3);
		pointer-events: none;
	}

	.clear {
		position: absolute;
		right: 0;
		top: 0;
		display: grid;
		place-items: center;
		width: 44px;
		height: 44px;
		border: 0;
		border-radius: 8px;
		background: transparent;
		color: var(--ink-2);
	}

	.clear:hover {
		background: var(--surface-2);
		color: var(--ink);
	}

	.clear svg {
		width: 14px;
		height: 14px;
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip: rect(0 0 0 0);
		white-space: nowrap;
	}

	.empty {
		padding: 56px 0;
		text-align: center;
		color: var(--ink-2);
		font-size: 14px;
	}

	.link {
		display: inline-flex;
		align-items: center;
		min-width: 44px;
		min-height: 44px;
		justify-content: center;
		background: none;
		border: 0;
		padding: 0 4px;
		color: var(--accent);
		font-size: inherit;
		text-decoration: underline;
	}

	.segmented {
		display: inline-flex;
		gap: 2px;
		padding: 2px;
		background: var(--surface-2);
		border-radius: 9px;
	}

	.segmented button {
		min-height: 44px;
		padding: 0 14px;
		border: 0;
		border-radius: 7px;
		background: transparent;
		color: var(--ink-2);
		font-size: 13px;
		font-weight: 500;
		line-height: 1;
		transition:
			background 0.15s ease,
			color 0.15s ease;
	}

	.segmented button:hover {
		color: var(--ink);
	}

	.segmented button[aria-pressed='true'] {
		background: var(--seg-active);
		color: var(--ink);
		box-shadow: var(--shadow);
	}


	.grid {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 12px;
	}

	.card {
		position: relative;
		display: grid;
		grid-template-columns: 58px minmax(0, 1fr);
		gap: 12px;
		align-items: start;
		min-width: 0;
		padding: 14px;
		text-align: left;
		background: var(--surface);
		color: var(--ink);
		border: 0;
		border-radius: var(--radius);
		box-shadow: var(--shadow);
		transition: transform 0.15s ease;
	}

	.card:hover {
		transform: translateY(-1px);
	}

	.card:active {
		transform: none;
	}

	.icon {
		display: grid;
		place-items: center;
		width: 58px;
		height: 58px;
		border-radius: var(--radius-sm);
		background: var(--surface-2);
	}

	.icon img {
		display: block;
		width: 32px;
		height: 32px;
	}

	.body {
		display: flex;
		flex-direction: column;
		gap: 3px;
		min-width: 0;
	}

	.name {
		font-size: 15px;
		font-weight: 600;
		line-height: 1.3;
		letter-spacing: -0.01em;
	}

	.summary {
		font-size: 12.5px;
		line-height: 1.4;
		color: var(--ink-2);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.secret-add {
		font-family: var(--mono);
		font-size: 10.5px;
		color: var(--ink-2);
	}

	.foot {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
		min-width: 0;
		margin-top: 2px;
	}

	.tag {
		font-size: 11px;
		color: var(--ink-3);
	}

	.action {
		font-size: 12.5px;
		font-weight: 500;
		color: var(--accent);
	}

	.card[aria-pressed='true'] .action {
		color: var(--ink-2);
	}

	.badge {
		position: absolute;
		top: 10px;
		right: 10px;
		display: grid;
		place-items: center;
		width: 20px;
		height: 20px;
		border-radius: 50%;
		background: var(--accent);
		color: var(--on-accent);
	}

	.bag {
		position: sticky;
		bottom: 0;
		z-index: 9;
		border-top: 1px solid var(--line-soft);
		background: color-mix(in srgb, var(--surface) 94%, transparent);
		backdrop-filter: saturate(180%) blur(20px);
		-webkit-backdrop-filter: saturate(180%) blur(20px);
	}

	.bag-inner {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		min-height: 64px;
	}

	.counts {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 6px;
		font-size: 12.5px;
		color: var(--ink-2);
	}

	.counts strong {
		color: var(--ink);
		font-weight: 600;
	}

	.sep {
		color: var(--ink-3);
	}

	.warn {
		color: var(--warn);
	}

	.secrets {
		display: inline-flex;
		align-items: center;
		gap: 6px;
	}

	.cta {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: 44px;
		padding: 0 22px;
		border: 0;
		border-radius: 980px;
		background: var(--accent);
		color: var(--on-accent);
		font: inherit;
		font-size: 14px;
		font-weight: 500;
		white-space: nowrap;
		text-decoration: none;
		cursor: pointer;
	}

	.cta:hover {
		text-decoration: none;
		filter: brightness(1.05);
	}

	.cta.disabled {
		background: var(--surface-2);
		color: var(--ink-3);
		cursor: not-allowed;
	}

	.cta.disabled:hover {
		filter: none;
	}

	@media (max-width: 1023px) {
		.grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}

	@media (max-width: 639px) {
		.page {
			padding-top: 40px;
			padding-bottom: 110px;
		}

		.lede {
			font-size: 15.5px;
		}

		.grid {
			gap: 10px;
		}

		.card {
			grid-template-columns: 1fr;
			gap: 8px;
			padding: 12px;
		}

		.summary {
			font-size: 12px;
		}

		.bag {
			bottom: 12px;
			margin: 0 12px 12px;
			border: 0;
			border-radius: 980px;
			box-shadow: var(--shadow);
		}

		.bag-inner {
			width: auto;
			min-height: 58px;
			margin-inline: 0;
			padding: 0 8px 0 16px;
		}

		.counts {
			font-size: 12px;
		}

		.cta {
			padding: 0 18px;
		}
	}
</style>
