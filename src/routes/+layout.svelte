<script lang="ts">
	import '@fontsource-variable/inter';
	import '@fontsource-variable/jetbrains-mono';
	import interFont from '@fontsource-variable/inter/files/inter-latin-wght-normal.woff2?url';
	import monoFont from '@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2?url';
	import '../app.css';
	import favicon from '#lib/assets/favicon.svg';
	import SiteFooter from '#lib/ui/SiteFooter.svelte';
	import ThemeSwitch from '#lib/ui/ThemeSwitch.svelte';
	import Wordmark from '#lib/ui/Wordmark.svelte';
	import { page } from '$app/state';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
	let buildRoute = $derived(page.url.pathname === '/build');
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<meta name="color-scheme" content="light dark" />
	<link rel="preload" href={interFont} as="font" type="font/woff2" crossorigin="anonymous" />
	<link rel="preload" href={monoFont} as="font" type="font/woff2" crossorigin="anonymous" />
</svelte:head>

<header class="nav">
	<div class="container nav-inner">
		{#if buildRoute}
			<a class="brand back-link" href="/">Catalog</a>
		{:else}
			<a class="brand" href="/"><Wordmark /></a>
		{/if}
		<span class="tagline">compose, without the guesswork</span>
		<div class="theme-wrap"><ThemeSwitch /></div>
	</div>
</header>

{@render children()}

<SiteFooter />

<style>
	.nav {
		position: sticky;
		top: 0;
		z-index: 10;
		height: 48px;
		border-bottom: 1px solid var(--line-soft);
		background: color-mix(in srgb, var(--bg) 94%, transparent);
		backdrop-filter: saturate(180%) blur(20px);
		-webkit-backdrop-filter: saturate(180%) blur(20px);
	}

	.nav-inner {
		height: 48px;
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.brand {
		display: inline-flex;
		align-items: center;
		align-self: stretch;
		text-decoration: none;
	}

	.brand:hover {
		text-decoration: none;
	}

	.back-link {
		font-size: 12.5px;
		color: var(--ink-2);
	}

	.theme-wrap {
		margin-left: auto;
	}

	.tagline {
		font-size: 12px;
		color: var(--ink-3);
	}

	@media (max-width: 520px) {
		.theme-wrap {
		margin-left: auto;
	}

	.tagline {
			display: none;
		}
	}
</style>
