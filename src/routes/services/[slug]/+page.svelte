<script lang="ts">
	import { SITE_URL } from '#lib/site';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let service = $derived(data.service);
	let canonical = $derived(`${SITE_URL}/services/${service.slug}`);
	let title = $derived(`${service.name} — docker compose for a self-hosted ${service.category} stack · stackr`);
	let jsonLd = $derived(
		JSON.stringify({
			'@context': 'https://schema.org',
			'@type': 'SoftwareApplication',
			name: service.name,
			description: service.summary,
			applicationCategory: 'ServerApplication',
			operatingSystem: 'Linux',
			url: canonical,
			offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }
		}).replace(/</g, '\\u003c')
	);
	let jsonLdTag = $derived(`<script type="application/ld+json">${jsonLd}<\/script>`);
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={service.summary} />
	<link rel="canonical" href={canonical} />
	<meta property="og:type" content="article" />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={service.summary} />
	<meta property="og:url" content={canonical} />
	<meta name="twitter:card" content="summary" />
	{@html jsonLdTag}
</svelte:head>

<main class="container page">
	<a class="back" href="/">
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
			<path d="m12 19-7-7 7-7" />
			<path d="M19 12H5" />
		</svg>
		All services
	</a>

	<header class="head">
		<p class="eyebrow mono">
			<span>{service.category}</span>
			<span class="sep">·</span>
			<span>{service.ports.length} port{service.ports.length === 1 ? '' : 's'}</span>
			<span class="sep">·</span>
			<span>{service.ram}</span>
		</p>

		<div class="identity">
			<span class="tile">
				<img src={`/icons/${service.slug}.svg`} alt="" width="32" height="32" />
			</span>
			<h1>{service.name}</h1>
		</div>

		<p class="lede">{service.summary}</p>

		<div class="actions">
			<a class="primary" href={`/build#s=${service.slug}`}>Add to build</a>
			<a class="ghost" href="/">See all services</a>
		</div>
	</header>

	<div class="facts">
		<div class="fact">
			<h2 class="label mono">What it changes</h2>
			<p>{service.consequence}</p>
		</div>
		<div class="fact">
			<h2 class="label mono">What it costs</h2>
			<p>{service.cost}</p>
		</div>
	</div>

	{#if service.slug === 'dozzle'}
		<div class="warn">
			<strong>The Docker socket is root on this host.</strong>
			Dozzle reads every container log and, with actions enabled, controls the containers. The
			<code>:ro</code> mount only marks the socket file read-only — it does not restrict the Docker API.
			Keep port {service.ports[0]} on your LAN.
		</div>
	{/if}

	<div class="body">
		<article class="prose">
			{@html data.html}
		</article>

		<aside class="side">
			<div class="tech">
				<div class="head-row">
					<span class="label mono">Container</span>
					<span class="label mono">pinned</span>
				</div>
				<pre class="mono image">{service.images[0]}</pre>
				<div class="rows">
					<div class="row">
						<span>Host port</span>
						<span class="mono">{service.ports.join(', ')}</span>
					</div>
					<div class="row">
						<span>RAM guide</span>
						<span class="mono">{service.ram}</span>
					</div>
					<div class="row">
						<span>Tags</span>
						<span class="mono">{service.tags.join(', ')}</span>
					</div>
				</div>
			</div>

			{#if data.deps.length > 0}
				<div class="pairs">
					<h2 class="label mono">Pairs with</h2>
					<ul>
						{#each data.deps as dep (dep.slug)}
							<li>
								<a href={`/services/${dep.slug}`}>
									<span class="dep-name">{dep.name}</span>
									<span class="dep-summary">{dep.summary}</span>
								</a>
							</li>
						{/each}
					</ul>
				</div>
			{/if}
		</aside>
	</div>
</main>

<style>
	.page {
		padding: 28px 0 64px;
	}

	.back {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		min-height: 44px;
		font-size: 13px;
		color: var(--ink-3);
		margin-bottom: 4px;
	}

	.back svg {
		width: 15px;
		height: 15px;
	}

	.back:hover {
		color: var(--accent);
		text-decoration: none;
	}

	.head {
		max-width: 760px;
		padding-bottom: 22px;
	}

	.label {
		font-size: 10.5px;
		font-weight: 400;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--ink-3);
	}

	.eyebrow {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		font-size: 10.5px;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--ink-3);
		margin-bottom: 12px;
	}

	.sep {
		opacity: 0.6;
	}

	.identity {
		display: flex;
		align-items: center;
		gap: 16px;
	}

	.tile {
		flex: none;
		width: 58px;
		height: 58px;
		border-radius: var(--radius-sm);
		background: var(--surface-2);
		box-shadow: var(--shadow);
		display: grid;
		place-items: center;
	}

	.tile img {
		display: block;
		width: 32px;
		height: 32px;
	}

	h1 {
		min-width: 0;
		font-size: clamp(38px, 7vw, 58px);
		line-height: 1.05;
		letter-spacing: -0.035em;
		font-weight: 600;
		overflow-wrap: break-word;
	}

	.lede {
		margin-top: 14px;
		font-size: 17px;
		line-height: 1.5;
		color: var(--ink-2);
		max-width: 54ch;
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		margin-top: 20px;
	}

	.primary,
	.ghost {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: 44px;
		border-radius: 980px;
		font-size: 14px;
		text-decoration: none;
	}

	.primary {
		background: var(--accent);
		color: var(--on-accent);
		padding: 0 22px;
		font-weight: 500;
	}

	.primary:hover {
		text-decoration: none;
		filter: brightness(1.05);
	}

	.ghost {
		color: var(--accent);
		padding: 0 18px;
	}

	.ghost:hover {
		background: var(--surface-2);
		text-decoration: none;
	}

	.facts {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 12px;
		max-width: 760px;
		margin-bottom: 16px;
	}

	.fact {
		min-width: 0;
		background: var(--surface);
		border-radius: var(--radius);
		box-shadow: var(--shadow);
		padding: 16px 18px;
	}

	.fact .label {
		margin-bottom: 6px;
	}

	.fact p {
		max-width: 60ch;
		font-size: 16px;
		line-height: 1.45;
		color: var(--ink);
	}

	.warn {
		max-width: 760px;
		margin-bottom: 20px;
		padding: 13px 16px;
		border-radius: var(--radius-sm);
		background: color-mix(in srgb, var(--warn) 10%, var(--surface));
		color: color-mix(in srgb, var(--warn) 80%, var(--ink));
		font-size: 13px;
		line-height: 1.6;
	}

	.warn strong {
		font-weight: 600;
	}

	.warn code {
		font-family: var(--mono);
		font-size: 0.92em;
		padding: 1px 5px;
		border-radius: 4px;
		background: color-mix(in srgb, var(--warn) 16%, transparent);
	}

	.body {
		display: grid;
		grid-template-columns: minmax(0, 1fr) 320px;
		gap: 24px;
		align-items: start;
	}

	.prose {
		min-width: 0;
		background: var(--surface);
		border-radius: var(--radius);
		box-shadow: var(--shadow);
		padding: 26px 28px 28px;
		font-size: 16px;
		line-height: 1.6;
		letter-spacing: -0.01em;
		color: var(--ink-2);
	}

	.prose :global(h2) {
		max-width: 60ch;
		margin: 26px 0 8px;
		font-size: 20px;
		font-weight: 600;
		line-height: 1.2;
		letter-spacing: -0.02em;
		color: var(--ink);
	}

	.prose :global(h2:first-child) {
		margin-top: 0;
	}

	.prose :global(p) {
		max-width: 60ch;
		margin: 0 0 12px;
	}

	.prose :global(p:last-child) {
		margin-bottom: 0;
	}

	.prose :global(ul) {
		max-width: 60ch;
		margin: 0 0 12px;
		padding-left: 20px;
	}

	.prose :global(li) {
		margin-bottom: 4px;
	}

	.prose :global(strong) {
		font-weight: 600;
		color: var(--ink);
	}

	.prose :global(code) {
		font-family: var(--mono);
		font-size: 0.9em;
		padding: 1px 5px;
		border-radius: 5px;
		background: var(--surface-2);
		color: var(--ink);
	}

	.prose :global(pre) {
		max-width: 100%;
		padding: 12px 14px;
		border-radius: 10px;
		background: var(--surface-2);
		overflow-x: auto;
	}

	.prose :global(pre code) {
		padding: 0;
		background: none;
	}

	.prose :global(a) {
		color: var(--accent);
		text-decoration: underline;
	}

	.side {
		display: flex;
		flex-direction: column;
		gap: 14px;
		min-width: 0;
	}

	.tech {
		padding: 16px 18px;
		border-radius: var(--radius);
		background: var(--tech-bg);
		color: var(--tech-ink);
	}

	.tech .head-row {
		display: flex;
		justify-content: space-between;
		gap: 10px;
		padding-bottom: 10px;
		border-bottom: 1px solid var(--tech-line);
	}

	.tech .label {
		font-family: var(--mono);
		color: var(--tech-mute);
	}

	.tech .image {
		margin: 12px 0;
		font-size: 11.5px;
		line-height: 1.6;
		color: var(--tech-accent);
		overflow-wrap: anywhere;
		white-space: pre-wrap;
	}

	.tech .rows {
		display: flex;
		flex-direction: column;
		gap: 6px;
		padding-top: 10px;
		border-top: 1px solid var(--tech-line);
	}

	.tech .row {
		display: flex;
		justify-content: space-between;
		gap: 12px;
		font-size: 11.5px;
		color: var(--tech-mute);
	}

	.tech .row .mono {
		color: var(--tech-ink);
		text-align: right;
		overflow-wrap: anywhere;
	}

	.pairs {
		padding: 16px 18px;
		border-radius: var(--radius);
		background: var(--surface);
		box-shadow: var(--shadow);
	}

	.pairs h2 {
		margin-bottom: 4px;
	}

	.pairs ul {
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.pairs li {
		border-bottom: 1px solid var(--line-soft);
	}

	.pairs li:last-child {
		border-bottom: 0;
	}

	.pairs a {
		display: flex;
		flex-direction: column;
		justify-content: center;
		gap: 1px;
		min-height: 44px;
		padding: 8px 0;
		color: var(--ink);
		text-decoration: none;
	}

	.pairs a:hover {
		text-decoration: none;
	}

	.pairs .dep-name {
		font-size: 13.5px;
		font-weight: 500;
		color: var(--accent);
	}

	.pairs a:hover .dep-name {
		text-decoration: underline;
	}

	.pairs .dep-summary {
		font-size: 13px;
		line-height: 1.4;
		color: var(--ink-3);
	}

	@media (max-width: 900px) {
		.body {
			grid-template-columns: 1fr;
		}

		.side {
			max-width: 560px;
		}

		.facts {
			grid-template-columns: 1fr;
			max-width: 760px;
		}
	}

	@media (max-width: 640px) {
		.page {
			padding-top: 20px;
		}

		.head {
			padding-bottom: 18px;
		}

		.identity {
			gap: 14px;
		}

		.facts {
			gap: 10px;
		}

		.fact {
			padding: 14px 16px;
		}

		.prose {
			padding: 20px 18px 22px;
		}

		.primary,
		.ghost {
			width: 100%;
		}
	}
</style>
