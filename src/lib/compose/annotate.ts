import type { Service } from '../catalog/parse';

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === 'object' && value !== null && !Array.isArray(value);

/** Display-only annotated view; the plain compose string is never changed. */
export function annotateCompose(compose: string, services: Service[]): string {
	const byName = new Map<string, { service: Service; image: string; port?: number }>();
	for (const service of services) {
		const definitions = service.compose.services;
		if (!isRecord(definitions)) continue;
		for (const [name, definition] of Object.entries(definitions)) {
			if (!isRecord(definition) || typeof definition.image !== 'string') continue;
			byName.set(name, {
				service,
				image: definition.image,
				port: Array.isArray(definition.ports) ? service.ports[0] : undefined
			});
		}
	}

	return compose
		.split('\n')
		.map((line) => {
			const match = /^ {2}([A-Za-z0-9_-]+):$/.exec(line);
			const entry = match ? byName.get(match[1]) : undefined;
			if (!entry) return line;
			const port = entry.port ? ` | port ${entry.port}` : '';
			return `  # ${entry.service.name} — ${entry.service.consequence}\n  # image ${entry.image}${port}\n${line}`;
		})
		.join('\n');
}
