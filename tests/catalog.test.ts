import { describe, expect, test } from 'bun:test';
import { buildCatalog, parseServiceFile } from '../src/lib/catalog/parse';
import { loadCatalog } from './helpers/catalog';

const BODY = `# Test\n\n${'Prose about the service, its ports and its storage. '.repeat(6)}`;

const serviceMd = (meta: Record<string, string | number[]> = {}): string => {
	const defaults: Record<string, string | number[]> = {
		name: 'Test',
		slug: 'test',
		category: 'media',
		summary: 'Small service for schema tests',
		consequence: 'Adds one small thing to the stack for the schema test.',
		cost: 'Nothing beyond the schema test.',
		ports: '[8080]',
		ram: '1 GB',
		deps: '[]',
		tags: '[test]',
		generators: '{}'
	};
	const merged = { ...defaults, ...meta };
	const lines = Object.entries(merged).map(([key, value]) =>
		Array.isArray(value) ? `${key}: ${JSON.stringify(value)}` : `${key}: ${value}`
	);
	return `---\n${lines.join('\n')}\n---\n${BODY}`;
};

const compose = (fragment = ''): string => `services:
  test:
    image: example/test:1.0
    ports:
      - "\${TEST_PORT}:8080"
${fragment}`;

describe('service.md schema', () => {
	test('parses a valid folder and derives variables and ports', () => {
		const service = parseServiceFile(
			serviceMd({ generators: '{ TEST_TOKEN: hex32 }' }),
			compose(`    environment:\n      TOKEN: \${TEST_TOKEN}\n`),
			'test'
		);
		expect(service.portVars).toEqual(['TEST_PORT']);
		expect(service.portDefaults).toEqual({ TEST_PORT: 8080 });
		expect(service.generators).toEqual({ TEST_TOKEN: 'hex32' });
		expect(service.vars).toEqual(['TEST_PORT', 'TEST_TOKEN']);
	});

	test('rejects a slug that does not match the folder', () => {
		expect(() => parseServiceFile(serviceMd({ slug: 'other' }), compose(), 'test')).toThrow(
			/must equal its folder name/
		);
	});

	test('rejects a summary over 70 characters', () => {
		expect(() => parseServiceFile(serviceMd({ summary: 'x'.repeat(71) }), compose(), 'test')).toThrow();
	});

	test('rejects a summary over seven words, even when short enough', () => {
		expect(() =>
			parseServiceFile(serviceMd({ summary: 'one two three four five six seven eight' }), compose(), 'test')
		).toThrow(/at most 7 words/);
	});

	test('requires a consequence and a cost', () => {
		const noConsequence = serviceMd().replace(/^consequence:.*$/m, '');
		expect(() => parseServiceFile(noConsequence, compose(), 'test')).toThrow();
		const noCost = serviceMd().replace(/^cost:.*$/m, '');
		expect(() => parseServiceFile(noCost, compose(), 'test')).toThrow();
	});

	test('rejects a generator that compose never uses', () => {
		expect(() =>
			parseServiceFile(serviceMd({ generators: '{ UNUSED: hex32 }' }), compose(), 'test')
		).toThrow(/generator UNUSED is not used/);
	});

	test('rejects an unknown variable', () => {
		expect(() => parseServiceFile(serviceMd(), compose('    environment:\n      X: ${NOPE}\n'), 'test')).toThrow(
			/not a generator/
		);
	});

	test('rejects a port-var count that disagrees with frontmatter', () => {
		expect(() => parseServiceFile(serviceMd({ ports: '[8080, 8081]' }), compose(), 'test')).toThrow(
			/frontmatter lists 2 port/
		);
	});

	test('rejects :latest and unpinned images', () => {
		const latest = 'services:\n  test:\n    image: example/test:latest\n';
		expect(() => parseServiceFile(serviceMd({ ports: '[]' }), latest, 'test')).toThrow(/never :latest/);
		const untagged = 'services:\n  test:\n    image: example/test\n';
		expect(() => parseServiceFile(serviceMd({ ports: '[]' }), untagged, 'test')).toThrow(/must be pinned/);
		const digest =
			'services:\n  test:\n    image: example/test@sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa\n';
		expect(() => parseServiceFile(serviceMd({ ports: '[]' }), digest, 'test')).toThrow(/digest/);
	});

	test('rejects container_name', () => {
		const named = 'services:\n  test:\n    image: example/test:1.0\n    container_name: test\n';
		expect(() => parseServiceFile(serviceMd({ ports: '[]' }), named, 'test')).toThrow(/container_name/);
	});

	test('requires prose, not just frontmatter', () => {
		const thin = `---\nname: Test\nslug: test\ncategory: media\nsummary: A small service used here\nconsequence: Adds one small thing to the stack.\ncost: Nothing yet.\nports: []\nram: 1 GB\ndeps: []\ntags: [test]\ngenerators: {}\n---\n# Test\n`;
		expect(() => parseServiceFile(thin, compose(), 'test')).toThrow(/at least 200 characters/);
	});
});

describe('catalog', () => {
	test('names and summaries are unique, so page titles and descriptions are', () => {
		const catalog = loadCatalog();
		expect(new Set(catalog.map((service) => service.name)).size).toBe(catalog.length);
		expect(new Set(catalog.map((service) => service.summary)).size).toBe(catalog.length);
	});

	test('every service folder has a pinned image and at least one port', () => {
		for (const service of loadCatalog()) {
			expect(service.images.length).toBeGreaterThan(0);
			expect(service.images.every((image) => !image.endsWith(':latest'))).toBe(true);
			expect(service.ports.length).toBeGreaterThan(0);
		}
	});

	test('every service has a consequence, a cost, and a <=7 word card line', () => {
		for (const service of loadCatalog()) {
			expect(service.consequence.length).toBeGreaterThan(10);
			expect(service.cost.length).toBeGreaterThan(5);
			expect(service.summary.trim().split(/\s+/).length).toBeLessThanOrEqual(7);
		}
	});

	test('rejects a dep that does not exist', () => {
		expect(() =>
			buildCatalog([{ slug: 'test', md: serviceMd({ deps: '[ghost]' }), compose: compose() }])
		).toThrow(/dep "ghost" is not in the catalog/);
	});
});
