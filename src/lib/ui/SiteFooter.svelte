<script lang="ts">
	import Wordmark from '#lib/ui/Wordmark.svelte';
</script>

<footer class="footer">
	<div class="container footer-inner">
		<a class="brand" href="/" aria-label="stackr"><Wordmark size={16} /></a>
		<p>no server · no accounts · no telemetry</p>
	</div>
</footer>

<style>
	.footer {
		margin-top: 24px;
		border-top: 1px solid var(--line-soft);
	}

	.footer-inner {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 8px 16px;
		padding: 12px 0 16px;
	}

	.brand {
		display: inline-flex;
		align-items: center;
		min-height: 44px;
		text-decoration: none;
	}

	.brand:hover {
		text-decoration: none;
	}

	p {
		font-size: 12px;
		color: var(--ink-3);
	}
</style>
