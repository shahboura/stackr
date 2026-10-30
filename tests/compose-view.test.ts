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

	test('multi-container services annotate each container with its own image', () => {
		const immich = bySlug(catalog, 'immich')[0];
		const output = buildFiles({
			services: [immich],
			values: BASE_VALUES,
			secrets: { DB_PASSWORD: 'abcdefghijklmnopqrstuvwxyz012345' }
		});
		const annotated = annotateCompose(output.compose, [immich]);
		expect(annotated).toContain('# image ghcr.io/immich-app/immich-server:v3.3.5 | port 2283');
		expect(annotated).toContain('# image ghcr.io/immich-app/postgres:16-vectorchord0.5.3-pgvector0.8.1');
		expect(annotated).toContain('# image valkey/valkey:9.0.7-alpine3.24');
	});

	test('env preview redacts generated secret lines only', () => {
		const redacted = redactEnv(files.env, ['SEERR_API_KEY']);
		expect(redacted).toContain('SEERR_API_KEY=••••••••••••');
		expect(redacted).not.toContain('0123456789abcdef0123456789abcdef');
		expect(redacted).toContain('TZ=Etc/UTC');
		expect(files.env).toContain('SEERR_API_KEY=0123456789abcdef0123456789abcdef');
	});
});
