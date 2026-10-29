import { describe, expect, test } from 'bun:test';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
	generateSecret,
	isSecret,
	SECRET_KINDS,
	SECRET_NOTES,
	type SecretKind
} from '../src/lib/secrets/generate';

describe('secret generators', () => {
	for (const kind of SECRET_KINDS) {
		test(`${kind} produces valid values that never collide`, () => {
			const seen = new Set<string>();
			for (let i = 0; i < 10_000; i++) {
				const value = generateSecret(kind);
				expect(isSecret(kind, value)).toBe(true);
				seen.add(value);
			}
			expect(seen.size).toBe(10_000);
		});
	}

	test('every kind has a human explanation for the .env comment', () => {
		for (const kind of SECRET_KINDS) expect(SECRET_NOTES[kind].length).toBeGreaterThan(20);
	});

	test('rejects values from the wrong kind', () => {
		expect(isSecret('hex32', 'f'.repeat(31))).toBe(false);
		expect(isSecret('alnum32', 'a'.repeat(31) + '/')).toBe(false);
		expect(isSecret('uuid', generateSecret('hex32') as SecretKind)).toBe(false);
	});
});

function sourceFiles(dir: string): string[] {
	return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
		const path = join(dir, entry.name);
		if (entry.isDirectory()) return sourceFiles(path);
		return /\.(ts|svelte)$/.test(entry.name) ? [path] : [];
	});
}

test('no Math.random calls anywhere in src', () => {
	const offenders = sourceFiles(new URL('../src', import.meta.url).pathname).filter((path) =>
		/Math\.random\s*\(/.test(readFileSync(path, 'utf8'))
	);
	expect(offenders).toEqual([]);
});
