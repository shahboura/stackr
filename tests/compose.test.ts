import { describe, expect, test } from 'bun:test';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { parse as parseYaml } from 'yaml';
import { buildFiles } from '../src/lib/compose/emit';
import { BASE_VALUES, bySlug, loadCatalog } from './helpers/catalog';

const GOLDEN = new URL('./golden/media/', import.meta.url).pathname;
const UPDATE = process.env.UPDATE_GOLDEN === '1';
const SECRETS = { SEERR_API_KEY: '0123456789abcdef0123456789abcdef' };
const SLUGS = ['jellyfin', 'sonarr', 'radarr', 'prowlarr', 'qbittorrent', 'seerr', 'dozzle'];

function compare(name: 'compose.yaml' | '.env', actual: string): void {
	const path = join(GOLDEN, name);
	if (UPDATE) {
		mkdirSync(dirname(path), { recursive: true });
		writeFileSync(path, actual);
		return;
	}
	if (!existsSync(path)) throw new Error(`${path} is missing — run UPDATE_GOLDEN=1 bun test`);
	expect(actual).toBe(readFileSync(path, 'utf8'));
}

describe('media bundle output', () => {
	const catalog = loadCatalog();
	const services = bySlug(catalog, ...SLUGS);

	const result = buildFiles({
		services,
		values: BASE_VALUES,
		secrets: SECRETS
	});

	test('compose.yaml is byte-stable and matches the golden file', () => {
		compare('compose.yaml', result.compose);
		expect(buildFiles({ services, values: BASE_VALUES, secrets: SECRETS }).compose).toBe(result.compose);
	});

	test('.env is byte-stable and matches the golden file', () => {
		compare('.env', result.env);
		expect(buildFiles({ services, values: BASE_VALUES, secrets: SECRETS }).env).toBe(result.env);
	});

	test('files end with exactly one newline', () => {
		for (const text of [result.compose, result.env]) {
			expect(text.endsWith('\n')).toBe(true);
			expect(text.endsWith('\n\n')).toBe(false);
		}
	});

	test('every compose variable is present in .env', () => {
		const names = result.vars.map((v) => v.name);
		expect(names).toContain('TZ');
		expect(names).toContain('DATA_DIR');
		expect(names).toContain('JELLYFIN_PORT');
		expect(names).toContain('SONARR_PORT');
		expect(names).toContain('SEERR_API_KEY');
		for (const name of names) {
			expect(result.env).toContain(`${name}=`);
		}
	});

	test('the generated secret is real, commented, and referenced by compose', () => {
		expect(result.env).toContain('SEERR_API_KEY=0123456789abcdef0123456789abcdef');
		expect(result.env).toContain('# SEERR_API_KEY: 32 hex characters');
		expect(result.compose).toContain('API_KEY: ${SEERR_API_KEY}');
	});

	test('all seven services are present, with no :latest tag', () => {
		const doc = parseYaml(result.compose) as { services: Record<string, { image: string }> };
		expect(Object.keys(doc.services).sort()).toEqual([...SLUGS].sort());
		for (const service of Object.values(doc.services)) {
			expect(service.image.endsWith(':latest')).toBe(false);
		}
	});

	test('the arr stack shares one /data mount and identical PUID/PGID/UMASK', () => {
		const doc = parseYaml(result.compose) as {
			services: Record<string, { environment: Record<string, string>; volumes: string[] }>;
		};
		for (const name of ['sonarr', 'radarr', 'qbittorrent']) {
			const service = doc.services[name];
			expect(service.volumes).toContain('${DATA_DIR}:/data');
			expect(service.environment.PUID).toBe('${PUID}');
			expect(service.environment.PGID).toBe('${PGID}');
			expect(service.environment.UMASK).toBe('${UMASK}');
		}
	});

	test('ports cannot be invalid', () => {
		const broken = { ...BASE_VALUES, SONARR_PORT: '0' };
		expect(() => buildFiles({ services, values: broken, secrets: SECRETS })).toThrow(/between 1 and 65535/);
	});

	test('a numeric PUID from a number input is coerced, not thrown at', () => {
		const result = buildFiles({
			services,
			values: { ...BASE_VALUES, PUID: 1000 as unknown as string },
			secrets: SECRETS
		});
		expect(result.env).toContain('PUID=1000');
	});

	test('environment rows carry type, default and required provenance', () => {
		const byName = new Map(result.vars.map((variable) => [variable.name, variable]));
		expect(byName.get('TZ')).toMatchObject({ type: 'text', defaultValue: 'Etc/UTC', required: true });
		expect(byName.get('JELLYFIN_PORT')).toMatchObject({
			type: 'port',
			defaultValue: '8096',
			required: true
		});
		expect(byName.get('SEERR_API_KEY')).toMatchObject({
			type: 'hex32',
			defaultValue: '—',
			required: true
		});
	});

	test('a missing or malformed secret is a build error, not a placeholder', () => {
		expect(() => buildFiles({ services, values: BASE_VALUES, secrets: {} })).toThrow(/needs a generated value/);
		expect(() =>
			buildFiles({ services, values: BASE_VALUES, secrets: { SEERR_API_KEY: 'not-a-key' } })
		).toThrow(/not a valid hex32/);
	});
});
