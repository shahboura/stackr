<script lang="ts">
	let {
		name,
		group,
		consequence,
		cost,
		active = false,
		disabled = false,
		reason,
		onclick
	}: {
		/** Option label. */
		name: string;
		/** Native radio group name. */
		group: string;
		consequence: string;
		cost: string;
		active?: boolean;
		disabled?: boolean;
		reason?: string;
		onclick?: () => void;
	} = $props();
</script>

<label class="option" class:active class:disabled>
	<input
		type="radio"
		name={group}
		checked={active}
		{disabled}
		onchange={() => onclick?.()}
	/>
	<span class="text">
		<span class="name">{name}</span>
		<span class="consequence">{consequence}</span>
		<span class="cost">{cost}</span>
		{#if disabled && reason}
			<span class="reason">{reason}</span>
		{/if}
	</span>
</label>

<style>
	.option {
		display: grid;
		grid-template-columns: 20px minmax(0, 1fr);
		gap: 12px;
		align-items: start;
		width: 100%;
		min-height: 44px;
		padding: 14px 16px;
		text-align: left;
		background: var(--surface);
		color: var(--ink);
		cursor: pointer;
	}

	.option:not(:first-child) {
		border-top: 1px solid var(--line-soft);
	}

	.option:hover:not(.disabled) {
		background: var(--surface-2);
	}

	.option.disabled {
		cursor: not-allowed;
	}

	input {
		appearance: none;
		width: 20px;
		height: 20px;
		margin: 1px 0 0;
		border: 1px solid var(--line);
		border-radius: 50%;
		background: var(--surface);
		cursor: inherit;
	}

	input:checked {
		border: 5px solid var(--accent);
	}

	input:disabled {
		cursor: not-allowed;
	}

	.text {
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
	}

	.name {
		font-size: 15px;
		font-weight: 600;
		line-height: 1.35;
	}

	.consequence {
		font-size: 13px;
		line-height: 1.45;
		color: var(--ink-2);
	}

	.cost {
		font-size: 12.5px;
		line-height: 1.45;
		color: var(--ink-3);
	}

	.disabled .name {
		color: var(--ink-2);
	}

	.reason {
		margin-top: 2px;
		font-size: 12.5px;
		line-height: 1.45;
		color: var(--warn);
	}
</style>
