<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount, tick } from 'svelte';
	import { catalog } from '#lib/catalog/vite';
	import { buildFiles, type BuildResult } from '#lib/compose/emit';
	import { annotateCompose } from '#lib/compose/annotate';
	import { redactEnv } from '#lib/compose/redact';
	import CopyButton from '#lib/ui/CopyButton.svelte';
	import StepHost from '#lib/wizard/StepHost.svelte';
	import StepMedia from '#lib/wizard/StepMedia.svelte';
	import StepPorts from '#lib/wizard/StepPorts.svelte';
	import StepInputs from '#lib/wizard/StepInputs.svelte';
	import StepReview from '#lib/wizard/StepReview.svelte';
	import ResultView from '#lib/ui/ResultView.svelte';
	import { findConflicts, isValidPort, portFields, portValue } from '#lib/wizard/ports';
	import { HOSTS } from '#lib/wizard/presets';
	import { hardlinkStatus } from '#lib/wizard/host';
	import {
		buildValues,
		detectTimezone,
		generateSecrets,
		initialAnswers,
		isValidDataDir,
		isValidId,
		isValidTimezone,
		isValidUmask,
		parseSelection,
		secretCount,
		type Answers
	} from '#lib/wizard/state';

	const STEPS = ['Host', 'Storage', 'Ports', 'Inputs', 'Review'];
	const CTA_LABELS = ['Continue', 'Continue', 'Continue', 'Review', 'Continue'];
	const STEP_COPY = [
		{
			title: '',
			note: ''
		},
		{
			title: 'Where should the files live?',
			note: 'One folder holds downloads, the library and app config. That is what lets the arr apps hardlink a finished download instead of copying it.'
		},
		{
			title: 'Which ports should the stack use?',
			note: 'Every app gets its own host port. A collision is caught here, before anything is generated or downloaded.'
		},
		{
			title: 'Anything only you can answer?',
			note: 'Time zone is the only input. Secrets are generated here, in this browser, and shown in full — there is nothing to write down from a log.'
		},
		{
			title: 'Review before you download',
			note: 'Two files come out: a compose file that references variables, and a .env with the values. Keep them in the same folder.'
		}
	];

	let ready = $state(false);
	let step = $state(0);
	let selected = $state<typeof catalog>([]);
	let answers = $state<Answers>(initialAnswers([], 'linux'));
	let secrets = $state<Record<string, string>>({});
	let result = $state<BuildResult | null>(null);
	let error = $state('');
	let previewTab = $state<'compose' | 'env'>('compose');
	let previewOpen = $state(true);
	let previewTouched = $state(false);
	let showPreviewButton = $state<HTMLButtonElement>();
	let hidePreviewButton = $state<HTMLButtonElement>();
	let annotated = $state(false);
	let canGoBack = $state(false);

	function currentStep(): number {
		const raw = (window.location.hash || window.location.search).replace(/^#/, '');
		const value = Number(new URLSearchParams(raw).get('step'));
		return Number.isInteger(value) && value >= 0 && value <= 4 ? value : 0;
	}

	function onPopState(): void {
		step = currentStep();
		result = null;
		window.scrollTo(0, 0);
		void focusStepHeading();
	}

	/** Announce the new question after a step change, not just the sticky CTA. */
	async function focusStepHeading(): Promise<void> {
		await tick();
		document.getElementById('step-title')?.focus({ preventScroll: true });
	}

	onMount(() => {
		const hash = window.location.hash || window.location.search;
		const picked = parseSelection(hash, catalog);
		if (picked.length === 0) {
			goto('/', { replaceState: true });
			return;
		}
		const desktop = window.matchMedia('(min-width: 1024px)');
		const syncPreview = (event: MediaQueryListEvent) => {
			if (!previewTouched) previewOpen = event.matches;
		};
		selected = picked;
		step = currentStep();
		answers = initialAnswers(picked, 'linux');
		answers.tz = detectTimezone();
		secrets = generateSecrets(picked);
		previewOpen = desktop.matches;
		ready = true;
		desktop.addEventListener('change', syncPreview);
		window.addEventListener('popstate', onPopState);
		return () => {
			desktop.removeEventListener('change', syncPreview);
			window.removeEventListener('popstate', onPopState);
		};
	});

	let conflicts = $derived(findConflicts(selected, answers.ports));
	let fields = $derived(portFields(selected));
	let secretsTotal = $derived(secretCount(selected));
	let sharedMount = $derived(
		selected.some((service) => service.composeText.includes('${DATA_DIR}:/data'))
	);
	let host = $derived(HOSTS.find((preset) => preset.id === answers.host) ?? HOSTS[0]);
	let hardlinks = $derived(hardlinkStatus(host, sharedMount));
	let stepNote = $derived(
		step === 1 && host.platform === 'desktop'
			? 'One folder holds downloads, the library and app config. Docker Desktop shares it through a VM, so imports may copy instead of hardlink.'
			: STEP_COPY[step].note
	);

	let preview = $derived.by(() => {
		try {
			const files = buildFiles({
				services: selected,
				values: buildValues(answers),
				secrets
			});
			return { compose: files.compose, env: files.env, vars: files.vars, error: '' };
		} catch (cause) {
			return {
				compose: '',
				env: '',
				vars: [],
				error: cause instanceof Error ? cause.message : String(cause)
			};
		}
	});

	let secretNames = $derived(
		preview.vars.filter((variable) => variable.kind === 'secret').map((variable) => variable.name)
	);
	let previewText = $derived.by(() => {
		if (preview.error) return '';
		if (previewTab === 'env') return redactEnv(preview.env, secretNames);
		return annotated ? annotateCompose(preview.compose, selected) : preview.compose;
	});
	let copyText = $derived(previewTab === 'env' ? preview.env : preview.compose);

	let stepValid = $derived.by(() => {
		if (step === 0) return isValidId(answers.puid) && isValidId(answers.pgid) && isValidUmask(answers.umask);
		if (step === 1) return isValidDataDir(answers.dataDir, answers.host);
		if (step === 2) {
			return (
				conflicts.length === 0 &&
				fields.every((field) => isValidPort(portValue(field, answers.ports)))
			);
		}
		if (step === 3) {
			return (
				isValidTimezone(answers.tz) &&
				Object.keys(secrets).length === secretsTotal &&
				secretsTotal === selected.reduce((n, s) => n + Object.keys(s.generators).length, 0)
			);
		}
		if (step === 4) {
			return (
				conflicts.length === 0 &&
				fields.every((field) => isValidPort(portValue(field, answers.ports))) &&
				isValidDataDir(answers.dataDir, answers.host) &&
				isValidId(answers.puid) &&
				isValidId(answers.pgid) &&
				isValidUmask(answers.umask) &&
				isValidTimezone(answers.tz) &&
				Object.keys(secrets).length === secretsTotal
			);
		}
		return true;
	});

	let ctaLabel = $derived(CTA_LABELS[step] ?? 'Continue');
	let portsSummary = $derived(
		conflicts.length === 0
			? 'no conflicts'
			: `${conflicts.length} conflict${conflicts.length === 1 ? '' : 's'}`
	);
	let portsSummaryShort = $derived(
		conflicts.length === 0
			? 'ok'
			: `${conflicts.length} conflict${conflicts.length === 1 ? '' : 's'}`
	);

	function syncUrl(mode: 'push' | 'replace'): void {
		const params = new URLSearchParams();
		params.set('s', selected.map((service) => service.slug).join(','));
		params.set('step', String(Math.min(step, 4)));
		const url = `#${params}`;
		const state = { ...history.state, stackrStep: Math.min(step, 4) };
		if (mode === 'push') history.pushState(state, '', url);
		else history.replaceState(state, '', url);
	}

	async function back(): Promise<void> {
		if (step === 0) {
			goto('/');
			return;
		}
		if (canGoBack && history.state?.stackrStep !== undefined) {
			history.back();
			return;
		}
		step -= 1;
		await tick();
		syncUrl('replace');
		window.scrollTo(0, 0);
		await focusStepHeading();
	}

	async function next(): Promise<void> {
		error = '';
		if (!stepValid || step >= 4) return;
		step += 1;
		canGoBack = true;
		await tick();
		syncUrl('push');
		window.scrollTo(0, 0);
		await focusStepHeading();
	}

	async function generate(): Promise<void> {
		error = '';
		try {
			result = buildFiles({ services: selected, values: buildValues(answers), secrets });
			step = 5;
			canGoBack = true;
			await tick();
			syncUrl('push');
			window.scrollTo(0, 0);
			document.getElementById('result-heading')?.focus();
		} catch (cause) {
			error = cause instanceof Error ? cause.message : String(cause);
		}
	}

	function advance(): void {
		if (step === 4) void generate();
		else void next();
	}

	async function openPreview(): Promise<void> {
		previewTouched = true;
		previewOpen = true;
		await tick();
		hidePreviewButton?.focus();
	}

	async function closePreview(): Promise<void> {
		previewTouched = true;
		previewOpen = false;
		await tick();
		showPreviewButton?.focus();
	}
</script>

{#if !result}
	<h1 class="sr-only">Build your stack</h1>
{/if}

<svelte:head>
	<title>Build your stack — stackr</title>
	<meta name="robots" content="noindex, nofollow" />
	<meta
		name="description"
		content="Answer five questions and download a compose.yaml and .env for your self-hosted stack."
	/>
</svelte:head>

{#if !ready}
	<main class="container shell">
		<p class="loading mono">Loading…</p>
	</main>
{:else if result}
	<main class="container shell result-shell">
		<ResultView
			{result}
			{selected}
			{answers}
			onback={async () => {
				result = null;
				step = 4;
				await tick();
				syncUrl('replace');
				window.scrollTo(0, 0);
				await focusStepHeading();
			}}
		/>
	</main>
{:else}
	<main class="container shell">
		<div class="progress">
			<button type="button" class="back" onclick={back}>Back</button>
			<div
				class="segments"
				role="progressbar"
				aria-label="Wizard progress"
				aria-valuemin="1"
				aria-valuemax="5"
				aria-valuenow={step + 1}
				aria-valuetext={`Step ${step + 1} of 5: ${STEPS[step]}`}
			>
				{#each STEPS as label, index (label)}
					<span class="segment" class:done={index <= step}></span>
				{/each}
			</div>
			<span class="step-count mono">Step {step + 1} of 5 · {STEPS[step]}</span>
		</div>

		{#if STEP_COPY[step].title}
			<header class="step-head">
				<h2 id="step-title" tabindex="-1">{STEP_COPY[step].title}</h2>
				<p class="step-note">{stepNote}</p>
			</header>
		{:else}
			<h2 id="step-title" class="sr-only" tabindex="-1">{STEPS[step]}</h2>
		{/if}

		<div class="wizard">
			<aside class="preview" aria-label="Generated compose preview">
				<button
					type="button"
					class="preview-open"
					bind:this={showPreviewButton}
					aria-expanded={!previewOpen}
					aria-controls="preview-panel"
					hidden={previewOpen}
					onclick={openPreview}
				>
					<span class="mono preview-label">Preview</span>
					<span class="mono preview-file">{previewTab === 'env' ? '.env' : 'compose.yaml'}</span>
					<span class="preview-show">Show</span>
				</button>
				<div class="code-card" id="preview-panel" hidden={!previewOpen}>
					<div class="code-head">
						<div class="code-tabs" role="group" aria-label="Preview file">
							<button
								type="button"
								class="code-tab mono"
								aria-controls="preview-panel"
								aria-pressed={previewTab === 'compose'}
								onclick={() => (previewTab = 'compose')}
							>
								compose.yaml
							</button>
							<button
								type="button"
								class="code-tab mono"
								aria-controls="preview-panel"
								aria-pressed={previewTab === 'env'}
								onclick={() => (previewTab = 'env')}
							>
								.env
							</button>
						</div>
						<div class="code-actions">
							{#if !preview.error && previewTab === 'compose'}
								<button
									type="button"
									class="annotate mono"
									aria-pressed={annotated}
									onclick={() => (annotated = !annotated)}
								>
									Annotated
								</button>
							{/if}
							{#if !preview.error}
								<CopyButton text={copyText} compact label="Copy preview" />
							{/if}
							<button
								type="button"
								class="collapse"
								bind:this={hidePreviewButton}
								aria-expanded={previewOpen}
								aria-controls="preview-panel"
								aria-label="Hide preview"
								title="Hide preview"
								onclick={closePreview}
							>
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
									<path d="m18 15-6-6-6 6" />
								</svg>
							</button>
						</div>
					</div>
					{#if preview.error}
						<p class="preview-error" role="alert">{preview.error}</p>
					{:else}
						<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
						<pre class="mono code" tabindex="0" role="region" aria-label={previewTab === 'env' ? '.env preview (secrets masked)' : 'Generated compose file'}>{previewText}</pre>
					{/if}
				</div>
			</aside>

			<section class="options" aria-labelledby="step-title">
				{#if step === 0}
					<StepHost bind:answers {selected} serviceCount={selected.length} />
				{:else if step === 1}
					<StepMedia bind:answers {selected} />
				{:else if step === 2}
					<StepPorts {selected} bind:answers />
				{:else if step === 3}
					<StepInputs {selected} bind:answers {secrets} />
				{:else if step === 4}
					<StepReview {selected} {answers} vars={preview.vars} />
				{/if}
			</section>
		</div>

		{#if error}
			<p class="error" role="alert">{error}</p>
		{/if}

		<footer class="status">
			<div class="status-line mono" role="status" aria-live="polite">
				<span class="wide">Ports — {portsSummary}</span>
				<span class="ports-short">Ports — {portsSummaryShort}</span>
				<span class="dot wide">·</span>
				<span class="wide" class:warn={hardlinks === 'may copy'}>Hardlinks — {hardlinks}</span>
				{#if hardlinks === 'may copy'}
					<span class="dot links-short" aria-hidden="true">·</span>
					<span class="links-short warn">Links — may copy</span>
				{/if}
				<span class="dot">·</span>
				<span>Secrets — {secretsTotal}</span>
			</div>
			<button type="button" class="primary" disabled={!stepValid} onclick={advance}>{ctaLabel}</button>
		</footer>
	</main>
{/if}

<style>
	.shell {
		scroll-padding-bottom: 80px;
		display: flex;
		flex-direction: column;
		min-height: calc(100dvh - 48px);
		padding: 20px 0 0;
	}

	.result-shell {
		padding-bottom: 64px;
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip: rect(0 0 0 0);
		white-space: nowrap;
	}

	.loading {
		padding: 80px 0;
		color: var(--ink-3);
		font-size: 13px;
	}

	.progress {
		display: flex;
		align-items: center;
		gap: 14px;
		margin-bottom: 22px;
	}

	.back {
		display: inline-flex;
		align-items: center;
		min-height: 44px;
		margin-left: -8px;
		padding: 0 8px;
		border: 0;
		border-radius: 8px;
		background: transparent;
		color: var(--accent);
		font-size: 13px;
		font-weight: 500;
	}

	.back:hover {
		background: var(--surface-2);
		color: var(--ink);
	}

	.segments {
		display: flex;
		flex: 1;
		gap: 4px;
		min-width: 0;
	}

	.segment {
		flex: 1;
		height: 3px;
		border-radius: 2px;
		background: var(--line-soft);
	}

	.segment.done {
		background: var(--accent);
	}

	.step-count {
		font-size: 11px;
		color: var(--ink-3);
		white-space: nowrap;
	}

	.step-head {
		display: grid;
		gap: 4px;
		margin-bottom: 18px;
	}

	.step-head h2 {
		font-size: clamp(26px, 3.4vw, 34px);
		line-height: 1.1;
		letter-spacing: -0.03em;
		font-weight: 600;
		text-wrap: balance;
	}

	.step-note {
		max-width: 62ch;
		color: var(--ink-2);
		font-size: 15.5px;
		line-height: 1.5;
	}

	.wizard {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: 18px;
		margin-bottom: 28px;
	}

	.preview {
		min-width: 0;
	}

	.preview-open {
		display: flex;
		align-items: center;
		gap: 10px;
		width: 100%;
		min-height: 56px;
		padding: 0 16px;
		border: 0;
		border-radius: var(--radius);
		background: var(--surface);
		box-shadow: var(--shadow);
		color: var(--ink);
		text-align: left;
	}

	.preview-open:hover {
		background: var(--surface-2);
	}

	.preview-open:hover .preview-show {
		color: var(--ink);
	}

	.preview-label {
		font-size: 10px;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--ink-3);
	}

	.preview-file {
		font-size: 11.5px;
		color: var(--ink-2);
	}

	.preview-show {
		margin-left: auto;
		color: var(--accent);
		font-size: 13px;
		font-weight: 500;
	}

	.preview-open[hidden],
	.code-card[hidden] {
		display: none;
	}

	.code-card {
		background: var(--surface);
		border-radius: var(--radius-sm);
		box-shadow: var(--shadow);
		overflow: hidden;
	}

	.code-head {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 8px 12px;
		padding: 10px 14px;
		border-bottom: 1px solid var(--line-soft);
	}

	.code-head :global(button) {
		min-height: 44px;
	}

	.code-tabs {
		display: flex;
		flex-shrink: 0;
		gap: 2px;
		padding: 2px;
		background: var(--surface-2);
		border-radius: 9px;
	}

	.code-tab {
		border: 0;
		border-radius: 7px;
		padding: 0 10px;
		background: transparent;
		color: var(--ink-2);
		font-size: 11px;
	}

	.code-tab[aria-pressed='true'] {
		background: var(--seg-active);
		color: var(--ink);
		box-shadow: var(--shadow);
	}

	.code-actions {
		display: flex;
		align-items: center;
		flex-shrink: 0;
		gap: 4px;
	}

	.collapse {
		display: grid;
		place-items: center;
		width: 44px;
		min-height: 44px;
		padding: 0;
		border: 0;
		border-radius: 8px;
		background: transparent;
		color: var(--ink-3);
	}

	.collapse:hover {
		background: var(--surface-2);
		color: var(--ink);
	}

	.collapse svg {
		width: 16px;
		height: 16px;
	}

	.annotate {
		border: 0;
		background: transparent;
		color: var(--accent);
		padding: 0 8px;
		font-size: 11.5px;
	}

	.code {
		margin: 0;
		padding: 14px;
		font-size: 11.5px;
		line-height: 1.65;
		color: var(--ink-2);
		max-height: 320px;
		overflow: auto;
		white-space: pre;
	}

	.preview-error {
		padding: 14px;
		font-size: 13px;
		line-height: 1.5;
		color: var(--warn);
	}

	.options {
		min-width: 0;
	}

	.status {
		position: sticky;
		bottom: 0;
		z-index: 9;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		margin-top: auto;
		margin-inline: -24px;
		padding: 12px 24px;
		background: color-mix(in srgb, var(--surface) 94%, transparent);
		backdrop-filter: saturate(180%) blur(20px);
		border-top: 1px solid var(--line-soft);
	}

	.status-line {
		display: flex;
		align-items: center;
		gap: 8px;
		min-width: 0;
		font-size: 11.5px;
		color: var(--ink-2);
		white-space: nowrap;
	}

	.dot {
		color: var(--ink-3);
	}

	.warn {
		color: var(--warn);
	}

	.ports-short {
		display: none;
	}

	.links-short {
		display: none;
	}

	.primary {
		flex-shrink: 0;
		min-height: 44px;
		padding: 0 22px;
		border: 0;
		border-radius: 980px;
		background: var(--accent);
		color: var(--on-accent);
		font-size: 14px;
		font-weight: 500;
	}

	.primary:hover:not(:disabled) {
		filter: brightness(1.05);
	}

	.primary:disabled {
		background: var(--surface-2);
		color: var(--ink-3);
		cursor: not-allowed;
	}

	.error {
		margin: 0 0 16px;
		padding: 12px 16px;
		border-radius: var(--radius-sm);
		background: color-mix(in srgb, var(--warn) 10%, var(--surface));
		color: var(--warn);
		font-size: 13px;
	}

	@media (min-width: 1024px) {
		.step-head {
			grid-template-columns: minmax(0, 1fr) 520px;
			align-items: end;
			gap: 28px;
			margin-bottom: 20px;
		}

		.step-note {
			max-width: 46ch;
			font-size: 15px;
		}

		.wizard {
			grid-template-columns: minmax(0, 1fr) 520px;
			gap: 28px;
			align-items: start;
		}

		.preview {
			position: sticky;
			top: 72px;
		}

		.code {
			max-height: max(240px, 64dvh);
		}
	}

	@media (max-width: 639px) {
		.progress {
			gap: 8px;
		}

		.step-count {
			font-size: 10px;
		}

		.code {
			max-height: 220px;
		}

		.status {
			gap: 10px;
			margin-inline: -16px;
			padding: 10px 16px;
		}

		.status-line {
			gap: 6px;
			font-size: 11px;
		}

		.wide {
			display: none;
		}

		.ports-short {
			display: inline;
		}

		.links-short {
			display: inline;
		}

		.primary {
			padding: 0 16px;
		}
	}
</style>
