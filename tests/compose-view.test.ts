import { describe, expect, test } from 'bun:test';
import { buildFiles } from '../src/lib/compose/emit';
import { annotateCompose } from '../src/lib/compose/annotate';
import { redactEnv } from '../src/lib/compose/redact';
import { BASE_VALUES, bySlug, loadCatalog } from './helpers/catalog';

const catalog = loadCatalog();
const services = bySlug(catalog, 'jellyfin', 'sonarr', 'seerr');
const files = buildFiles({
	services,
	values: BASE_VALUES,
	secrets: { SEERR_API_KEY: '0123456789abcdef0123456789abcdef' }
});

describe('compose views', () => {
	test('the plain view is the download string, untouched', () => {
		expect(files.compose).toBe(buildFiles({
			services,
			values: BASE_VALUES,
			secrets: { SEERR_API_KEY: '0123456789abcdef0123456789abcdef' }
		}).compose);
	});

	test('annotation adds comments without removing the plain lines', () => {
		const annotated = annotateCompose(files.compose, services);
		expect(annotated).toContain('# Jellyfin — Adds a web player');
		expect(annotated).toContain('services:');
		for (const line of files.compose.split('\n').filter((line) => line.trim() !== '')) {
			expect(annotated).toContain(line);
		}
	});

	test('annotation with no matching services leaves the string unchanged', () => {
		expect(annotateCompose(files.compose, [])).toBe(files.compose);
	});

	test('env preview redacts generated secret lines only', () => {
		const redacted = redactEnv(files.env, ['SEERR_API_KEY']);
		expect(redacted).toContain('SEERR_API_KEY=••••••••••••');
		expect(redacted).not.toContain('0123456789abcdef0123456789abcdef');
		expect(redacted).toContain('TZ=Etc/UTC');
		expect(files.env).toContain('SEERR_API_KEY=0123456789abcdef0123456789abcdef');
	});
});
