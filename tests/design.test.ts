import { describe, expect, test } from 'bun:test';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('../', import.meta.url).pathname;

function files(dir: string): string[] {
	return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
		const path = join(dir, entry.name);
		return entry.isDirectory() ? files(path) : [path];
	});
}

const svelteFiles = files(join(root, 'src')).filter((path) => path.endsWith('.svelte'));

describe('design conformance', () => {
	test('the tokens DESIGN.md names exist in app.css', () => {
		const css = readFileSync(join(root, 'src/app.css'), 'utf8');
		for (const token of [
			'--bg',
			'--surface',
			'--surface-2',
			'--ink',
			'--ink-2',
			'--ink-3',
			'--line',
			'--line-soft',
			'--accent',
			'--ok',
			'--warn',
			'--tech-bg',
			'--tech-line',
			'--tech-ink',
			'--tech-mute',
			'--tech-accent',
			'--radius',
			'--radius-sm',
			'--shadow'
		]) {
			expect(css).toContain(`${token}:`);
		}
	});

	test('components do not hardcode hex colours', () => {
		const offenders = svelteFiles.filter((path) => /#[0-9a-fA-F]{3,8}\b/.test(readFileSync(path, 'utf8')));
		expect(offenders).toEqual([]);
	});

	test('--tech-* tokens stay inside the technical cards', () => {
		const allowed = new Set([
			'src/lib/ui/ResultView.svelte',
			'src/lib/ui/CopyButton.svelte',
			'src/lib/ui/SecretValue.svelte',
			'src/routes/services/[slug]/+page.svelte'
		]);
		const offenders = svelteFiles
			.map((path) => path.slice(root.length))
			.filter((path) => !allowed.has(path))
			.filter((path) => readFileSync(join(root, path), 'utf8').includes('--tech-'));
		expect(offenders).toEqual([]);
	});
});
