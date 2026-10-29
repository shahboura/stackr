import type { Service } from '../catalog/parse';

/** Display-only annotated view; the plain compose string is never changed. */
export function annotateCompose(compose: string, services: Service[]): string {
	const byName = new Map<string, Service>();
	for (const service of services) {
		const definitions = service.compose.services;
		if (typeof definitions !== 'object' || definitions === null) continue;
		for (const name of Object.keys(definitions)) byName.set(name, service);
	}

	return compose
		.split('\n')
		.map((line) => {
			const match = /^ {2}([A-Za-z0-9_-]+):$/.exec(line);
			const service = match ? byName.get(match[1]) : undefined;
			if (!service) return line;
			const port = service.ports[0] ? ` | port ${service.ports[0]}` : '';
			return `  # ${service.name} — ${service.consequence}\n  # image ${service.images[0]}${port}\n${line}`;
		})
		.join('\n');
}
