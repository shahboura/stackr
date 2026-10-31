import { describe, expect, test } from 'bun:test';
import { serviceMatches } from '../src/lib/catalog/search';
import { bySlug, loadCatalog } from './helpers/catalog';

const catalog = loadCatalog();
const [immich, jellyfin, sonarr] = bySlug(catalog, 'immich', 'jellyfin', 'sonarr');

describe('catalog search', () => {
	test('an empty or whitespace query matches every service', () => {
		expect(serviceMatches(immich, '')).toBe(true);
		expect(serviceMatches(immich, '   ')).toBe(true);
	});

	test('matches name, summary, tags, port, RAM and dependency metadata', () => {
		expect(serviceMatches(immich, 'immich')).toBe(true);
		expect(serviceMatches(immich, 'backup')).toBe(true);
		expect(serviceMatches(immich, 'backups')).toBe(true);
		expect(serviceMatches(immich, '2283')).toBe(true);
		expect(serviceMatches(immich, '8 GB')).toBe(true);
		expect(serviceMatches(sonarr, 'jellyfin')).toBe(true);
		expect(serviceMatches(jellyfin, 'vaultwarden')).toBe(false);
	});

	test('category is searchable metadata after the filter is removed', () => {
		expect(serviceMatches(immich, 'photos')).toBe(true);
		expect(serviceMatches(jellyfin, 'media')).toBe(true);
		expect(serviceMatches(jellyfin, 'photos')).toBe(false);
	});

	test('trims and ignores case', () => {
		expect(serviceMatches(jellyfin, '  JELLYFIN  ')).toBe(true);
		expect(serviceMatches(jellyfin, 'MeDiA')).toBe(true);
	});
});
