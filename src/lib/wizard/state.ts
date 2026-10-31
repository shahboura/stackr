import type { Service } from '../catalog/parse';
import { generateSecret } from '../secrets/generate';
import { HOSTS } from './presets';
import { portFields } from './ports';

export type Answers = {
	host: string;
	dataDir: string;
	puid: string;
	pgid: string;
	umask: string;
	tz: string;
	/** One entry per host port variable. */
	ports: Record<string, number>;
};

export function initialAnswers(services: Service[], hostId = 'linux'): Answers {
	const host = HOSTS.find((candidate) => candidate.id === hostId) ?? HOSTS[0];
	return {
		host: host.id,
		dataDir: host.dataDir,
		puid: host.puid,
		pgid: host.pgid,
		umask: host.umask,
		tz: 'Etc/UTC',
		ports: Object.fromEntries(portFields(services).map((field) => [field.varName, field.defaultPort]))
	};
}

export function generateSecrets(services: Service[]): Record<string, string> {
	const secrets: Record<string, string> = {};
	for (const service of services) {
		for (const [name, kind] of Object.entries(service.generators)) {
			secrets[name] ??= generateSecret(kind);
		}
	}
	return secrets;
}

export const secretCount = (services: Service[]): number =>
	new Set(services.flatMap((service) => Object.keys(service.generators))).size;

/** Compose values include the globals and the host ports; secrets are separate. */
export function buildValues(answers: Answers): Record<string, string> {
	return {
		TZ: String(answers.tz),
		PUID: String(answers.puid),
		PGID: String(answers.pgid),
		UMASK: String(answers.umask),
		DATA_DIR: String(answers.dataDir),
		...Object.fromEntries(Object.entries(answers.ports).map(([name, port]) => [name, String(port)]))
	};
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === 'object' && value !== null && !Array.isArray(value);

const QUOTE = String.fromCharCode(39);
const QUOTE_SLASH_QUOTE = `${QUOTE}\\${QUOTE}${QUOTE}`;

/** Single-quote a path for sh, so spaces and punctuation stay literal. */
export const shellQuote = (value: string): string =>
	`${QUOTE}${value.split(QUOTE).join(QUOTE_SLASH_QUOTE)}${QUOTE}`;

/**
 * Host folders the selected services mount under DATA_DIR. Docker creates missing
 * bind-mount folders as root, so the setup command must create them before `up`.
 * The catalog uses the short `host:container` volume syntax only.
 */
export function dataDirs(services: Service[], dataDir: string): string[] {
	const found = new Set<string>();
	for (const service of services) {
		const definitions = service.compose.services;
		if (!isRecord(definitions)) continue;
		for (const definition of Object.values(definitions)) {
			if (!isRecord(definition) || !Array.isArray(definition.volumes)) continue;
			for (const volume of definition.volumes) {
				if (typeof volume !== 'string') continue;
				const host = volume.split(':')[0];
				if (!host.startsWith('${DATA_DIR}')) continue;
				const path = `${dataDir}${host.slice('${DATA_DIR}'.length)}`;
				if (path !== dataDir) found.add(path);
			}
		}
	}
	return [...found].sort();
}

/** Preserve the order in the URL; drop unknown and duplicate slugs. */
export function parseSelection(search: string, catalog: Service[]): Service[] {
	const params = new URLSearchParams(search.replace(/^#/, ''));
	const raw = params.get('s') ?? '';
	const seen = new Set<string>();
	const services: Service[] = [];
	for (const slug of raw.split(',').map((value) => value.trim())) {
		if (!slug || seen.has(slug)) continue;
		const service = catalog.find((candidate) => candidate.slug === slug);
		if (!service) continue;
		seen.add(slug);
		services.push(service);
	}
	return services;
}

/** Hash, not query: wizard permutations must never reach the index (LEARNINGS.md). */
export const selectionUrl = (services: Service[]): string =>
	`/build#s=${services.map((service) => service.slug).join(',')}`;

export function detectTimezone(): string {
	try {
		return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Etc/UTC';
	} catch {
		return 'Etc/UTC';
	}
}

export const isValidTimezone = (value: string): boolean => /^[A-Za-z0-9_+\-/]+$/.test(value.trim());

export const isValidDataDir = (value: string, hostId = 'linux'): boolean => {
	const common =
		value.length > 1 &&
		!value.endsWith('/') &&
		!value.includes('$') &&
		!/[\x00-\x1f]/.test(value) &&
		!value.split('/').includes('..');
	if (hostId === 'windows') {
		return (
			/^[A-Za-z]:\/[^/]/.test(value) &&
			common &&
			!value.slice(2).includes(':') &&
			!/[<>"|?*]/.test(value) &&
			!/[. ]$/.test(value)
		);
	}
	return value.startsWith('/') && !value.startsWith('//') && !value.includes(':') && common;
};

export const isValidId = (value: string): boolean => /^\d{1,10}$/.test(value);

export const isValidUmask = (value: string): boolean => /^[0-7]{3,4}$/.test(value);

/** Accept the whole `id` line: uid=1000(bob) gid=1000(bob) groups=... */
export function parseIdOutput(text: string): { puid: string | null; pgid: string | null } {
	return {
		puid: /uid=(\d+)/.exec(text)?.[1] ?? null,
		pgid: /gid=(\d+)/.exec(text)?.[1] ?? null
	};
}
