import { describe, expect, test } from 'bun:test';
import { bySlug, loadCatalog } from './helpers/catalog';
import {
	buildValues,
	dataDirs,
	generateSecrets,
	initialAnswers,
	isValidDataDir,
	parseIdOutput,
	parseSelection,
	secretCount,
	selectionUrl,
	shellQuote
} from '../src/lib/wizard/state';
import { findConflicts, isValidPort, portFields, suggestPort, usedPorts } from '../src/lib/wizard/ports';

const catalog = loadCatalog();
const media = catalog.filter((service) => service.category === 'media');

describe('wizard state', () => {
	test('selection lives in the hash, never the query', () => {
		expect(selectionUrl(media)).toBe(`/build#s=${media.map((service) => service.slug).join(',')}`);
	});

	test('parses hash and legacy query selections, preserving order and dropping duplicates', () => {
		expect(parseSelection('#s=sonarr,jellyfin', catalog).map((s) => s.slug)).toEqual(['sonarr', 'jellyfin']);
		expect(parseSelection('?s=jellyfin,ghost,jellyfin', catalog).map((s) => s.slug)).toEqual(['jellyfin']);
		expect(parseSelection('', catalog)).toEqual([]);
	});

	test('initial answers seed every host port and resolve to compose values', () => {
		const answers = initialAnswers(media);
		expect(Object.keys(answers.ports)).toEqual(portFields(media).map((field) => field.varName));
		const values = buildValues(answers);
		expect(values.TZ).toBe('Etc/UTC');
		expect(values.JELLYFIN_PORT).toBe('8096');
		expect(values.QBITTORRENT_TORRENTING_PORT).toBe('6881');
	});

	test('generates one value per service generator and validates shapes', () => {
		const secrets = generateSecrets(catalog);
		expect(Object.keys(secrets).sort()).toEqual(['DB_PASSWORD', 'SEERR_API_KEY']);
		expect(secrets.DB_PASSWORD).toMatch(/^[A-Za-z0-9]{32}$/);
		expect(secrets.SEERR_API_KEY).toMatch(/^[0-9a-f]{32}$/);
		expect(secretCount(catalog)).toBe(2);
	});

	test('data dirs include every host folder the selected services mount', () => {
		const selected = bySlug(catalog, 'immich', 'audiobookshelf');
		const dirs = dataDirs(selected, '/srv/media');
		expect(dirs).toContain('/srv/media/appdata/immich/library');
		expect(dirs).toContain('/srv/media/appdata/audiobookshelf/config');
		expect(dirs).toContain('/srv/media/media/audiobooks');
		expect(dirs).not.toContain('/srv/media');
		expect(dirs).not.toContain('/srv/media/appdata/immich/postgres');
	});

	test('Windows data dirs keep the drive prefix', () => {
		const selected = bySlug(catalog, 'jellyfin');
		expect(dataDirs(selected, 'C:/Users/Public/media')).toContain(
			'C:/Users/Public/media/appdata/jellyfin'
		);
	});

	test('default ports do not collide; a collision is detected before the result', () => {
		const answers = initialAnswers(media);
		expect(findConflicts(media, answers.ports)).toEqual([]);
		answers.ports.SONARR_PORT = 8096;
		const conflicts = findConflicts(media, answers.ports);
		expect(conflicts).toHaveLength(1);
		expect(conflicts[0].port).toBe(8096);
		expect(suggestPort(8096, usedPorts(media, answers.ports))).toBe(8097);
	});

	test('port and path validators reject the obvious failures', () => {
		expect(isValidPort(0)).toBe(false);
		expect(isValidPort(65536)).toBe(false);
		expect(isValidPort(8096)).toBe(true);
		expect(isValidDataDir('/srv/media')).toBe(true);
		expect(isValidDataDir('srv/media')).toBe(false);
		expect(isValidDataDir('/srv/media/')).toBe(false);
		expect(isValidDataDir('/srv/media/..')).toBe(false);
		expect(isValidDataDir('/srv/media\nrm -rf ~')).toBe(false);
		expect(isValidDataDir('/srv/media:1')).toBe(false);
		expect(isValidDataDir('/srv/$media')).toBe(false);
		expect(isValidDataDir('/srv/my media')).toBe(true);
		expect(isValidDataDir('C:/Users/Public/media', 'windows')).toBe(true);
		expect(isValidDataDir('C:\\Users\\Public\\media', 'windows')).toBe(false);
		expect(isValidDataDir('C:/', 'windows')).toBe(false);
		expect(isValidDataDir('/srv/media', 'windows')).toBe(false);
		expect(isValidDataDir('C:/Users/Pub|lic', 'windows')).toBe(false);
		expect(isValidDataDir('C:/Users/a?', 'windows')).toBe(false);
		expect(isValidDataDir('C:/Users/a.', 'windows')).toBe(false);
		expect(isValidDataDir('C:/Users/a ', 'windows')).toBe(false);
		expect(isValidDataDir('/Users/Shared/media', 'macos')).toBe(true);
	});

	test('host presets seed the right path for each platform', () => {
		expect(initialAnswers(media, 'windows').dataDir).toBe('C:/Users/Public/media');
		expect(initialAnswers(media, 'macos').dataDir).toBe('/Users/Shared/media');
		expect(initialAnswers(media, 'windows').puid).toBe('1000');
	});

	test('shell quoting keeps spaces and apostrophes literal', () => {
		expect(shellQuote('/srv/my media')).toBe("'/srv/my media'");
		expect(shellQuote("/srv/it's")).toBe("'/srv/it'\\''s'");
	});

	test('numeric input values are coerced before they reach compose', () => {
		const answers = initialAnswers(media);
		(answers as unknown as { puid: number }).puid = 1000;
		(answers as unknown as { pgid: number }).pgid = 1000;
		const values = buildValues(answers);
		expect(values.PUID).toBe('1000');
		expect(values.PGID).toBe('1000');
	});

	test('parses PUID/PGID out of pasted id output', () => {
		expect(parseIdOutput('uid=1000(bob) gid=1000(bob) groups=1000(bob),27(sudo)')).toEqual({
			puid: '1000',
			pgid: '1000'
		});
		expect(parseIdOutput('uid=99(nobody) gid=100(users)')).toEqual({ puid: '99', pgid: '100' });
		expect(parseIdOutput('not an id line')).toEqual({ puid: null, pgid: null });
	});
});
