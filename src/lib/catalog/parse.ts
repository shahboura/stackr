import { parse as parseYaml } from 'yaml';
import { z } from 'zod';
import { isGlobalVar } from './vars.ts';
import { SECRET_KINDS, type SecretKind } from '../secrets/generate.ts';

const frontmatter = z.object({
	name: z.string().min(1),
	slug: z.string().regex(/^[a-z0-9-]+$/),
	category: z.string().min(1),
	summary: z
		.string()
		.min(10)
		.max(70)
		.refine((value) => value.trim().split(/\s+/).length <= 7, {
			message: 'summary must be at most 7 words (it is the card line)'
		}),
	/** What the service changes for the user; shown in the UI as a consequence line. */
	consequence: z.string().min(10).max(160),
	/** What it costs: extra steps, permissions, hardware. */
	cost: z.string().min(5).max(160),
	ports: z.array(z.number().int().min(1).max(65535)).default([]),
	ram: z.string().min(1),
	deps: z.array(z.string()).default([]),
	tags: z.array(z.string()).min(1),
	generators: z.record(z.string(), z.enum(SECRET_KINDS)).default({})
});

export type Service = {
	slug: string;
	name: string;
	category: string;
	summary: string;
	consequence: string;
	cost: string;
	ports: number[];
	ram: string;
	deps: string[];
	tags: string[];
	generators: Record<string, SecretKind>;
	/** Markdown body, rendered on the service page. */
	body: string;
	compose: Record<string, unknown>;
	composeText: string;
	/** Images referenced by this service's compose fragment. */
	images: string[];
	/** Unique ${VARS}, in first-appearance order. */
	vars: string[];
	/** ${*_PORT} variables, in first-appearance order. */
	portVars: string[];
	portDefaults: Record<string, number>;
};

const isRecord = (v: unknown): v is Record<string, unknown> =>
	typeof v === 'object' && v !== null && !Array.isArray(v);

export const scanVars = (text: string): string[] => {
	const seen = new Set<string>();
	for (const match of text.matchAll(/\$\{([A-Z][A-Z0-9_]*)\}/g)) seen.add(match[1]);
	return [...seen];
};

function assertPinnedImage(image: string, slug: string): void {
	if (image.includes('@')) {
		throw new Error(`${slug}: image "${image}" is a digest; use a version tag`);
	}
	const last = image.split('/').pop() ?? '';
	const tag = last.includes(':') ? last.split(':').pop() : '';
	if (!tag || tag === 'latest') {
		throw new Error(`${slug}: image "${image}" must be pinned to a version tag, never :latest`);
	}
}

function validateCompose(doc: unknown, slug: string): Record<string, unknown> {
	if (!isRecord(doc) || !isRecord(doc.services) || Object.keys(doc.services).length === 0) {
		throw new Error(`${slug}/compose.yml: must define at least one service`);
	}
	for (const [name, definition] of Object.entries(doc.services)) {
		if (!isRecord(definition)) throw new Error(`${slug}/compose.yml: service "${name}" is not a map`);
		if ('container_name' in definition) {
			throw new Error(`${slug}/compose.yml: service "${name}" sets container_name`);
		}
		const image = definition.image;
		if (typeof image !== 'string') throw new Error(`${slug}/compose.yml: service "${name}" has no image`);
		assertPinnedImage(image, `${slug}/${name}`);
	}
	return doc;
}

export function parseServiceFile(rawMd: string, rawCompose: string, dirSlug: string): Service {
	const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(rawMd);
	if (!match) throw new Error(`${dirSlug}/service.md: missing --- frontmatter ---`);

	let meta: z.infer<typeof frontmatter>;
	try {
		meta = frontmatter.parse(parseYaml(match[1]) ?? {});
	} catch (error) {
		throw new Error(`${dirSlug}/service.md: ${error instanceof Error ? error.message : error}`);
	}

	if (meta.slug !== dirSlug) {
		throw new Error(`${dirSlug}/service.md: slug "${meta.slug}" must equal its folder name`);
	}

	const body = match[2].trim();
	if (body.length < 200) {
		throw new Error(`${dirSlug}/service.md: needs at least 200 characters of prose for its page`);
	}

	let compose: Record<string, unknown>;
	try {
		compose = validateCompose(parseYaml(rawCompose), dirSlug);
	} catch (error) {
		if (error instanceof Error && error.message.startsWith(dirSlug)) throw error;
		throw new Error(`${dirSlug}/compose.yml: ${error instanceof Error ? error.message : error}`);
	}

	const vars = scanVars(rawCompose);
	const portVars = vars.filter((name) => name.endsWith('_PORT'));
	if (portVars.length !== meta.ports.length) {
		throw new Error(
			`${dirSlug}: frontmatter lists ${meta.ports.length} port(s) but compose.yml uses ` +
				`${portVars.length} \${*_PORT} variable(s) (${portVars.join(', ') || 'none'})`
		);
	}
	const portDefaults = Object.fromEntries(portVars.map((name, i) => [name, meta.ports[i]]));
	const composeServices = compose.services as Record<string, { image: string }>;
	const images = Object.values(composeServices).map((definition) => definition.image);

	for (const name of Object.keys(meta.generators)) {
		if (!vars.includes(name)) {
			throw new Error(`${dirSlug}: generator ${name} is not used in compose.yml`);
		}
	}

	for (const name of vars) {
		if (meta.generators[name] || portDefaults[name] !== undefined || isGlobalVar(name)) continue;
		throw new Error(
			`${dirSlug}/compose.yml: variable \${${name}} is not a generator, a *_PORT var, or a global`
		);
	}

	return {
		...meta,
		body,
		compose,
		composeText: rawCompose,
		images,
		vars,
		portVars,
		portDefaults
	};
}

export function buildCatalog(input: { slug: string; md: string; compose: string }[]): Service[] {
	const services = input.map((file) => parseServiceFile(file.md, file.compose, file.slug));
	const bySlug = new Map(services.map((service) => [service.slug, service]));

	for (const service of services) {
		for (const dep of service.deps) {
			if (!bySlug.has(dep)) throw new Error(`${service.slug}: dep "${dep}" is not in the catalog`);
		}
	}

	return services.sort((a, b) => a.name.localeCompare(b.name));
}
